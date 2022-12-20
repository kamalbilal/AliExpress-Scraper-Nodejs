global.defaultCookies = {};
global.failedCount = 0
const startScraper = require("../modules/startScraper");
const getProductData = require("../modules/getProductData");
const transformProductData = require("../modules/transformProductData");
const checkAllImages_andWriteToFile = require("../modules/checkMainImagesByOCR");
const glob = require("glob");
const fs = require("fs");
const WriteToFile_WithoutCheckingImages = require("../modules/WriteToFile_WithoutCheckingImages");
const chalk = require("chalk");

const LIMIT = 8 // get 25 products at a time

function Glob(query) {
  return new Promise((resolve, reject) => {
    glob(query, null, function (er, files) {
      resolve(files);
    });
  });
}

async function getAllProductsData() {
  await startScraper();
  main();
}
async function getAllProductsDataFromArray(productIdArray, isRejectedOnce = true) {
  await startScraper();
  await mainFromArray(productIdArray, isRejectedOnce);
  
}

async function getList() {
  let lastSearchedProductData = fs.readFileSync("variables/lastSearchedProductData.json", "utf8");
  lastSearchedProductData = lastSearchedProductData ? JSON.parse(lastSearchedProductData) : {};
  const files = await Glob("output/searchProducts_Output/*.txt");
  if (files.length === 0) {
    return {status: "no files found"}
  }
  for (let index = 0; index < files.length; index++) {
    const fileDir = files[index];
    const filename = fileDir.split("/")[2].split(".txt")[0];
    const file = fs.readFileSync(fileDir, "utf8").split("\n");
    let startFromIndex = file.indexOf(lastSearchedProductData[filename] != "" ? lastSearchedProductData[filename] : "start from 0 index");
    if (startFromIndex != -1) {
      startFromIndex += 1;
      let data = file.splice(startFromIndex);
      if (data[data.length - 1] === "") {
        data.pop();
      }
      if (data.length === 0 || (data.length === 1 && data[0] === "")) {
        continue;
      }
      if (lastSearchedProductData.hasOwnProperty(filename)) {
        return { status: "run", filename, data: data, length: data.length, lastSearchedProductData};
      }
    } else {
      file[file.length - 1] === "" ? file.pop() : "";
      return { status: "run", filename, data: file, length: file.length ,lastSearchedProductData};
    }
  }

  return { status: "All Completed" };
}

function splitArrays(inputArray, perChunk) {
  return inputArray.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
}

async function mainFromArray(productIdArray, isRejectedOnce) {
  let checkImages = await fs.readFileSync("variables/checkImages.txt", "utf8");
  checkImages = isNaN(checkImages) ? 0 : checkImages * 1; 
  // main code start
  productIdArray = await splitArrays(productIdArray, LIMIT);
  for (let index = 0; index < productIdArray.length; index++) {
    const remainingLog = productIdArray.length - ((index + 1) * LIMIT);
    console.log(chalk.greenBright(`\nRemaining ==> ${remainingLog <= 0 ? 0 : remainingLog}/${productIdArray.length}`));
    const productsDataArray = await getProductData(productIdArray[index], isRejectedOnce);
    let I_Need_Array = await transformProductData(productsDataArray);
    if (checkImages == 1) {
      await checkAllImages_andWriteToFile(I_Need_Array);
    } else {
      WriteToFile_WithoutCheckingImages(I_Need_Array);
    }
  }
  // main code end
  if (browser) {
    await browser.close()
  }
    return
}
async function main() {
  let checkImages = await fs.readFileSync("variables/checkImages.txt", "utf8");
  checkImages = isNaN(checkImages) ? 0 : checkImages * 1;
  let runWhileLoop = true;
  while (runWhileLoop) {
    const data = await getList();
    if (data.status === "run") {
      // main code start
      data["data"] = await splitArrays(data["data"], LIMIT);
      for (let index = 0; index < data["data"].length; index++) {
        const remainingLog = data["length"] - ((index + 1) * LIMIT);
        console.log(chalk.greenBright(`\nRemaining ==> ${remainingLog <= 0 ? 0 : remainingLog}/${data["length"]} : Filename ==> ${data["filename"]}`));
        const productsDataArray = await getProductData(data["data"][index]);
        let I_Need_Array = await transformProductData(productsDataArray);
        if (checkImages == 1) {
          await checkAllImages_andWriteToFile(I_Need_Array);
        } else {
          WriteToFile_WithoutCheckingImages(I_Need_Array);
        }
        await fs.writeFileSync("variables/lastSearchedProductData.json", JSON.stringify({ ...data["lastSearchedProductData"], [data["filename"]]: data["data"][index][data["data"][index].length - 1] }));
      }
      // main code end
    } else if (data.status === "no files found") {
      console.log(chalk.redBright("---------No searched files found, Please Search All Categories first!!---------"));
      runWhileLoop = false;
    }
    else {
      runWhileLoop = false;
      console.log("All Completed");
    }
  }
}

async function getSingleProductData(productId) {
  await startScraper();
  mainSingleProduct(productId);
}

async function mainSingleProduct(productId) {
  let checkImages = await fs.readFileSync("variables/checkImages.txt", "utf8");
  checkImages = isNaN(checkImages) ? 0 : checkImages * 1;
  const productsDataArray = await getProductData([productId]);
  let I_Need_Array = await transformProductData(productsDataArray);
  if (checkImages == 1) {
    await checkAllImages_andWriteToFile(I_Need_Array);
  } else {
    WriteToFile_WithoutCheckingImages(I_Need_Array);
  }
  // await fs.writeFileSync("variables/lastSearchedProductData.json", JSON.stringify({ ...lastSeachedProducts, [filename]: productsArray[productsArray.length - 1] }));
  
  if (browser) {
    await browser.close()
  }
  console.log("\nCompleted\n");
}

module.exports = { getAllProductsData, getSingleProductData, getAllProductsDataFromArray };
