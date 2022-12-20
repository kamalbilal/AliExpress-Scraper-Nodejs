const oldScraper = require("./oldScraper");
const newScraper = require("./newScraper");
const descriptionModifier = require("./descriptionModifier")
const fs = require("fs");
const handleErrors = require("./handleErrors");

const transformData = (promise) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (promise["status"] === "fulfilled") {
        let I_Need;
        if (promise["value"]["scraperUsed"] === "old") {
          
          I_Need = await oldScraper(promise["value"]["data"]["data"], promise["value"]["link"], promise["value"]["old_productId"]);
        } else if (promise["value"]["scraperUsed"] === "new") {

          I_Need = await newScraper(promise["value"]["data"]["data"], promise["value"]["link"], promise["value"]["old_productId"]);
        }

        if (I_Need === false) {
          reject("page not found")
          return
        }
        
        I_Need["modified_description_content"] = await descriptionModifier(I_Need["description_Link"], I_Need["productId"])
        resolve(I_Need);
      } else {
        handleErrors(promise)
        reject(true)
      }
    } catch (error) {
      console.log(error);
      await fs.writeFileSync(`output/rejected/${promise["value"]["old_productId"]}.txt`, `Reason ==> ${error}`);
      reject("Error transforming data");
    }
  });
};

async function transformProductData(list) {
  return await Promise.allSettled(list.map((e) => transformData(e)));
}

module.exports = transformProductData;
