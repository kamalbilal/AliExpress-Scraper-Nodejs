// const { JSDOM } = require("jsdom");
const puppeteer = require("puppeteer");
const fetch = (...args) => import("node-fetch").then((module) => module.default(...args));
const fs = require("fs");
const convertJsonCookieToString = require("./convertJsonCookieToString");
const cookieCreaterFromString = require("./cookieCreaterFromString");
const chalk = require("chalk");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cookieConverter(cookieObject) {
  const temp = [];
  Object.keys(cookieObject).map((el) =>
    temp.push(
      {
        name: el,
        value: cookieObject[el],
        domain: "www.aliexpress.com",
      },
      {
        name: el,
        value: cookieObject[el],
        domain: "www.aliexpress.us",
      }
    )
  );
  return temp;
}

const productDataRequest = (productId, isRejectedOnce) => {
  return new Promise(async (resolve, reject) => {
    if (isRejectedOnce) {
      fs.unlinkSync(`output/rejected/${productId}.txt`);
    }
    let runLoop = true;
    let retryCount = 0;
    let scraperUsed = "old";
    let displayWaitingLog = true;
    console.log("Getting productId = " + chalk.greenBright(productId) + " : Total failures = " + chalk.redBright(failedCount));
    while (runLoop) {
      try {
        const link = `https://www.aliexpress.com/item/${productId}.html`;
        // const link = `https://www.aliexpress.us/item/3256804339376753.html`;

        const shippingDataList = [];
        let finalShippingData = [];

        const browser = await puppeteer.launch({ headless: true });

        const page = await browser.newPage();
        await page.setCookie(...cookieConverter(defaultCookies));

        await page.goto(link, {
          timeout: 0,
          waitUntil: "domcontentloaded",
        });
        await page.waitForSelector(".dynamic-shipping", {
          timeout: 0,
        });
        await page.$eval(".dynamic-shipping", (element) => element.click());

        const response = await page.waitForResponse((response) => response.url().includes("mtop.global.expression.dynamic.component.queryoptionforitem"));

        await page.waitForSelector(".comet-modal-wrap");
        await page.$eval(".comet-modal-wrap", (element) => element.click());

        const data = (await response.json())["data"]["originalLayoutResultList"].map((el) => el["bizData"]);
        shippingDataList.push(data);

        await page.waitForSelector(".next-after .next-btn.next-medium.next-btn-normal");

        const buttonDisabled = await page.$eval(".next-after .next-btn.next-medium.next-btn-normal", (button) => button.hasAttribute("disabled"));
        if (buttonDisabled === false) {
          await page.$eval(".next-after .next-btn.next-medium.next-btn-normal", (element) => {
            element.click();
          });

          await page.click(".dynamic-shipping", { delay: 1000 });
          const response2 = await page.waitForResponse((response) => response.url().includes("mtop.global.expression.dynamic.component.queryoptionforitem"));
          const data2 = (await response2.json())["data"]["originalLayoutResultList"].map((el) => el["bizData"]);
          shippingDataList.push(data2);
        }

        let runParams;
        let _dida_config_;
        try {
          runParams = await page.evaluate(() => runParams);
        } catch {
          runParams = null;
        }

        if (!runParams) {
          try {
            _dida_config_ = await page.evaluate(() => _dida_config_);
          } catch {
            _dida_config_ = null;
          }
        }

        const text = await page.content();
        await fs.writeFileSync(`${productId}.txt`, text);

        // const cookies = {};
        // const pageCookie = await page.cookies();
        // pageCookie.map((el) => {
        //   cookies[el.name] = el.value;
        // });
        // console.log(cookies);

        await browser.close();

        // calculate perItemPrice in shippingData
        if (shippingDataList.length === 2) {
          const firstArray = shippingDataList[0];
          const secondArray = shippingDataList[1];

          for (let index = 0; index < firstArray.length; index++) {
            const element = firstArray[index];
            const firstDeliveryProviderName = element["deliveryProviderName"];
            if (element["shippingFee"] === "free") {
              finalShippingData.push({ bizData: { ...element, perItemPrice: 0 } });
            } else {
              for (let index2 = 0; index2 < secondArray.length; index2++) {
                const element2 = secondArray[index2];
                const secondDeliveryProviderName = element2["deliveryProviderName"];
                if (firstDeliveryProviderName === secondDeliveryProviderName) {
                  let perItemPrice = parseFloat(element2["displayAmount"] || 0) - parseFloat(element["displayAmount"] || 0);
                  perItemPrice = perItemPrice === 0 ? 0 : parseFloat((perItemPrice + 0.5).toFixed(2));
                  finalShippingData.push({"bizData":{ ...element, perItemPrice }});
                  break;
                }
              }
            }
          }
        } else {
          finalShippingData = shippingDataList[0];
        }

        if (runParams) {
          runParams["data"]["shippingData"] = finalShippingData
        } else if(_dida_config_) {
          _dida_config_ = _dida_config_._init_data_["data"]["shippingData"] = finalShippingData;
        }

        let vpnConnecting = JSON.parse(fs.readFileSync("variables/vpnSettings.json", "utf8"));
        // when ip banned coonect vpn ==> start
        while (vpnConnecting["isConnecing"] === true) {
          if (displayWaitingLog) {
            console.log(`Waiting (${productId}) because VPN is connecting...`);
            displayWaitingLog = false;
          }
          await sleep(10000);
          vpnConnecting = JSON.parse(fs.readFileSync("variables/vpnSettings.json", "utf8"));
          if (vpnConnecting["isConnecing"] === false) {
            retryCount = 0;
            throw Error("retrying");
          }
        }
        if (text.includes("window.Tracker")) {
          vpnConnecting["isConnecing"] = true;
          fs.writeFileSync("variables/vpnSettings.json", JSON.stringify(vpnConnecting));
          console.log("Changing Ip address...");
          const vpn = require("../mainFiles/vpn");
          await vpn.connectToWindscribe();
          vpnConnecting["isConnecing"] = false;
          fs.writeFileSync("variables/vpnSettings.json", JSON.stringify(vpnConnecting));
          retryCount = 0;
          throw Error("retrying");
        }
        // when ip banned coonect vpn ==> end

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
            console.log({ [productId]: "Currency is not in USD" });
            // await fs.writeFileSync(`output/rejected/${productId}.txt`, JSON.stringify(runParams));
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
        // defaultCookies = { ...defaultCookies, ...cookies };
      } catch (e) {
        console.log(e);
        if (retryCount < 4) {
          console.log("Retrying ==> getting productId = " + productId);
          retryCount += 1;
        } else {
          console.log(chalk.redBright("Failed to Get Data for ==> productId = " + productId));
          failedCount += 1;
          // console.log(e);
          runLoop = false;
          await fs.writeFileSync(`output/rejected/${productId}.txt`, `Reason ==> ${e}`);
          reject("rejected");
        }
      }
    }
  });
};

async function getProductData(list, isRejectedOnce = false) {
  return await Promise.allSettled(list.map((e) => productDataRequest(e, isRejectedOnce)));
}

module.exports = getProductData;
