let { query } = require("../db/postgress_db");

const queries = [
  `DROP SCHEMA IF EXISTS public CASCADE;`,
  `DROP SCHEMA IF EXISTS shop CASCADE;`,
  `CREATE SCHEMA shop;`,

  `CREATE TABLE shop.t_productid (
    id SERIAL PRIMARY KEY,
    productId BigInt unique NOT NULL,
    myProductId BigInt unique NOT NULL
  );`,
  `create index idx_productId on shop.t_productid(productId);`,
  `create index idx_myProductId on shop.t_productid(myProductId);`,

  ` CREATE TABLE shop.t_titles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150),
    foreign_id int REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL
  );`,
  `create index idx_title_foreign_id on shop.t_titles(foreign_id);`,

  ` CREATE TABLE shop.t_pricelist (
    id SERIAL PRIMARY KEY,
    foreign_id int REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL,
    byName jsonb[],
    byNumber jsonb[],
    byData jsonb[],
    country varchar(10)
  );`,
  `create index idx_priceList_foreign_id on shop.t_pricelist(foreign_id);`,


  ` CREATE TABLE shop.t_specs (
    id SERIAL PRIMARY KEY,
    foreign_id int REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL,
    specs jsonb[]
  );`,
  `create index idx_specs_foreign_id on shop.t_specs(foreign_id);`,

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
    foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL
  );`,
  `create index idx_product_ratings_foreign_id on shop.t_product_ratings(foreign_id);`,

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
    foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL
  );`,
  `create index idx_storeinfo_foreign_id on shop.t_storeinfo(foreign_id);`,

  `CREATE TABLE shop.t_shippingdetails (
    	id SERIAL PRIMARY KEY,
    	shipping jsonb[],
    	foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL
    );`,
  `create index idx_shippingdetails_foreign_id on shop.t_shippingdetails(foreign_id);`,

  ` CREATE TABLE shop.t_modifieddescription (
      id SERIAL PRIMARY KEY,
      description TEXT,
      isModified Boolean Default false,
      foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL
    );`,

  `create index idx_modifieddescription_isModified on shop.t_modifieddescription(isModified);`,
  `create index idx_modifieddescription_foreign_id on shop.t_modifieddescription(foreign_id);`,

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
      foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL
    );`,
  `create index idx_basicInfo_foreign_id on shop.t_basicInfo(foreign_id);`,

  ` CREATE TABLE shop.t_mainImages (
      id SERIAL PRIMARY KEY,
      image_link_Array jsonb[],
      foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL
    );`,
  `create index idx_mainImages_foreign_id on shop.t_mainImages(foreign_id);`,

  ` CREATE TABLE shop.t_properties (
      id SERIAL PRIMARY KEY,
      property_array jsonb[],
      foreign_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL
    );`,
  `create index idx_properties_foreign_id on shop.t_properties(foreign_id);`,

  ` CREATE TABLE shop.t_users (
      id SERIAL PRIMARY KEY,
      email character varying(100) unique,
      password varchar(75),
      cartCount INT DEFAULT 0
      );`,
  // data jsonb DEFAULT '{"cart": {}}'::jsonb
  `create index idx_users_email on shop.t_users(email);`,

  `CREATE TABLE shop.t_cart (
    id SERIAL PRIMARY KEY,
    foreign_user_id INT REFERENCES shop.t_users(id) ON DELETE CASCADE NOT NULL,
    foreign_product_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL,
    cartName varchar(60) NOT NULL,
    selectedImageUrl varchar(250) NOT NULL,
    quantity INT NOT NULL,
    price Decimal(6, 2) NOT NULL,
    shippingPrice Decimal(6, 2) NOT NULL,
    discount Decimal(6, 2) DEFAULT 0.0,
    selectedProperties jsonb DEFAULT '{}'::jsonb NOT NULL,
    shippingDetails jsonb DEFAULT '{}'::jsonb NOT NULL
    );`,

  `create index idx_foreign_product_id on shop.t_cart(foreign_product_id);`,
  `create index idx_foreign_user_id on shop.t_cart(foreign_user_id);`,
  `create index idx_cartName on shop.t_cart(cartName);`,

  `CREATE TABLE shop.t_wishList (
    id SERIAL PRIMARY KEY,
    foreign_user_id INT REFERENCES shop.t_users(id) ON DELETE CASCADE NOT NULL,
    wishListName varchar(60) NOT NULL,
    UNIQUE(foreign_user_id, wishListName)
    );`,

  `create index idx_t_wishList_foreign_user_id on shop.t_wishList(foreign_user_id);`,
  `create index idx_wishListName on shop.t_wishList(wishListName);`,

  `CREATE TABLE shop.t_wishList_products (
    id SERIAL PRIMARY KEY,
    foreign_user_id INT REFERENCES shop.t_users(id) ON DELETE CASCADE NOT NULL,
    foreign_product_id INT REFERENCES shop.t_productid(id) ON DELETE CASCADE NOT NULL,
    foreign_wishList_id INT REFERENCES shop.t_wishList(id) ON DELETE CASCADE NOT NULL,
    selectedImageUrl varchar(250) NOT NULL
    );`,

  `create index idx_t_wishList_products_foreign_user_id on shop.t_wishList_products(foreign_user_id);`,
  `create index idx_t_wishList_products_foreign_product_id on shop.t_wishList_products(foreign_product_id);`,
  `create index idx_t_wishList_products_foreign_wishList_id on shop.t_wishList_products(foreign_wishList_id);`,

];

async function reCreateDataBase() {
  console.log("Re-creating Database...");
  for (let index = 0; index < queries.length; index++) {
    await query(queries[index]);
  }
  console.log("Successfully Created Database...");
}

module.exports = reCreateDataBase