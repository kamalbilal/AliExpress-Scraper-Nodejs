const chalk = require("chalk");
const fs = require("fs");
const db = require("../db/postgress_db");

async function checkIfExistInDb(updateIfExist) {
  const output = await query(`SELECT ${updateIfExist.columnName} FROM ${updateIfExist.tableName} WHERE ${updateIfExist.columnName} = ${updateIfExist.where}`);
  if (output["rows"].length == 0) {
    return false;
  } else {
    return true;
  }
}

function insertOrUpdate_ProductData_promise(e, connection) {
  return new Promise(async (resolve, reject) => {
    // let exist = false;
    // if (e.hasOwnProperty("updateIfExist") && e.updateIfExist.status === true) {
    //   exist = await checkIfExistInDb(e.updateIfExist);
    //   console.log({ exist });
    // }

    // if (exist === true && e.mainQuery.method === "INSERT") {
    //   const updateQuery = `UPDATE ${e.mainQuery.tableName} SET ${e.updateIfExist.ifExistSetColumns.map((t, i) => `${t}=${e.updateIfExist.ifExistUpdateValues[i]} `)} WHERE ${e.updateIfExist.columnName} = ${e.updateIfExist.where};`;
    //   await query(updateQuery);
    //   console.log("updated " + e.mainQuery.tableName);
    // } else if (exist === false && e.mainQuery.method === "INSERT") {
    const insertQuery = `INSERT INTO ${e.mainQuery.tableName}(${e.mainQuery.insertIntoColumns.map((u) => u).join(", ")}) Values(${e.mainQuery.values.map((u) => u).join(", ")});`;
    db.query(insertQuery, connection);
    //   console.log("inserted " + e.mainQuery.tableName);
    // }
    // resolve(insertQuery);
    resolve(true);
  });
}

async function creatingPriceListQueries(id, priceList) {
  const temp = [];
  temp.push({
    table: "shop.t_priceList",
    mainQuery: {
      method: "INSERT",
      tableName: "shop.t_priceList",
      insertIntoColumns: ["foreign_id", "byName", "byNumber", "byData", "country"],
      values: [
        id,
        `ARRAY [${priceList.InNames.map((el) => `$$${JSON.stringify(el)}$$::jsonb`)}]`,
        `ARRAY [${priceList.InNumbers.map((el) => `$$${JSON.stringify(el)}$$::jsonb`)}]`,
        `ARRAY [${priceList.Data.map((el) => `$$${JSON.stringify(el)}$$::jsonb`)}]`,
        `$$${priceList.country}$$`,
      ],
    },
  });
  return temp;
}

async function creatingSpecsQueries(id, specs) {
  if (!specs || Object.keys(specs) === 0) {
    return [
      {
        table: "shop.t_specs",
        mainQuery: { method: "INSERT", tableName: "shop.t_specs", insertIntoColumns: ["foreign_id", "specs"], values: [id, "null"] },
      }
    ]
  }
  const temp = [];
  temp.push({
    table: "shop.t_specs",
    mainQuery: { method: "INSERT", tableName: "shop.t_specs", insertIntoColumns: ["foreign_id", "specs"], values: [id, `ARRAY [${specs.map((el) => `$$${JSON.stringify(el)}$$::jsonb`)}]`] },
  });
  return temp;
}

async function creatingSpecsDbQueries(id, specs_db) {
  const temp = [];
  specs_db.map((element) => {
    temp.push({
      table: "shop.t_specs_db",
      mainQuery: { method: "INSERT", tableName: "shop.t_specs_db", insertIntoColumns: ["foreign_id", "attrName", "attrValue"], values: [id, `"${element.attrName}"`, `"${element.attrValue}"`] },
    });
  });
  return temp;
}

