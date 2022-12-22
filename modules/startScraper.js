const cookieCreaterFromString = require("./cookieCreaterFromString");
const fetch = (...args) => import("node-fetch").then((module) => module.default(...args));
const fs = require("fs");
const puppeteer = require("puppeteer");

async function resetVariables() {
  let vpnSettings = fs.readFileSync("variables/vpnSettings.json", "utf8");
  vpnSettings = vpnSettings ? JSON.parse(vpnSettings) : {};
  fs.writeFileSync("variables/vpnSettings.json", JSON.stringify({ ...vpnSettings, isConnecing: false }));
}

async function startScraper(launchBrowser = true) {
  if (launchBrowser) {
    global.browser = await puppeteer.launch({
      headless: true,
      args: [
        // "--no-sandbox",
        // "--disable-setuid-sandbox",
        // "--disable-dev-shm-usage",
        // "--disable-accelerated-2d-canvas",
        // "--no-first-run",
        // "--no-zygote",
        // "--single-process", // <- this one doesn't works in Windows
        // "--disable-gpu",
        "--speed",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-first-run",
        "--fast-start",
        "--disable-background-networking",
        "--no-zygote",
        "--max-old-space-size=1024",
        "--enable-precise-memory-info",
        "--disable-extensions",
        "--disable-popup-blocking",
        "--ignore-certificate-errors",
      ],
    });
    console.log("Booting Scraper with browser....");
  } else {
    console.log("Booting Scraper....");
  }
  resetVariables();
  const data = await fetch("https://www.aliexpress.com", {
    // redirect: "error",
  });
  defaultCookies = cookieCreaterFromString(data.headers.get("set-cookie"));
  console.log("Scraper will use these fresh cookies...");
  console.log(defaultCookies);
  console.log("Successfully Booted....");
  console.log("\n");
}

module.exports = startScraper;
