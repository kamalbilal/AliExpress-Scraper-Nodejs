global.defaultCookies = {};
const fs = require("fs");
const convertJsonCookieToString = require("../modules/convertJsonCookieToString");
const cookieCreaterFromString = require("../modules/cookieCreaterFromString");
const startScraper = require("../modules/startScraper");
const fetch = (...args) => import("node-fetch").then((module) => module.default(...args));
const SearchWordsArray = JSON.parse(fs.readFileSync("variables/search_these.json"));
const { JSDOM } = require("jsdom");

function searchProducts(object) {
  return new Promise(async (resolve, reject) => {
    let runLoop = true;
    let retryCountInsideTry = 0;
    let retryCountInsideCatch = 0;
    while (runLoop) {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 11000);
      try {
        const data = await fetch(object["url"], {
          signal: controller.signal,
          // redirect: "error",
          headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "max-age=0",
            "sec-ch-ua": '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Linux"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            cookie: convertJsonCookieToString(defaultCookies),
          },
          referrerPolicy: "strict-origin-when-cross-origin",
          body: null,
          method: "GET",
        });
        const text = await data.text();
        let { runParams } = new JSDOM(text, { runScripts: "dangerously" }).window;
        // console.log(runParams);
        // try {
        //   await fs.writeFileSync("test.txt", JSON.stringify(runParams));
        // } catch {
        //   console.log(runParams);
        // }

        if (runParams["resultCount"] * 1 == 0) {
          if (retryCountInsideTry == 2) {
            runLoop = false;
            console.log(`\n-----------------------Result Count is 0 ${object["url"]}------------------------`);
            reject("Result Count is 0");
            return;
          }
          retryCountInsideTry += 1;
          console.log(`\n-----------------------Retrying url = ${object["url"]}------------------------\n`);
          continue;
        } else if (!runParams.hasOwnProperty("mods")) {
          console.log(`\n-----------------------Skipped url = ${object["url"]}------------------------`);
          runLoop = false;
          reject("page skipped");
          return;
        }

        runParams = runParams["mods"]["itemList"];
        for (dataArray of runParams["content"]) {
          const data = dataArray["productId"];
          fs.appendFileSync(`output/searchProducts_Output/${object["word"]}.txt`, `${data}\n`);
        }
        runLoop = false;
        defaultCookies = { ...defaultCookies, ...cookieCreaterFromString(data.headers.get("set-cookie")) };
        resolve(object["url"]);
      } catch (e) {
        clearTimeout(timeout);
        if (retryCountInsideCatch == 3) {
          runLoop = false;
          console.log(`\n-----------------------Error getting Page Data ${object["url"]}------------------------`);
          reject("Error getting Page Data");
          return;
        } else {
          console.log(e);
          console.log(`\n-----------------------Retrying from catch url = ${object["url"]}------------------------`);
          retryCountInsideCatch += 1;
          continue;
        }
      } finally {
        clearTimeout(timeout);
      }
    }
  });
}

async function removeDuplicates(word) {
  console.log("Removing Duplicates of file = " + word + ".txt");
  let myStr = fs.readFileSync(`output/searchProducts_Output/${word}.txt`, "utf8");
  myStr = myStr
    .split("\n")
    .filter((item, i, allItems) => {
      return i === allItems.indexOf(item);
    })
    .join("\n");

  await fs.writeFileSync(`output/searchProducts_Output/${word}.txt`, myStr);
  console.log("Succefully Removed Duplicates of file = " + word + ".txt\n");
}

const objectKeysToLowerCase = function (origObj) {
  return Object.keys(origObj).reduce(function (newObj, key) {
    let val = origObj[key];
    let newVal = typeof val === "object" ? objectKeysToLowerCase(val) : val;
    newObj[key.toLowerCase()] = newVal;
    return newObj;
  }, {});
};

async function main() {
  let urlList = [];
  let lastSeachedData = await fs.readFileSync("variables/lastSearched.json", "utf8");
  lastSeachedData = lastSeachedData ? JSON.parse(lastSeachedData) : {};
  lastSeachedData = objectKeysToLowerCase(lastSeachedData);
  const LoopIteration = 10;
  let checkWord = true;

  const canReSearchTheseWords = []; //custom words ==> all characters in lowercase eg: ["glasses"]

  for (let index = 0; index < SearchWordsArray.length; index++) {
    let lastSeachedPage = 0;

    const word = SearchWordsArray[index];

    if (!canReSearchTheseWords.includes(word.toLowerCase())) {
      if (lastSeachedData && lastSeachedData.hasOwnProperty(word.toLowerCase())) {
        if (lastSeachedData[word.toLowerCase()] >= 150) {
          console.log("Already Searched Word = " + word);
          continue;
        } else {
          lastSeachedPage = lastSeachedData[word.toLowerCase()];
        }
      }
    } else {
      console.log("Researching Word = " + word);
    }

    while (lastSeachedPage < 150) {
      for (let index = 1 + lastSeachedPage; index <= LoopIteration + lastSeachedPage; index++) {
        urlList.push({ word: word, url: `https://www.aliexpress.us/wholesale?trafficChannel=main&d=y&CatId=0&SearchText=${word}&ltype=wholesale&isFavorite=y&SortType=default&shipFromCountry=US&page=${index}` });
      }
      console.log(`Waiting for result of word = ${word} : page from ${lastSeachedPage + 1} to ${LoopIteration + lastSeachedPage}`);
      await Promise.all(urlList.map((e) => searchProducts(e)));

      checkWord = false;
      lastSeachedData = { ...lastSeachedData, [word]: LoopIteration + lastSeachedPage };
      await fs.writeFileSync("variables/lastSearched.json", JSON.stringify(lastSeachedData));
      lastSeachedPage = lastSeachedPage + LoopIteration;
      urlList = []; // reset
    }
    await removeDuplicates(word);
    lastSeachedPage = 0; // reset
  }

  console.log("\nAll Completed\n");
}
async function searchSingleProducts_main(word) {
  let urlList = [];
  const LoopIteration = 10;
  let lastSeachedPage = 0;
  while (lastSeachedPage < 150) {
    for (let index = 1 + lastSeachedPage; index <= LoopIteration + lastSeachedPage; index++) {
      urlList.push({ word: word, url: `https://www.aliexpress.us/wholesale?trafficChannel=main&d=y&CatId=0&SearchText=${word}&ltype=wholesale&isFavorite=y&SortType=default&shipFromCountry=US&page=${index}` });
    }
    console.log(`Waiting for result of word = ${word} : page from ${lastSeachedPage + 1} to ${LoopIteration + lastSeachedPage}`);
    await Promise.all(urlList.map((e) => searchProducts(e)));
    lastSeachedPage = lastSeachedPage + LoopIteration;
    urlList = []; // reset
  }
  await removeDuplicates(word);
  lastSeachedPage = 0; // reset

  console.log("\nAll Completed\n");
}

async function searchAllProducts() {
  await startScraper(false);
  main();
}
async function searchSingleProduct(word) {
  await startScraper(false);
  searchSingleProducts_main(word);
}

module.exports = { searchAllProducts, searchSingleProduct };
