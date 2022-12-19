
function formatAllPrices(json, countryCode = "", showShipFromInFinalData = false) {
  const countryFullNames = { us: "united states", cn: "china" }; // Note : always enter full country name
  const arrayInNumbers = {};
  const arrayInNames = {};
  let priceListInNumbers = [];
  let priceListInNames = [];
  const priceData = [];
  let getOnlyForCountry;
  if (countryCode == "") {
    getOnlyForCountry = "US";
  } else {
    getOnlyForCountry = countryCode;
  }

  // console.log(json);
  for (let index = 0; index < json["sizesColors"].length; index++) {
    arrayInNumbers[index] = [];
    arrayInNames[index] = [];
  }
  for (let index = 0; index < json["sizesColors"].length; index++) {
    const id = json["sizesColors"][index]["skuPropertyId"];
    const idName = json["sizesColors"][index]["skuPropertyName"];
    for (let index2 = 0; index2 < json["sizesColors"][index]["skuPropertyValues"].length; index2++) {
      if (json["sizesColors"][index]["skuPropertyName"] == "Ships From" && json["sizesColors"][index]["skuPropertyValues"][index2]["skuPropertySendGoodsCountryCode"] != getOnlyForCountry) {
        continue;
      }
      if (json["sizesColors"][index]["skuPropertyValues"][index2]["skuPropertySendGoodsCountryCode"] && 
      json["sizesColors"][index]["skuPropertyValues"][index2]["propertyValueName"] &&
      countryFullNames.hasOwnProperty(json["sizesColors"][index]["skuPropertyValues"][index2]["skuPropertySendGoodsCountryCode"].toLowerCase()) &&
      countryFullNames[json["sizesColors"][index]["skuPropertyValues"][index2]["skuPropertySendGoodsCountryCode"].toLowerCase()] != json["sizesColors"][index]["skuPropertyValues"][index2]["propertyValueName"].toLowerCase()
      ) {
        continue
      }
      const propertyId = json["sizesColors"][index]["skuPropertyValues"][index2]["propertyValueIdLong"];
      const propertyIdName = json["sizesColors"][index]["skuPropertyValues"][index2]["propertyValueDisplayName"];
      arrayInNumbers[index].push(`${id}:${propertyId}`);
      arrayInNames[index].push(`${idName}:${propertyIdName}`);
    }
  }
  const num = makePriceList(arrayInNumbers);
  const name = makePriceList(arrayInNames);
  for (let x = 0; x < num.length; x++) {
    for (let index = 0; index < json["priceList"].length; index++) {
      let attrNewValue = "";
      const attr = json["priceList"][index]["skuAttr"].split(";");
      for (let index2 = 0; index2 < attr.length; index2++) {
        if (attr[index2].includes("#")) {
          attr[index2] = attr[index2].split("#")[0];
        }
      }
      for (let index2 = 0; index2 < attr.length; index2++) {
        attrNewValue += attr[index2];
        if (index2 != attr.length - 1) {
          attrNewValue += ";";
        }
      }

      if (attrNewValue.includes(num[x])) {
        priceListInNumbers.push(num[x]);
        priceListInNames.push(name[x]);
        priceData.push(json["priceList"][index]["skuVal"]);
      }
    }
  }

  const tempNames = priceListInNames;
  const tempNumbers = priceListInNumbers;
  priceListInNames = [];
  priceListInNumbers = [];
  for (let index = 0; index < tempNames.length; index++) {
    const elementInName = tempNames[index].split(";");
    const elementInNumber = tempNumbers[index].split(";");

    if (showShipFromInFinalData == false) {
      for (let index2 = 0; index2 < elementInName.length; index2++) {
        if (elementInName[index2].includes("Ships From")) {
          elementInName[index2] = "";
          elementInNumber[index2] = "";
          continue;
        }
      }
    }
    let tempStringNames = "";
    let tempStringNumbers = "";

    for (let index3 = 0; index3 < elementInName.length; index3++) {
      if (elementInName[index3] == "") {
        continue;
      }
      tempStringNames += `${elementInName[index3]}`;
      tempStringNumbers += `${elementInNumber[index3]}`;
      if (index3 != elementInName.length - 1) {
        tempStringNames += ";";
        tempStringNumbers += ";";
      }
    }
    priceListInNumbers.push(tempStringNumbers);
    priceListInNames.push(tempStringNames);
  }
  const ProductData = { _info: "All are synced by their indexes ==> Meaning ===> InNames[0] == InNumbers[0] == Data[0]", country: getOnlyForCountry, InNames: priceListInNames, InNumbers: priceListInNumbers, Data: priceData };
  return ProductData;
}
function make_Combinations(...args) {
  var r = [],
    max = args.length - 1;
  function helper(arr, i) {
    for (var j = 0, l = args[i].length; j < l; j++) {
      var a = arr.slice(0); // clone arr
      a.push(args[i][j]);
      if (i == max) r.push(a);
      else helper(a, i + 1);
    }
  }
  helper([], 0);
  return r;
}

