const cheerio = require("cheerio");
const fs = require("fs");
const glob = require("glob");
const rimraf = require("rimraf");
const insertOrUpdate_ProductData = require("./createProductToDb_Queries")

function Glob(query) {
  return new Promise((resolve, reject) => {
    glob(query, null, function (er, files) {
      resolve(files);
    });
  });
}

function arrayToDic(array) {
  const mydict = {};
  array.forEach((element, index) => {
    mydict[index] = { link: element, extractedText: null };
  });

  return mydict;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function createImagesData(mainImages, modified_description, productId) {
  return new Promise(async (resolve, reject) => {
    const $ = cheerio.load(modified_description);
    const all_urls = $("img")
      .map((i, x) => $(x).attr("src"))
      .toArray();

    resolve({ mainImages: arrayToDic(mainImages), productId: productId, all_urls: arrayToDic(all_urls) });
  });
}

async function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + ":" + seconds + "(" + ampm + ")";
  return strTime;
}

async function check_OCR_Finished_by_automate() {
  console.log(`\nWaiting for text Extraction, Waiting started on {${await formatAMPM(new Date(Date.now()))}}...`);
  await fs.writeFileSync("automateStatus.txt", "Not Extracted");
  let check = true;
  while (check) {
    if ((await fs.readFileSync("automateStatus.txt", "utf8")) === "Extracted") {
      check = false;
    } else {
      await sleep(2000);
    }
  }
  console.log(`Waiting Ended, Waiting Ended on {${await formatAMPM(new Date(Date.now()))}}...\n`);
  return true;
}

async function reCreateData_FromOCRExtractedFolders_created_by_automate() {
  const extractedfiles = await Glob("data/AutomateTemp/**/*/*.txt");
  const talkWithAutomateData = {};
  for (let filePath of extractedfiles) {
    const fileDir = filePath;
    filePath = filePath.replace("data/AutomateTemp/", "");
    const file_productId = filePath.split("/")[0];
    const file_cat = filePath.split("/")[1];
    const file_index = filePath.split("/")[2].replace(".txt", "");
    if (!talkWithAutomateData.hasOwnProperty(file_productId)) {
      talkWithAutomateData[file_productId] = {};
    }
    if (!talkWithAutomateData[file_productId].hasOwnProperty(file_cat)) {
      talkWithAutomateData[file_productId]["productId"] = file_productId;
      talkWithAutomateData[file_productId][file_cat] = {};
    }

    let jsonData = await JSON.parse(await fs.readFileSync(fileDir));
    jsonData["extractedText"] = jsonData["extractedText"].toLowerCase();
    talkWithAutomateData[file_productId][file_cat][file_index] = jsonData;
  }

  rimraf("data/AutomateTemp", () => {/* pass */}); // remove dir

  return talkWithAutomateData;
}
function text_contain_forbiddenWord(text, forbiddenWordsArray) {
  for (let index = 0; index < forbiddenWordsArray.length; index++) {
    const element = forbiddenWordsArray[index];
    if (text.includes(element["word"]) && element["strict"] == 1) {
      return {status: true, word: element["word"]};
    }
  }
  return {status: false};
}

async function checkAllImages_andWriteToFile(list) {
  let talkWithAutomateData = {};
  const indexes = {}
  const allDataArray = await Promise.allSettled(
    list.map((e, i) => {
      if (e.status == "fulfilled") {
        indexes[e.value.productId] = i
        return createImagesData(e.value.images, e.value.modified_description_content, e.value.productId);
      }
    })
  );

  for (let index = 0; index < allDataArray.length; index++) {
    if (allDataArray[index]["status"] === "fulfilled") {
      talkWithAutomateData[allDataArray[index]["value"]["productId"]] = allDataArray[index]["value"];
    }
  }

  await fs.writeFileSync("talkWithAutomate.txt", JSON.stringify(talkWithAutomateData));
  await check_OCR_Finished_by_automate();
  talkWithAutomateData = await reCreateData_FromOCRExtractedFolders_created_by_automate();

  const forbiddenWords = await JSON.parse(await fs.readFileSync("variables/forbiddenWords.json"));
  Object.keys(talkWithAutomateData).map((productId2) => {
    if (list[indexes[productId2]]["status"] !== "fulfilled") {
      delete list[indexes[productId2]]
      return
    }
    const currentData = talkWithAutomateData[productId2];
    const mainImages = currentData["mainImages"];
    const all_urls = currentData["all_urls"];

    console.log(`\nChecking Main Images for ProductId = ${productId2}....\n`);
    Object.keys(mainImages).forEach((element) => {
      element = mainImages[element];
      const hasForbiddenWord = text_contain_forbiddenWord(element["extractedText"], forbiddenWords);
      if (hasForbiddenWord["status"]) {
        const index_Of = list[indexes[productId2]]["value"]["images"].indexOf(element["link"])
        console.log(`Main Image : ProductId = ${productId2} : Removing Link ==> ${list[indexes[productId2]]["value"]["images"][index_Of]} : Word = ${hasForbiddenWord.word}`);
        list[indexes[productId2]]["value"]["images"].splice(index_Of, 1) // delete
      }
      
    });
    console.log(`\nFinished Checking Main Images for ProductId = ${productId2}....\n`);
    
    console.log(`\nChecking Description Images for ProductId = ${productId2}....\n`);
    const removedSrcLinksArray = []
    Object.keys(all_urls).forEach((element) => {
      element = all_urls[element];
      const hasForbiddenWord = text_contain_forbiddenWord(element["extractedText"], forbiddenWords);
      if (hasForbiddenWord["status"]) {
        removedSrcLinksArray.push(element["link"])
        console.log(`Description Image : ProductId = ${productId2} : Removing Link ==> ${element["link"]} : Word = ${hasForbiddenWord.word}`);
      }
    });
    
    const $ = cheerio.load(list[indexes[productId2]]["value"]["modified_description_content"], null, false)
    $("img").each(function () {
      const src = $(this).attr("src");
      if (removedSrcLinksArray.includes(src)) {
        $(this).remove()
      }
    });
    list[indexes[productId2]]["value"]["modified_description_content"] = $.html()

    list[indexes[productId2]] = list[indexes[productId2]]["value"]
    fs.writeFileSync(`output/resolved/${list[indexes[productId2]]["old_productId"]}.json`, JSON.stringify(list[indexes[productId2]]));
    fs.writeFileSync(`output/resolved_sql/${list[indexes[productId2]]["old_productId"]}.sql`, insertOrUpdate_ProductData(list[indexes[productId2]]));
    console.log(`\nFinished Checking Description Images for ProductId = ${productId2}....\n`);
  });

  return null;
}

module.exports = checkAllImages_andWriteToFile;