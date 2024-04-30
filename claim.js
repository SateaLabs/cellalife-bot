const ethers = require("ethers");
const csv = require("csv-parser");
const fs = require("fs");

const config = require("./config.json");

const eventSolAbi = ["function sendClaimEnergyRequest()"];

let provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");

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
      // claim
      const eventContract = new ethers.Contract(
        config.eventContractAddress,
        eventSolAbi,
        wallet
      );
      const sendClaimEnergyRequestTx =
        await eventContract.sendClaimEnergyRequest();
      console.log(
        "签名地址[%s]: %s,Claim Energy: %s",
        i,
        wallet.address,
        sendClaimEnergyRequestTx.hash
      );
    }catch(e){
      console.log(i,walletInfo.address,"发生错误,重新尝试...",e);
      i--
    }
  }
})();