function makePriceList(array) {
  let tempArray = [];
  for (let index = 0; index < Object.keys(array).length; index++) {
    tempArray.push(array[index]);
  }
  const result = make_Combinations(...tempArray);
  tempArray = [];
  for (let index = 0; index < result.length; index++) {
    tempString = "";
    for (let index2 = 0; index2 < result[index].length; index2++) {
      tempString += `${result[index][index2]}`;
      if (index2 != result[index].length - 1) {
        tempString += ";";
      }
    }
    tempArray.push(tempString);
  }
  return tempArray;
}

function formatPricesMain(json, showShipFromInFinalData = false, country1 = "", country2 = "") {
  if (country1 != "" && country2 != "") {
    const firstCountryData = formatAllPrices(json, country1);
    const secondCountryData = formatAllPrices(json, country2);
    
    const tempArray = { ...firstCountryData };
    tempArray["Data"] = [];
    tempArray["country"] = `${country1} / ${country2}`;
    if (firstCountryData["Data"].length == 0 && secondCountryData["Data"].length == 0) {
      throw Error("Both Countries prices not found");
    } else if (firstCountryData["Data"].length == 0) {
      return secondCountryData;
    } else if (secondCountryData["Data"].length == 0) {
      return firstCountryData;
    }

    for (let index = 0; index < firstCountryData["Data"].length; index++) {
      const firstDataPrice = firstCountryData["Data"][index]["skuCalPrice"];
      const secondDataPrice = secondCountryData["Data"][index] && secondCountryData["Data"][index].hasOwnProperty("skuCalPrice") ? secondCountryData["Data"][index]["skuCalPrice"] : 0;

      if (firstDataPrice >= secondDataPrice) {
        if (parseInt(firstCountryData["Data"][index]["availQuantity"]) > parseInt(secondCountryData["Data"][index]["availQuantity"]) && parseInt(secondCountryData["Data"][index]["availQuantity"]) != 0) {
          firstCountryData["Data"][index]["availQuantity"] = secondCountryData["Data"][index]["availQuantity"];
          firstCountryData["Data"][index]["inventory"] = secondCountryData["Data"][index]["inventory"];
          if (firstCountryData["Data"][index].hasOwnProperty("bulkOrder") && secondCountryData["Data"][index].hasOwnProperty("bulkOrder")) {
            firstCountryData["Data"][index]["bulkOrder"] = secondCountryData["Data"][index]["bulkOrder"];
          }
        }
        tempArray["Data"].push(firstCountryData["Data"][index]);
      } else {
        if (secondCountryData["Data"][index]["availQuantity"] > firstCountryData["Data"][index]["availQuantity"] && firstCountryData["Data"][index]["availQuantity"] != 0) {
          secondCountryData["Data"][index]["availQuantity"] = firstCountryData["Data"][index]["availQuantity"];
          secondCountryData["Data"][index]["inventory"] = firstCountryData["Data"][index]["inventory"];
          if (firstCountryData["Data"][index].hasOwnProperty("bulkOrder") && secondCountryData["Data"][index].hasOwnProperty("bulkOrder")) {
            secondCountryData["Data"][index]["bulkOrder"] = firstCountryData["Data"][index]["bulkOrder"];
          }
        }
        tempArray["Data"].push(secondCountryData["Data"][index]);
      }
    }
    return tempArray;
  } else if (country1 != "" && country2 == "") {
    firstCountryData = formatAllPrices(json, country1, showShipFromInFinalData);
    return firstCountryData;
  } else {
    print("Please Enter Any Country");
    throw Error("Please Enter Any Country");
  }
}

function shippingDataSorter(shippingData) {
  // const shippingArray = shippingData["generalFreightInfo"]["originalLayoutResultList"];
  // console.log(shippingData);
  const shippingArray = shippingData
  const shippingFinalData = {};
  const tempData = [];
  for (let index = 0; index < shippingArray.length; index++) {
    shippingArray[index]["bizData"]["display"] = true;
    shippingArray[index]["bizData"]["deliveryProviderName"] = shippingArray[index]["bizData"]["deliveryProviderName"].replace(new RegExp("aliexpress", "ig"), "Company");
    shippingArray[index]["bizData"]["deliveryProviderName"] = shippingArray[index]["bizData"]["deliveryProviderName"].replace(new RegExp("seller's", "ig"), "Company");

    shippingArray[index]["bizData"]["company"] = shippingArray[index]["bizData"]["company"].replace(new RegExp("aliexpress", "ig"), "Company");
    shippingArray[index]["bizData"]["company"] = shippingArray[index]["bizData"]["company"].replace(new RegExp("seller's", "ig"), "Company");

    if (shippingArray[index]["bizData"]["shippingFee"] == "free") {
      shippingArray[index]["bizData"]["displayAmount"] = 0;
    }
    tempData.push(shippingArray[index]["bizData"]);
  }

  const sortedByPriceData = tempData.sort((a, b) => parseFloat(a.displayAmount) - parseFloat(b.displayAmount));
  return sortedByPriceData;
}

module.exports = { formatPricesMain, shippingDataSorter };
