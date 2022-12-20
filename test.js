const puppeteer = require("puppeteer");

const cookie = {
  ali_apache_id: "33.3.37.90.1671376950447.187211.9",
  xman_us_f: "x_locale=en_US&x_l=0&x_c_chg=1&x_as_i=%7B%22aeuCID%22%3A%22%22%2C%22cookieCacheEffectTime%22%3A1671377250498%2C%22isCookieCache%22%3A%22Y%22%2C%22ms%22%3A%220%22%7D&acs_rt=cc452fd9e958463789917ac8a623bf66",
  JSESSIONID: "8AD84BB2658994A7F8F80A7D6B8C78CD",
  intl_common_forever: "IDQYqmz3d390rQ/a3OBNkvtCTjne4F3sYR41MqrOsxd4cCAbu8Kwbw==",
  intl_locale: "en_US",
  xman_f: "qUKGahjfnL/yOGPaIACfx2zMGqy4FV69HXYgbdwZTCH4uYx5ViZN58eitURxWlS8xUzjeB+aERMQH1CDGvo5b+2fy5muIkLVlrfzgEJmgCNVBSbhiV+0ZA==",
  acs_usuc_t: "x_csrf=m4f5cp8swl4o&acs_rt=cc452fd9e958463789917ac8a623bf66",
  xman_t: "80BeTqqp16z2MLgwaM9vFFdz5b8Thq0K3w0eyr2ti06er4ecnJ8vAXyga1+nriEU",
  aep_usuc_f: "site=glo&c_tp=USD&region=US&b_locale=en_US",
};

function cookieConverter(cookieObject) {
  const temp = [];
  Object.keys(cookieObject).map((el) =>
    temp.push({
      name: el,
      value: cookieObject[el],
      domain: "aliexpress.com",
    })
  );
  return temp;
}

const newCookie = [
  {
    name: "aep_usuc_f",
    value: "site=glo&c_tp=USD&region=US&b_locale=en_US",
    domain: "aliexpress.com",
  },
  {
    name: "xman_t",
    value: "80BeTqqp16z2MLgwaM9vFFdz5b8Thq0K3w0eyr2ti06er4ecnJ8vAXyga1+nriEU",
    domain: "aliexpress.com",
  },
  {
    name: "acs_usuc_t",
    value: "x_csrf=m4f5cp8swl4o&acs_rt=cc452fd9e958463789917ac8a623bf66",
    domain: "aliexpress.com",
  },
  {
    name: "xman_f",
    value: "qUKGahjfnL/yOGPaIACfx2zMGqy4FV69HXYgbdwZTCH4uYx5ViZN58eitURxWlS8xUzjeB+aERMQH1CDGvo5b+2fy5muIkLVlrfzgEJmgCNVBSbhiV+0ZA==",
    domain: "aliexpress.com",
  },
  {
    name: "intl_locale",
    value: "en_US",
    domain: "aliexpress.com",
  },
  {
    name: "intl_common_forever",
    value: "IDQYqmz3d390rQ/a3OBNkvtCTjne4F3sYR41MqrOsxd4cCAbu8Kwbw==",
    domain: "aliexpress.com",
  },
  {
    name: "JSESSIONID",
    value: "8AD84BB2658994A7F8F80A7D6B8C78CD",
    domain: "aliexpress.com",
  },
  {
    name: "ali_apache_id",
    value: "33.3.37.90.1671376950447.187211.9",
    domain: "aliexpress.com",
  },
  {
    name: "xman_us_f",
    value: "x_locale=en_US&x_l=0&x_c_chg=1&x_as_i=%7B%22aeuCID%22%3A%22%22%2C%22cookieCacheEffectTime%22%3A1671377250498%2C%22isCookieCache%22%3A%22Y%22%2C%22ms%22%3A%220%22%7D&acs_rt=cc452fd9e958463789917ac8a623bf66",
    domain: "aliexpress.com",
  },
];

async function scrape() {
  const shippingDataList = [];
  let finalShippingData = [];

  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  //if the page makes a  request to a resource type of image or stylesheet then abort that            request
  page.on('request', request => {
      if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet')
          request.abort();
      else
          request.continue();
  });
  await page.setCookie(...cookieConverter(cookie));

  console.time("test");

  await page.goto("https://www.aliexpress.com/item/3256802974172628.html?gatewayAdapt=glo2usa4itemAdapt&_randl_shipto=US", {
    timeout: 0,
    waitUntil: "load",
  });
 
  const promise1 = new Promise(async (resolve, reject) => {
    await page
      .waitForSelector(".dynamic-shipping", {
        timeout: 5000,
      })
      .catch(() => reject(false));
    resolve("dynamic-shiping");
  });

  const promise2 = new Promise(async (resolve, reject) => {
    await page
      .waitForSelector(".customs-message-wrap", {
        timeout: 5000,
      })
      .catch(() => reject(false));
    resolve("customs-message-wrap");
  });

  let element;
  for (let index = 0; index < 2; index++) {
    try {
      element = await Promise.race([promise1, promise2]);
      if (element) {
        break;
      }
    } catch {
      if (index == 1) {
        element = null;
      }
    }
  }
  if (element === "customs-message-wrap") {
  }

  await page.$eval(".dynamic-shipping", (element) => element.click());

  const response = await page.waitForResponse((response) => response.url().startsWith("https://acs.aliexpress.us/h5/mtop.global.expression.dynamic.component.queryoptionforitem"));

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

    await page.waitForSelector(".dynamic-shipping", {
      timeout: 5000,
    });
    await page.click(".dynamic-shipping", { delay: 1000 });
    const response2 = await page.waitForResponse((response) => response.url().startsWith("https://acs.aliexpress.us/h5/mtop.global.expression.dynamic.component.queryoptionforitem"));
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
  const cookies = {};
  const pageCookie = await page.cookies();
  pageCookie.map((el) => {
    cookies[el.name] = el.value;
  });
  console.log(cookies);
  await browser.close();

  if (shippingDataList.length === 2) {
    const firstArray = shippingDataList[0];
    const secondArray = shippingDataList[1];

    for (let index = 0; index < firstArray.length; index++) {
      const element = firstArray[index];
      const firstDeliveryProviderName = element["deliveryProviderName"];
      if (element["shippingFee"] === "free") {
        finalShippingData.push({ ...element, perItemPrice: 0 });
      } else {
        for (let index2 = 0; index2 < secondArray.length; index2++) {
          const element2 = secondArray[index2];
          const secondDeliveryProviderName = element2["deliveryProviderName"];
          if (firstDeliveryProviderName === secondDeliveryProviderName) {
            let perItemPrice = parseFloat(element2["displayAmount"] || 0) - parseFloat(element["displayAmount"] || 0);
            perItemPrice = perItemPrice === 0 ? 0 : parseFloat((perItemPrice + 0.5).toFixed(2));
            finalShippingData.push({ ...element, perItemPrice });
            break;
          }
        }
      }
    }
  }

  console.log(JSON.stringify(finalShippingData));

  console.timeEnd("test");
}

scrape();
