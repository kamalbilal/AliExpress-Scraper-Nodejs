const fetch = (...args) => import("node-fetch").then((module) => module.default(...args));
const cheerio = require("cheerio");
const convertJsonCookieToString = require("./convertJsonCookieToString");
const chalk = require("chalk")

async function removeAllElement(htmlString, element) {
  const $ = cheerio.load(htmlString, null, false);
  $(element).remove(element);
  return $.html();
}

async function correctImgLinks(htmlString, element = "img") {
  const $ = cheerio.load(htmlString, null, false);
  $(element).each(function () {
    let src = $(this).attr("src");
    if (src) {
      if (src.includes("\\")) {
        src = src.split("\\")[1];
      }
      $(this).attr("src", src);
    }
  });

  return $.html();
}

async function descriptionModifier(url, productId) {
  if (!url) {
    return null;
  }
  let runLoop = true;
  let retryCount = 0;
  let data = null;
  while (runLoop == true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 11000);
    try {
      data = await fetch(url, {
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

      let text = await data.text();
      text = text.replace(new RegExp("aliexpress", "ig"), "Company");
      let modified_description = await removeAllElement(text, "a, button, video");
      modified_description = await correctImgLinks(modified_description);
      runLoop = false;
      if (!modified_description) {
        console.log(text);
      }
      modified_description = modified_description.replaceAll("ton of $$$", "ton of money");
      modified_description = modified_description.replaceAll("ton&nbsp;of&nbsp;$$$", "ton of money");
      return modified_description;
    } catch (e) {
      clearTimeout(timeout);
      if (retryCount < 8) {
        console.log(`Retrying ==> Getting description of productId = ${productId} from url = ${url}`);
        retryCount += 1;
      } else {
        console.log(chalk.redBright(`Failed to Get Description Data productId = ${productId} from ==> url = ${url}`));
        console.log(e);
        runLoop = false;
        failedCount += 1
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = descriptionModifier;