async function creatingBasicInfoQueries(id, data) {
  const temp = [
    {
      table: "shop.t_basicInfo",
      mainQuery: {
        method: "INSERT",
        tableName: "shop.t_basicInfo",
        insertIntoColumns: [
          "foreign_id",
          "display",
          "scrapMethod",
          "product_link",
          "description_link",
          "minPrice",
          "maxPrice",
          "discountNumber",
          "discount",
          "minPrice_AfterDiscount",
          "maxPrice_AfterDiscount",
          "multiUnitName",
          "oddUnitName",
          "maxPurchaseLimit",
          "buyLimitText",
          "quantityAvaliable",
          "totalOrders",
          "totalProductSoldCount",
          "totalProductSoldCountUnit",
          "totalProductWishedCount",
          "comingSoon",
        ],
        values: [
          id,
          data._display == 1 ? true : false,
          `$$${data.scrapMethod}$$`,
          `$$${data.link}$$`,
          `$$${data.description_Link}$$`,
          parseFloat(data.minPrice),
          parseFloat(data.maxPrice),
          data.discountNumber,
          `$$${data.discount}$$`,
          parseFloat(data.minPrice_AfterDiscount),
          parseFloat(data.maxPrice_AfterDiscount),
          `$$${data.multiUnitName}$$`,
          `$$${data.oddUnitName}$$`,
          data.maxPurchaseLimit,
          `$$${data.buyLimitText}$$`,
          data.quantityAvaliable,
          data.totalOrders,
          data.totalProductSoldCount,
          `$$${data.totalProductSoldCountUnit}$$`,
          data.totalProductWishedCount,
          data.comingSoon,
        ],
      },
    },
  ];
  return temp;
}
async function creatingRatingsQueries(id, ratings) {
  if (Object.keys(ratings).length === 0) {
    return [
      {
        table: "shop.t_product_ratings",
        mainQuery: {
          method: "INSERT",
          tableName: "shop.t_product_ratings",
          insertIntoColumns: [
            "foreign_id",
            "display",
            "positiveRating",
            "averageStar",
            "averageStarPercentage",
            "fiveStar",
            "fiveStarPercentage",
            "fourStar",
            "fourStarPercentage",
            "threeStar",
            "threeStarPercentage",
            "twoStar",
            "twoStarPercentage",
            "oneStar",
            "oneStarPercentage",
            "totalReviews",
          ],
          values: [id, false, "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null"],
        },
      },
    ];
  }
  const temp = [
    {
      table: "shop.t_product_ratings",
      mainQuery: {
        method: "INSERT",
        tableName: "shop.t_product_ratings",
        insertIntoColumns: [
          "foreign_id",
          "display",
          "positiveRating",
          "averageStar",
          "averageStarPercentage",
          "fiveStar",
          "fiveStarPercentage",
          "fourStar",
          "fourStarPercentage",
          "threeStar",
          "threeStarPercentage",
          "twoStar",
          "twoStarPercentage",
          "oneStar",
          "oneStarPercentage",
          "totalReviews",
        ],
        values: [
          id,
          ratings.display,
          parseFloat(ratings.positiveRate),
          parseInt(ratings.averageStar),
          parseFloat(ratings.averageStarRage),
          parseInt(ratings.fiveStarNum),
          parseFloat(ratings.fiveStarRate),
          parseInt(ratings.fourStarNum),
          parseFloat(ratings.fourStarRate),
          parseInt(ratings.threeStarNum),
          parseFloat(ratings.threeStarRate),
          parseInt(ratings.twoStarNum),
          parseFloat(ratings.twoStarRate),
          parseInt(ratings.oneStarNum),
          parseFloat(ratings.oneStarRate),
          parseInt(ratings.totalValidNum),
        ],
      },
    },
  ];
  return temp;
}

async function creatingMainImagesQueries(id, images) {
  const temp = [];
  temp.push({
    table: "shop.t_mainImages",
    mainQuery: {
      method: "INSERT",
      tableName: "shop.t_mainImages",
      insertIntoColumns: ["foreign_id", "image_link_array"],
      values: [id, `ARRAY [${images.map((el) => `$$${JSON.stringify(el)}$$::jsonb`)}]`],
    },
  });
  return temp;
}
async function creatingShippingDetailsQueries(id, shippingDetails) {
  const temp = [];
  temp.push({
    table: "shop.t_shippingDetails",
    mainQuery: {
      method: "INSERT",
      tableName: "shop.t_shippingDetails",
      insertIntoColumns: ["foreign_id", "shipping"],
      values: [id, `ARRAY [${shippingDetails.map((el) => `$$${JSON.stringify(el)}$$::jsonb`)}]`],
    },
  });

  return temp;
}
async function creatingStoreInfoQueries(id, storeInfo, isSellerLocal) {
  const temp = [
    {
      table: "shop.t_storeInfo",
      mainQuery: {
        method: "INSERT",
        tableName: "shop.t_storeInfo",
        insertIntoColumns: ["foreign_id", "companyId", "country", "followersNum", "openDate", "openedForYears", "positiveNum", "positiveRating", "storeName", "storeNum", "sellerAdminSeq", "storeUrl", "isSellerLocal", "isSellerTopRated"],
        values: [
          id,
          storeInfo.hasOwnProperty("companyId") ? `$$${storeInfo.companyId}$$` : "null",
          `$$${storeInfo.countryCompleteName}$$`,
          storeInfo.followingNumber,
          `$$${storeInfo.openTime.replace(",", "")}$$`,
          storeInfo.hasOwnProperty("openedYear") ? storeInfo.openedYear : "null",
          storeInfo.hasOwnProperty("positiveNum") ? storeInfo.positiveNum : "null",
          parseFloat(storeInfo.positiveRate),
          `$$${storeInfo.storeName}$$`,
          `$$${storeInfo.storeNum}$$`,
          `$$${storeInfo.sellerAdminSeq}$$`,
          `$$${storeInfo.storeURL.replace("//", "")}$$`,
          isSellerLocal,
          storeInfo.hasOwnProperty("topRatedSeller") ? storeInfo.topRatedSeller : storeInfo.hasOwnProperty("isTopRatedSeller") ? storeInfo.isTopRatedSeller : false,
        ],
      },
    },
  ];
  return temp;
}
async function creatingTitleQueries(id, title = "Temp") {
  const temp = [
    {
      table: "shop.t_titles",
      // updateIfExist: { status: true, tableName: "shop.t_titles", columnName: "foreign_id", where: id, ifExistSetColumns: ["title"], ifExistUpdateValues: [`"${title}"`] },
      mainQuery: { method: "INSERT", tableName: "shop.t_titles", insertIntoColumns: ["foreign_id", "title"], values: [id, `$$${title}$$`] },
    },
  ];
  return temp;
}
async function creatingModifiedDescriptionQueries(id, modifiedDescription) {
  const temp = [
    {
      table: "shop.t_modifiedDescription",
      mainQuery: { method: "INSERT", tableName: "shop.t_modifiedDescription", insertIntoColumns: ["foreign_id", "description"], values: [id, `${modifiedDescription ? `$$${modifiedDescription.replaceAll("$$", "$$$$")}$$` : "null"}`] },
    },
  ];
  return temp;
}
async function creatingPropertyQueries(id, sizesColors) {
  const temp = [];
  temp.push({
    table: "shop.t_properties",
    mainQuery: {
      method: "INSERT",
      tableName: "shop.t_properties",
      insertIntoColumns: ["foreign_id", "property_array"],
      values: [id, `ARRAY [${sizesColors.map((el) => `$$${JSON.stringify(el)}$$::jsonb`)}]`],
    },
  });
  return temp;
}

