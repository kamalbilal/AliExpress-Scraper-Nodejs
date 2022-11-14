let {query} = require("../db/postgress_db");

const queries = [
  `DROP SCHEMA IF EXISTS public CASCADE;`,
  `DROP SCHEMA IF EXISTS shop CASCADE;`,
  `CREATE SCHEMA shop;`,

  `CREATE TABLE shop.t_productid (
    id SERIAL PRIMARY KEY,
    productId BigInt unique
  );`,

  ` CREATE TABLE shop.t_titles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150),
    foreign_id int REFERENCES shop.t_productid(id) ON DELETE CASCADE
  );`,

  ` CREATE TABLE shop.t_pricelist (
    id SERIAL PRIMARY KEY,
    foreign_id int REFERENCES shop.t_productid(id) ON DELETE CASCADE,
    byName text[],
    byNumber text[],
    byData jsonb[],
    country varchar(10)
  );`,

  ` CREATE TABLE shop.t_specs (
    id SERIAL PRIMARY KEY,
    foreign_id int REFERENCES shop.t_productid(id) ON DELETE CASCADE,
    specs jsonb[]
  );`,
  ` CREATE TABLE shop.t_product_ratings (
    id SERIAL PRIMARY KEY,
    display Boolean DEFAULT true,
    positiveRating Decimal(6, 2) DEFAULT 0.0,
    averageStar Decimal(6, 2) DEFAULT 0.0,
    averageStarPercentage Decimal(6, 2) DEFAULT 0.0,
    fiveStar INT DEFAULT 0,
    fiveStarPercentage Decimal(6, 2) DEFAULT 0.0,
    fourStar INT DEFAULT 0,
    fourStarPercentage Decimal(6, 2) DEFAULT 0.0,
    threeStar INT DEFAULT 0,
    threeStarPercentage Decimal(6, 2) DEFAULT 0.0,
    twoStar INT DEFAULT 0,
    twoStarPercentage Decimal(6, 2) DEFAULT 0.0,
    oneStar INT DEFAULT 0,
    oneStarPercentage Decimal(6, 2) DEFAULT 0.0,
    totalReviews Int DEFAULT 0,
    foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE
  );`,
  ` CREATE TABLE shop.t_storeinfo (
    id SERIAL PRIMARY KEY,
    companyId VARCHAR(18),
    country VARCHAR(18),
    followersNum INT,
    openDate Date,
    openedForYears INT,
    positiveNum INT,
    positiveRating Decimal(6, 2) DEFAULT 0.0,
    storeName VARCHAR(150),
    storeNum VARCHAR(18),
    sellerAdminSeq VARCHAR(18),
    storeUrl VARCHAR(150),
    isSellerLocal Boolean DEFAULT false,
    isSellerTopRated Boolean DEFAULT false,
    foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE shop.t_shippingdetails (
    	id SERIAL PRIMARY KEY,
    	shipping jsonb[],
    	foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE
    );`,
    ` CREATE TABLE shop.t_modifieddescription (
      id SERIAL PRIMARY KEY,
      description TEXT,
      isModified Boolean Default false,
      foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE
    );`,
    `create index idx_isModified on shop.t_modifieddescription(isModified);`,
    ` CREATE TABLE shop.t_basicInfo (
      id SERIAL PRIMARY KEY,
      display Boolean DEFAULT true,
      scrapMethod VARCHAR(10),
      product_link VARCHAR(100),
      description_link VARCHAR(255),
      minPrice Decimal(6, 2) DEFAULT 0.0,
      maxPrice Decimal(6, 2) DEFAULT 0.0,
      discountNumber Decimal(6, 2) DEFAULT 0.0,
      discount VARCHAR(10),
      minPrice_AfterDiscount Decimal(6, 2) DEFAULT 0.0,
      maxPrice_AfterDiscount Decimal(6, 2) DEFAULT 0.0,
      multiUnitName VARCHAR(15),
      oddUnitName VARCHAR(15),
      maxPurchaseLimit INT,
      buyLimitText VARCHAR(40),
      quantityAvaliable INT,
      totalOrders INT,
      totalProductSoldCount INT,
      totalProductSoldCountUnit VARCHAR(15),
      totalProductWishedCount INT,
      comingSoon Boolean DEFAULT false,
      foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE
    );`,
    ` CREATE TABLE shop.t_mainImages (
      id SERIAL PRIMARY KEY,
      image_link_Array text[],
      foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE
    );`,
    ` CREATE TABLE shop.t_properties (
      id SERIAL PRIMARY KEY,
      property_array jsonb[],
      foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE
    );`
];

async function reCreateDataBase() {
  console.log("Re-creating Database...");
  for (let index = 0; index < queries.length; index++) {
    await query(queries[index]);
  }
  console.log("Successfully Created Database...");
}

module.exports = reCreateDataBase