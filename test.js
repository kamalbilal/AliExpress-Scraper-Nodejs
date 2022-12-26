const puppeteer = require("puppeteer");
const userAgent = require('user-agents');

async function scrape() {
  let output;
  for (let index = 0; index < 5; index++) {
    console.log({index});
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    if (index > 0) {
      await page.setUserAgent(userAgent.random().toString());
    }
    await page.setRequestInterception(true);

    //if the page makes a  request to a resource type of image or stylesheet then abort that            request
    page.on("request", (request) => {
      if (request.resourceType() === "image" || request.resourceType() === "stylesheet") request.abort();
      else request.continue();
    });

    await page.goto("https://gogohd.pro/download?id=MTk2NDAw&typesub=Gogoanime-SUB&title=Boruto%3A+Naruto+Next+Generations+Episode+280", {
      timeout: 0,
      waitUntil: "domcontentloaded",
    });
    output = await (
      await page.waitForFunction(
        () => {
          let result = false;
          const div = document.querySelector("#content-download");
          if (div.textContent.trim() === "") {
            result = false;
          } else {
            result = div.innerHTML;
          }
          return result;
        },
        { timeout: 60000, polling: "mutation" }
      )
    ).jsonValue();
    
    console.log(output);
    if (output.includes('title="reCAPTCHA"')) {
      await browser.close();
    } else {
      console.log("finished");
      await browser.close();
      break;
    }
  }
}

scrape();
