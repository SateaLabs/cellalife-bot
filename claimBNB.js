const ethers = require("ethers");
const axios = require("axios");
const csv = require("csv-parser");
const fs = require("fs");

const config = require("./config.json");
const CellSolAbi = require("./CellSolAbi.json");
const lifeSeeds = require("./seeds1.json");
const needMintList = require("./temp.json");

const lifeSolAbi = [
  "function buyFood(uint256[],uint256) public",
  "function _foodPrices(uint256) public view returns(uint256)",
];

const claimBNBAbi = [
  "function claim() public",
];

const eventSolAbi = ["function sendClaimEnergyRequest()"];

const oneDay = 86400;

let provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");


async function getLifeSeed(apiKey) {
  const url = "https://api.nodyy.com/v1/data";
  const options = {
    headers: {
      "X-API-KEY": apiKey,
    },
  };
  return await axios.get(url, options);
}

function getParentTokenIds(lifeSeed) {
  const parentTokenIds = [];
  for (let i = 0; i < lifeSeed.length; i++) {
    parentTokenIds.push(lifeSeed[i][0]);
  }
  return parentTokenIds;
}

async function getPrice(cellContract, lifeSeed) {
  const parentTokenIds = getParentTokenIds(lifeSeed);
  // console.log(parentTokenIds);
  const priceList = await cellContract.getLifePrice(parentTokenIds);
  let totalPrice = BigInt(0);
  for (let price of priceList) {
    totalPrice += price;
  }
  return totalPrice;
}

async function getRestTokenIds(walletAddress) {
  const url =
    "https://factoryapi.cellula.life/getRestTokenIds?ethAddress=" +
    walletAddress;
    const res=await axios.get(url);
  const restLifeTemps = res.data.data;
  let restLifes = [];
  for (let i = 0; i < restLifeTemps.length; i++) {
    restLifes.push(BigInt(restLifeTemps[i]));
  }
  return restLifes;
}

async function buyFood(lifeContract, restLifes, day) {
  if (restLifes.length == 0) {
    return;
  }
  const foodWorkTime = BigInt(oneDay * day);
  const foodPrice = await lifeContract._foodPrices(foodWorkTime);
  const totalFoodPrice = foodPrice * BigInt(restLifes.length);
  console.log(totalFoodPrice)
  return await lifeContract.buyFood(restLifes, foodWorkTime, {
    value: totalFoodPrice,
  });
}


async function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = fs
      .createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function saveDataToFile(path, data) {
  const jsonData = JSON.stringify(data);
  fs.writeFile(path, jsonData, (err) => {
    if (err) {
      throw err;
    }
    console.log("JSON data is saved.");
  });
}

(async () => {
  const walletList= await readCsv("./walletlist.csv");
  let seedIndex = 0;
  let mintResult=[];
  for (let i = 1; i < 401; i++) {
    const walletInfo = walletList[i];
    try{
      const wallet = new ethers.Wallet(walletInfo.privateKey, provider);
      // claim BNB
        const claimBNBContract = new ethers.Contract(
        config.claimBNB,
        claimBNBAbi,
        wallet
      );
      const sendClaimBNBRequestTx =
        await claimBNBContract.claim();
      console.log(
        i,
        "签名地址: %s,Claim BNB: %s",
        wallet.address,
        sendClaimBNBRequestTx.hash
      );
    }catch(e){
      console.log(i,walletInfo.address,"发生错误",e)
      // i--
    }
  }
  // await saveDataToFile("saveDataToFile.json",mintResult)
})();
