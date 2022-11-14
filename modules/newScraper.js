const { formatPricesMain, shippingDataSorter } = require("./scraperHelperFunctions");
const he = require("he");

function isType(type, val) {
  return val.constructor.name.toLowerCase() === type.toLowerCase();
}

function getKeyName(jsonFile, expectedKeyName) {
  expectedKeyName = expectedKeyName.toLowerCase();
  if (isType("object", jsonFile)) {
    for (key in jsonFile) {
      if (key.toLowerCase().includes(expectedKeyName) && expectedKeyName[0] == key[0].toLowerCase()) {
        return key;
      }
    }
  } else {
    for (const key of jsonFile) {
      if (key.toLowerCase().includes(expectedKeyName) && expectedKeyName[0] == key[0].toLowerCase()) {
        return key;
      }
    }
  }
}

async function newScraper(data, link, old_productId) {
  const mainWrapKey = getKeyName(data["hierarchy"]["structure"], "mainWrap");
  const infoWrapKey = getKeyName(data["hierarchy"]["structure"][mainWrapKey], "info");

  const infoWrapData = data["hierarchy"]["structure"][infoWrapKey];

  const titleKey = getKeyName(infoWrapData, "titleBanner");
  let descriptionKey = data["hierarchy"]["structure"][getKeyName(data["hierarchy"]["structure"], "bottomWrap")];
  descriptionKey = getKeyName(descriptionKey, "description");
  const imagesKey = getKeyName(data["hierarchy"]["structure"][mainWrapKey], "imageView");
  const actionButtonsKey = getKeyName(infoWrapData, "actionButton");
  const priceKey = getKeyName(infoWrapData, "price");
  const quantityKey = getKeyName(infoWrapData, "quantity");
  const i18nKey = getKeyName(data["data"][quantityKey]["fields"], "i18n");
  const skuKey = getKeyName(infoWrapData, "sku");
  const specsInfoKey = getKeyName(infoWrapData, "specsInfo");
  const shareHeaderKey = getKeyName(data["hierarchy"]["structure"]["root"], "shareHeader");
  const headerInfoKey = getKeyName(data["hierarchy"]["structure"]["root"], "headerInfo");
  const shippingKey = getKeyName(infoWrapData, "shipping");
  //
  const title = he.decode(data["data"][titleKey]["fields"]["subject"].replaceAll("'", "''"));
  const description_Link = data["data"][descriptionKey]["fields"]["detailDesc"];

  const images = [];
  for (const index in data["data"][imagesKey]["fields"]["imagePathList"]) {
    const image_url = data["data"][imagesKey]["fields"]["imagePathList"][index];
    if (image_url.includes("\\")) {
      image_url = image_url.split("\\")[1];
    }
    images.push(image_url);
  }

  const productId = data["data"][actionButtonsKey]["fields"]["productId"];
  const categoryId = data["data"][actionButtonsKey]["fields"]["categoryId"];
  const rootCategoryId = data["data"][actionButtonsKey]["fields"]["rootCategoryId"];

  const totalProductWishedCount = data["data"][actionButtonsKey]["fields"]["itemWishedCount"];
  const isSellerLocal = data["data"][actionButtonsKey]["fields"]["localSeller"];

  const comingSoon = data["data"][actionButtonsKey]["fields"]["comingSoon"];
  const invalidBuyNow = data["data"][actionButtonsKey]["fields"]["invalidBuyNow"];

  if (data["data"][priceKey]["fields"]["minAmount"]["currency"] != "USD") {
    throw Error("Price is not in USD ==> method 'new'");
  }

  const minPrice = data["data"][priceKey]["fields"]["minAmount"]["value"];
  const maxPrice = data["data"][priceKey]["fields"]["maxAmount"]["value"];

  let discount;
  let discountNumber;
  try {
    discount = String(data["data"][priceKey]["fields"]["discount"]) + "% OFF";
    discountNumber = parseInt(data["data"][priceKey]["fields"]["discount"]);
  } catch {
    discount = "0% OFF";
    discountNumber = 0;
  }

  let minPrice_AfterDiscount;
  try {
    minPrice_AfterDiscount = data["data"][priceKey]["fields"]["minActivityAmount"]["value"];
  } catch {
    minPrice_AfterDiscount = 0;
  }

  let maxPrice_AfterDiscount;
  try {
    maxPrice_AfterDiscount = data["data"][priceKey]["fields"]["maxActivityAmount"]["value"];
  } catch {
    maxPrice_AfterDiscount = 0;
  }

  const multiUnitName = data["data"][quantityKey]["fields"]["multiUnitName"];
  const oddUnitName = data["data"][quantityKey]["fields"]["oddUnitName"];
  const maxPurchaseLimit = data["data"][quantityKey]["fields"]["purchaseLimitNumMax"];
  const buyLimitText = data["data"][quantityKey]["fields"][i18nKey]["BUY_LIMIT"].split("}")[2];
  const quantityAvaliable = data["data"][quantityKey]["fields"]["totalAvailQuantity"];

  const sizesColors = data["data"][skuKey]["fields"]["propertyList"];
  const priceList = formatPricesMain({ sizesColors: sizesColors, priceList: data["data"][skuKey]["fields"]["skuList"] }, false, "US", "CN");

  let specs;
  if (data["data"][specsInfoKey]["fields"].hasOwnProperty("specs")) {
    specs = data["data"][specsInfoKey]["fields"]["specs"].map(el => ({attrName: el.attrName.replaceAll("'", "''") ,attrValue: el.attrValue.replaceAll("'", "''")}));
  } else {
    specs = null;
  }

  const totalOrders = data["data"][shareHeaderKey]["fields"]["formatTradeCount"];
  const ratings = {};
  const totalProductSoldCount = data["data"][shareHeaderKey]["fields"]["formatTradeCount"];
  const totalProductSoldCountUnit = "orders";
  const storeInfo = data["data"][headerInfoKey]["fields"]["_for_header_info"]["storeModule"];
  if (storeInfo.hasOwnProperty("i18nMap")) {
    delete storeInfo["i18nMap"];
  } else if (storeInfo.hasOwnProperty("i18n")) {
    delete storeInfo["i18n"];
  }

  const shipping = shippingDataSorter(data["data"][shippingKey]["fields"]);

  const relatedCategoryNumber = [];
  relatedCategoryNumber.push(String(categoryId));

//   for (const index in data["crossLinkModule"]["breadCrumbPathList"]) {
//     const cat = data["crossLinkModule"]["breadCrumbPathList"][index];
//     if (cat["cateId"] != 0) {
//       catUrl = cat["url"].split("/category/")[1];
//       catUrl = catUrl.split(".")[0];
//       catNumber = catUrl.split("/")[0];
//       catName = catUrl.split("/")[1].replace("-", " ");
//       // categoryJsonData = updateCategories(categoryJsonData, catName, catNumber);
//       relatedCategoryNumber.push(catNumber);
//     }
//   }

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
    scrapMethod: "new",
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
    storeInfo: storeInfo,
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

module.exports = newScraper;
