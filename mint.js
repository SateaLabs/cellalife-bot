const ethers = require("ethers");
const axios = require("axios");
const csv = require("csv-parser");
const fs = require("fs");

const config = require("./config.json");
const CellSolAbi = require("./CellSolAbi.json");
const lifeSeeds = require("./seeds.json");

let provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");

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
  const walletList = await readCsv("./walletlist.csv");
  let seedIndex = 0;
  let mintResult = [];
  for (let i = 0; i < walletList.length; i++) {
    const walletInfo = walletList[i];
    try {
      const lifeSeed = lifeSeeds[seedIndex];
      const wallet = new ethers.Wallet(walletInfo.privateKey, provider);
      // mint life
      const cellContract = new ethers.Contract(
        config.cellContractAddress,
        CellSolAbi,
        wallet
      );
      const lifePrice = await getPrice(cellContract, lifeSeed);
      console.log("lifePrice:", lifePrice);
      const balance = await provider.getBalance(walletInfo.address);
      if (balance <= lifePrice) {
        console.log(
          "钱包[%s][%s] 余额不足 %s,需要金额 %s",
          i,
          walletInfo.address,
          balance,
          lifePrice
        );
        continue;
      }
      const createLifeTx = await cellContract.createLife(lifeSeed, {
        value: lifePrice,
      });
      console.log(
        "钱包地址[%s][%s]: price: %s,%s,mint life: %s",
        i,
        seedIndex,
        lifePrice,
        wallet.address,
        createLifeTx.hash
      );
      // update seedIndex
      if (seedIndex >= lifeSeeds.length - 1) {
        seedIndex = 0;
      } else {
        seedIndex++;
      }
    } catch (e) {
      console.log(i, walletInfo.address, "发生错误,重新尝试...", e);
      i--;
    }
  }
})();
