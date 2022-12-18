const { JSDOM } = require("jsdom");
const fetch = (...args) => import("node-fetch").then((module) => module.default(...args));
const fs = require("fs");
const convertJsonCookieToString = require("./convertJsonCookieToString");
const cookieCreaterFromString = require("./cookieCreaterFromString");
const chalk = require("chalk");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const productDataRequest = (productId, isRejectedOnce) => {
  return new Promise(async (resolve, reject) => {
    if (isRejectedOnce) {
      fs.unlinkSync(`output/rejected/${productId}.txt`);
    }
    let runLoop = true;
    let retryCount = 0;
    let scraperUsed = "old";
    let displayWaitingLog = true
    console.log("Getting productId = " + chalk.greenBright(productId) + " : Total failures = " + chalk.redBright(failedCount));
    while (runLoop) {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 11000);
      try {
        const link = `https://www.aliexpress.us/item/${productId}.html`;
        // const link = `https://www.aliexpress.us/item/3256804339376753.html`;
        const data = await fetch(link, {
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

        let vpnConnecting = JSON.parse(fs.readFileSync("variables/vpnSettings.json", "utf8"))
        // when ip banned coonect vpn ==> start
        while(vpnConnecting["isConnecing"] === true) {
          if (displayWaitingLog) {
            console.log(`Waiting (${productId}) because VPN is connecting...`);
            displayWaitingLog = false
          }
          await sleep(10000)
          vpnConnecting = JSON.parse(fs.readFileSync("variables/vpnSettings.json", "utf8"))
          if (vpnConnecting["isConnecing"] === false) {
            retryCount = 0
            throw Error("retrying")
          }
        }
        if (text.includes("window.Tracker")) {
          vpnConnecting["isConnecing"] = true
          fs.writeFileSync("variables/vpnSettings.json", JSON.stringify(vpnConnecting))
          console.log("Changing Ip address...");
          const vpn = require("../mainFiles/vpn");
          await vpn.connectToWindscribe()
          vpnConnecting["isConnecing"] = false
          fs.writeFileSync("variables/vpnSettings.json", JSON.stringify(vpnConnecting))
          retryCount = 0
          throw Error("retrying")
        }
        // when ip banned coonect vpn ==> end

        
        await fs.writeFileSync(`${productId}.txt`, text);
        const { runParams, _dida_config_ } = new JSDOM(text, { runScripts: "dangerously" }).window;

        if (Object.keys(runParams).length !== 0) {
          if (!runParams["data"].hasOwnProperty("priceModule")) {
            fs.writeFileSync(`output/rejected/${productId}.txt`, `Reason ==> Page Not Found`);
            reject("Page Not Found");
            return;
          }

          scraperUsed = "old";
          if (
            (runParams["data"].hasOwnProperty("priceModule") && runParams["data"]["priceModule"].hasOwnProperty("minActivityAmount") && runParams["data"]["priceModule"]["minActivityAmount"]["currency"] !== "USD") ||
            (runParams["data"].hasOwnProperty("priceModule") && runParams["data"]["priceModule"].hasOwnProperty("maxAmount") && runParams["data"]["priceModule"]["maxAmount"]["currency"] !== "USD")
          ) {
            await fs.writeFileSync(`output/rejected/${productId}.txt`, `Reason ==> Currency is not in USD`);
            return reject("Currency is not in USD");
          }

          resolve({ data: runParams, scraperUsed, link, old_productId: productId });
        } else if (Object.keys(_dida_config_).length !== 0 && _dida_config_.hasOwnProperty("_init_data_")) {
          scraperUsed = "new";

          resolve({ data: _dida_config_._init_data_, scraperUsed, link, old_productId: productId });
        } else {
          scraperUsed = "Unknown";
          await fs.writeFileSync(`output/rejected/${productId}.txt`, `Reason ==> Scarper Unknown`);
          reject("Scraper unknown");
        }

        runLoop = false;
        defaultCookies = { ...defaultCookies, ...cookieCreaterFromString(data.headers.get("set-cookie")) };
      } catch (e) {
        clearTimeout(timeout);
        if (retryCount < 4) {
          console.log("Retrying ==> getting productId = " + productId);
          retryCount += 1;
        } else {
          console.log(chalk.redBright("Failed to Get Data for ==> productId = " + productId));
          failedCount += 1
          // console.log(e);
          runLoop = false;
          await fs.writeFileSync(`output/rejected/${productId}.txt`, `Reason ==> ${e}`);
          reject("rejected");
        }
      } finally {
        clearTimeout(timeout);
      }
    }
  });
};

async function getProductData(list, isRejectedOnce = false) {
  return await Promise.allSettled(list.map((e) => productDataRequest(e, isRejectedOnce)));
}

module.exports = getProductData;
