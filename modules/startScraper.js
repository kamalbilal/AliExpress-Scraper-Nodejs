const cookieCreaterFromString = require("./cookieCreaterFromString");
const fetch = (...args) => import("node-fetch").then((module) => module.default(...args));
const fs = require("fs");
const puppeteer = require("puppeteer");

async function resetVariables() {
  let vpnSettings =  fs.readFileSync("variables/vpnSettings.json", "utf8")
  vpnSettings = vpnSettings ? JSON.parse(vpnSettings) : {}
  fs.writeFileSync("variables/vpnSettings.json", JSON.stringify({...vpnSettings, "isConnecing": false}))
}

async function startScraper() {
    global.browser = await puppeteer.launch({ headless: false });
    console.log("Booting Scraper....");
    resetVariables()
    const data = await fetch("https://www.aliexpress.com", {
      // redirect: "error",

    });
    defaultCookies = cookieCreaterFromString(data.headers.get("set-cookie"));
    console.log("Scraper will use these fresh cookies...");
    console.log(defaultCookies);
    console.log("Successfully Booted....");
    console.log("\n");
  }

module.exports = startScraper