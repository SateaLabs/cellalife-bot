const ethers = require("ethers");
const axios = require("axios");
const csv = require("csv-parser");
const fs = require("fs");

const config = require("./config.json");

const lifeSolAbi = [
  "function buyFood(uint256[],uint256) public",
  "function _foodPrices(uint256) public view returns(uint256)",
];


const oneDay = 86400;

let provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");


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
  // console.log(totalFoodPrice)
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

(async () => {
  const walletList= await readCsv("./walletlist.csv");
  for (let i = 0; i < walletList.length; i++) {
    const walletInfo = walletList[i];
    try{
      const wallet = new ethers.Wallet(walletInfo.privateKey, provider);
      // buy food
      const lifeContract = new ethers.Contract(
        config.lifeContractAddress,
        lifeSolAbi,
        wallet
      );
      const restLifes = await getRestTokenIds(wallet.address);
      console.log("查询到需要喂食的life: %s",restLifes)
      if (restLifes.length != 0) {
        const buyFoodTx = await buyFood(lifeContract, restLifes, 7);
        console.log("签名地址[%s]: %s,Buy Food: %s",i, wallet.address, buyFoodTx.hash);
      }
    }catch(e){
      console.log(i,walletInfo.address,"发生错误,重新尝试...",e);
      i--
    }
  }
})();
