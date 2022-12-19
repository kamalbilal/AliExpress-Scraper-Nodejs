const { formatPricesMain, shippingDataSorter } = require("./scraperHelperFunctions");
const he = require("he");
const fs = require("fs");

async function oldScraper(data, link, old_productId) {
  fs.writeFileSync(`output/real_data/${old_productId}.json`, JSON.stringify(data));
  if (!data.hasOwnProperty("titleModule")) {
    return false;
  }
  const title = he.decode(data["titleModule"]["subject"].replaceAll("'", "''"));
  const description_Link = data["descriptionModule"]["descriptionUrl"];
  const images = [];
  for (const index in data["imageModule"]["imagePathList"]) {
    const image_url = data["imageModule"]["imagePathList"][index];
    if (image_url.includes("\\")) {
      image_url = image_url.split("\\")[1];
    }
    images.push(image_url);
  }

  const productId = data["actionModule"]["productId"];
  const categoryId = data["actionModule"]["categoryId"];
  const rootCategoryId = data["actionModule"]["rootCategoryId"];

  const totalProductWishedCount = data["actionModule"]["itemWishedCount"];
  const isSellerLocal = data["actionModule"]["localSeller"];

  const comingSoon = data["actionModule"]["comingSoon"];
  const invalidBuyNow = data["actionModule"]["invalidBuyNow"];

  const minPrice = data["priceModule"]["minAmount"]["value"];
  const maxPrice = data["priceModule"]["maxAmount"]["value"];

  let discount;
  let discountNumber;
  try {
    discount = String(data["priceModule"]["discount"] ? data["priceModule"]["discount"] : 0) + "% OFF";
    discountNumber = parseInt(data["priceModule"]["discount"] ? data["priceModule"]["discount"] : 0);
  } catch {
    discount = "0% OFF";
    discountNumber = 0;
  }

  let minPrice_AfterDiscount;
  try {
    minPrice_AfterDiscount = data["priceModule"]["minActivityAmount"]["value"];
  } catch {
    minPrice_AfterDiscount = 0;
  }

  let maxPrice_AfterDiscount;
  try {
    maxPrice_AfterDiscount = data["priceModule"]["maxActivityAmount"]["value"];
  } catch {
    maxPrice_AfterDiscount = 0;
  }

  const multiUnitName = data["quantityModule"]["multiUnitName"];
  const oddUnitName = data["quantityModule"]["oddUnitName"];
  const maxPurchaseLimit = data["quantityModule"]["purchaseLimitNumMax"];
  const buyLimitText = data["quantityModule"]["i18nMap"]["BUY_LIMIT"].split("}")[2];
  const quantityAvaliable = data["quantityModule"]["totalAvailQuantity"];

  const sizesColors = data["skuModule"]["productSKUPropertyList"];
  let priceList;
  if (sizesColors) {
    priceList = formatPricesMain({ sizesColors: sizesColors, priceList: data["skuModule"]["skuPriceList"] }, false, "US", "CN");
  } else {
    priceList = { _info: "All are synced by their indexes ==> Meaning ===> InNames[0] == InNumbers[0] == Data[0]", country: "US / CN", InNames: null, InNumbers: null, Data: data["skuModule"]["skuPriceList"] };
  }

  let specs;
  if (data["specsModule"].hasOwnProperty("props")) {
    specs = data["specsModule"]["props"].map((el) => ({ attrName: el.attrName.replaceAll("'", "''"), attrValue: el.attrValue.replaceAll("'", "''") }));
  } else {
    specs = null;
  }

  const totalOrders = data["titleModule"]["tradeCount"];
  const ratings = data["titleModule"]["feedbackRating"];
  const totalProductSoldCount = data["titleModule"]["tradeCount"];
  const totalProductSoldCountUnit = data["titleModule"]["tradeCountUnit"];
  const storeInfo = data["storeModule"];
  if (storeInfo.hasOwnProperty("i18nMap")) {
    delete storeInfo["i18nMap"];
  }

  // const shipping = shippingDataSorter(data["shippingModule"]);
  const shipping = shippingDataSorter(data["shippingData"]);

  const relatedCategoryNumber = [];
  relatedCategoryNumber.push(String(categoryId));

  for (const index in data["crossLinkModule"]["breadCrumbPathList"]) {
    const cat = data["crossLinkModule"]["breadCrumbPathList"][index];
    if (cat["cateId"] != 0) {
      catUrl = cat["url"].split("/category/")[1];
      catUrl = catUrl.split(".")[0];
      catNumber = catUrl.split("/")[0];
      catName = catUrl.split("/")[1].replace("-", " ");
      // categoryJsonData = updateCategories(categoryJsonData, catName, catNumber);
      relatedCategoryNumber.push(catNumber);
    }
  }

  specsForMongoDb = [];
  if (specs != null) {
    specs.forEach((spec) => {
      key = he.decode(spec["attrName"]).toLowerCase();
      value = he.decode(spec["attrValue"]).replace(" ,", ",").replace(", ", ",").toLowerCase();
      if (value.includes("/")) {
        values = value.split("/");
        values.forEach((val) => {
          specsForMongoDb.push({ attrName: key.toLowerCase(), attrValue: val.toLowerCase() });
        });
      }
      if (value.includes(",")) {
        values = value.split(",");
        values.forEach((val) => {
          specsForMongoDb.push({ attrName: key.toLowerCase(), attrValue: val.toLowerCase() });
        });
      }
      if (!value.includes(",") && !value.includes("/")) {
        specsForMongoDb.push({ attrName: key.toLowerCase(), attrValue: value.toLowerCase() });
      }
    });
  }

  titleChars = "";
  for (const index in title) {
    titleChars += `${title[index].toLowerCase()} `;
  }

  const I_Need = {
    scrapMethod: "old",
    _display: 1,
    link: link,
    title: title,
    titleChars: titleChars,
    description_Link: description_Link,
    images: images,

    minPrice: minPrice,
    maxPrice: maxPrice,
    discountNumber: discountNumber,
    discount: discount,

    minPrice_AfterDiscount: minPrice_AfterDiscount,
    maxPrice_AfterDiscount: maxPrice_AfterDiscount,

    multiUnitName: multiUnitName,
    oddUnitName: oddUnitName,
    maxPurchaseLimit: maxPurchaseLimit,
    buyLimitText: buyLimitText,
    quantityAvaliable: quantityAvaliable,

    sizesColors: sizesColors,
    priceList: priceList,
    specs: specs,
    specsForMongoDb: specsForMongoDb,
    totalOrders: totalOrders,
    ratings: ratings,
    totalProductSoldCount: totalProductSoldCount,
    totalProductWishedCount: totalProductWishedCount,
    totalProductSoldCountUnit: totalProductSoldCountUnit,
    storeInfo: { ...storeInfo, storeName: storeInfo.storeName.replaceAll("'", "''") },
    isSellerLocal: isSellerLocal,

    shipping: shipping,
    productId: productId,
    old_productId: old_productId,
    categoryId: categoryId,
    relatedCategoryNumber: relatedCategoryNumber,
    comingSoon: comingSoon,
    rootCategoryId: rootCategoryId,
  };

  return I_Need;
}

module.exports = oldScraper;