async function getId_From_t_ProductId(productId, connection) {
  if (!productId) return { status: false, reason: "Enter ProductId" };
  let id = await db.query(`SELECT id FROM shop.t_productid WHERE productid = ${productId}`, connection);
  if (id["rows"].length === 0) {
    id = await db.query(`INSERT INTO shop.t_productid(productid) Values(${productId}) RETURNING id`, connection);
    // id = await query(`SELECT id FROM shop.t_productid WHERE productid = ${productId}`);
  } else {
    await db.query(`DELETE FROM shop.t_productid WHERE productid = ${productId}`, connection);
    id = await db.query(`INSERT INTO shop.t_productid(productid) Values(${productId}) RETURNING id;`, connection);
    // id = await query(`SELECT id FROM shop.t_productid WHERE productid = ${productId}`);
  }
  return { status: true, id: id["rows"][0]["id"] };
}

async function insertOrUpdate_ProductData(data) {
  try {
    const connection = await db.getConnection();

    let id = await getId_From_t_ProductId(data.productId, connection);
    if (id.status === false) {
      console.log({ error: "error", reason: id.reason });
      return;
    } else {
      id = id.id;
    }
    // const id = "$REPLACE$";

    let queriesArray = [];

    queriesArray.push(...(await creatingTitleQueries(id, data.title)));
    queriesArray.push(...(await creatingPriceListQueries(id, data.priceList)));
    queriesArray.push(...(await creatingSpecsQueries(id, data.specs)));
    // queriesArray.push(...(await creatingSpecsDbQueries(id, data.specsForMongoDb)));
    queriesArray.push(...(await creatingRatingsQueries(id, data.ratings)));
    queriesArray.push(...(await creatingStoreInfoQueries(id, data.storeInfo, data.isSellerLocal)));
    queriesArray.push(...(await creatingShippingDetailsQueries(id, data.shipping)));
    queriesArray.push(...(await creatingModifiedDescriptionQueries(id, data.modified_description_content)));
    queriesArray.push(...(await creatingMainImagesQueries(id, data.images)));
    queriesArray.push(...(await creatingBasicInfoQueries(id, data)));
    queriesArray.push(...(await creatingPropertyQueries(id, data.sizesColors)));

    queriesArray = await Promise.all(queriesArray.map((e) => insertOrUpdate_ProductData_promise(e, connection)));
    connection.release();
    // const obj = { id: data.productId, totalQueries: queriesArray.length, queries: queriesArray };
    // return JSON.stringify(obj);
    return;
    // fs.writeFileSync(`output/resolved_sql/${data.productId}.sql`, JSON.stringify(obj));
  } catch (error) {
    console.log("Error on ProductId = " + chalk.redBright(data.productId));
    console.log(error);
  }
}

// const data = JSON.parse(fs.readFileSync("output/resolved/3256802141029804.json"));
// insertOrUpdate_ProductData(data);

module.exports = insertOrUpdate_ProductData;
