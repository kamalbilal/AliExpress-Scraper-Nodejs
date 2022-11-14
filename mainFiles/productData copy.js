global.defaultCookies = {};
const startScraper = require("../modules/startScraper");
const getProductData = require("../modules/getProductData");
const transformProductData = require("../modules/transformProductData");
const checkAllImages_andWriteToFile = require("../modules/checkMainImagesByOCR");
const glob = require("glob");
const fs = require("fs");
const WriteToFile_WithoutCheckingImages = require("../modules/WriteToFile_WithoutCheckingImages");

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

async function main() {
  let checkImages = await fs.readFileSync("variables/checkImages.txt", "utf8");
  checkImages = isNaN(checkImages) ? 0 : checkImages * 1;
  const files = await Glob("output/searchProducts_Output/*.txt");
  let lastSeachedProducts = await fs.readFileSync("variables/lastSearchedProductData.json", "utf8");
  lastSeachedProducts = lastSeachedProducts ? await JSON.parse(lastSeachedProducts) : {};
  for (let index = 0; index < files.length; index++) {
    const fileDir = files[index];
    let startFromIndex = 0;
    let startFromDir = fileDir;

    const filename = fileDir.split("output/searchProducts_Output/")[1].split(".txt")[0].toLowerCase();
    let fileData = await fs.readFileSync(fileDir, "utf8");
    const fileLength = fileData.split("\n").length

    fileData = fileData.split("\n");
    if (lastSeachedProducts.hasOwnProperty(filename)) {
      const lastSearchProductId = String(lastSeachedProducts[filename]);
      const index_of = fileData.indexOf(lastSearchProductId);
      if (index_of == fileData.length - 1 || index_of == fileData.length - 2) {
        console.log("Already Done file = " + filename + ".txt");
        continue;
      } else {
        startFromIndex = index_of + 1;
        startFromDir = fileDir;
      }
    }
    while (startFromIndex < fileLength) {
      console.log("\n");
      console.log({ startFromIndex: `${startFromIndex}/${fileLength}`, filename });
      const element = fileData[startFromIndex];
      if (!element) {
        startFromIndex += 1;
        continue;
      }
      let productsArray = [];
      for (let index = 0; index < 10; index++) {
        const id = fileData[startFromIndex];
        id ? productsArray.push(id) : "";
        startFromIndex += 1;
      }

      const productsDataArray = await getProductData(productsArray);
      let I_Need_Array = await transformProductData(productsDataArray);
      if (checkImages == 1) {
        await checkAllImages_andWriteToFile(I_Need_Array);
      } else {
        WriteToFile_WithoutCheckingImages(I_Need_Array);
      }
      await fs.writeFileSync("variables/lastSearchedProductData.json", JSON.stringify({ ...lastSeachedProducts, [filename]: productsArray[productsArray.length - 1] }));
    }
  }

  console.log("\nAll Completed\n");
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

  console.log("\nCompleted\n");
}

module.exports = { getAllProductsData, getSingleProductData };
