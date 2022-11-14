const glob = require("glob");
const fs = require("fs");
let { query, getConnection } = require("./db/postgress_db");
const createPrompt = require("prompt-sync");
const prompt = createPrompt({});
const chalk = require("chalk");
const reCreateDataBase = require("./db_modules/reCreateDatabase");
const rimraf = require("rimraf");

let settings = fs.readFileSync("variables/mainFileSettings.json", "utf8");
settings = settings ? JSON.parse(settings) : {};

function updateMainSettings(keyname, value) {
  fs.writeFileSync("variables/mainFileSettings.json", JSON.stringify({ ...settings, [keyname]: value }))
}

function Glob(query) {
  return new Promise((resolve, reject) => {
    glob(query, null, function (er, files) {
      resolve(files);
    });
  });
}

async function getId_From_t_ProductId(productId) {
  if (!productId) return { status: false, reason: "Enter ProductId" };
  let id = await query(`SELECT id FROM shop.t_productid WHERE productid = ${productId}`);
  if (id["rows"].length === 0) {
    id = await query(`INSERT INTO shop.t_productid(productid) Values(${productId}) RETURNING id`);
    // id = await query(`SELECT id FROM shop.t_productid WHERE productid = ${productId}`);
  } else {
    await query(`DELETE FROM shop.t_productid WHERE productid = ${productId}`);
    id = await query(`INSERT INTO shop.t_productid(productid) Values(${productId}) RETURNING id;`);
    // id = await query(`SELECT id FROM shop.t_productid WHERE productid = ${productId}`);
  }
  return { status: true, id: id["rows"][0]["id"] };
}

function queryPromise(fileData) {
  return new Promise(async (resolve, reject) => {
    let productId = await getId_From_t_ProductId(fileData.id);
    if (productId.status === false) {
      console.log({ error: "error", reason: productId.reason });
      return;
    } else {
      productId = productId.id;
    }

    for (let index = 0; index < fileData.queries.length; index++) {
      let queryText = fileData.queries[index].replaceAll("$REPLACE$", productId);
      query(queryText);
    }
    resolve(true);
  });
}

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + "H:" + minutes + "M:" + seconds + "S " + ampm;
  return strTime;
}

async function askPassword() {
  let askPassword = true;
  let authenticated = false;
  while (askPassword) {
    const password = prompt("Enter a password: ");
    if (password && password === "kamal") {
      askPassword = false;
      authenticated = true;
      // console.log("\033[2J");
      // console.clear();
      console.log(chalk.greenBright("\n--------------Successfully Authenticated--------------\n"));
    } else if (!password) {
      askPassword = false;
      console.log(chalk.redBright("No Password Provided ===> Exited"));
    } else {
      console.log(chalk.redBright("\n--------------Invalid Password--------------\n"));
    }
  }
  return authenticated;
}

async function main() {
  if (!(await askPassword())) {
    return;
  }
  const files = await Glob("output/resolved_sql/*.sql");
  const startedOnTime = formatAMPM(new Date());
  console.log(startedOnTime);
  const filesLength = files.length;
  let promiseArray = [];
  for (let index = 0; index < files.length; index++) {
    if (index % 1 != 0) {
      const fileData = JSON.parse(fs.readFileSync(files[index]));
      console.log(`Current File Number = ${index + 1}/${filesLength} : Remaining => ${filesLength - (index + 1)} files : productId = ${fileData.id}`);
      promiseArray.push(fileData);
      continue;
    }
    const fileData = JSON.parse(fs.readFileSync(files[index]));
    console.log(`Current File Number = ${index + 1}/${filesLength} : Remaining => ${filesLength - (index + 1)} files : productId = ${fileData.id}`);
    promiseArray.push(fileData);
    await Promise.all(promiseArray.map((el) => queryPromise(el)));
    promiseArray = [];
  }
  console.log("Completed");
  console.log({ startedOnTime, endedOnTime: formatAMPM(new Date()) });
}

async function countRowsInAllTables() {
  // const output = await query(`select 
  // t_basicInfo.display as "_display",
  // t_basicInfo.product_link as "link",
  // t_basicInfo.minprice as "minPrice",
  // t_basicInfo.maxprice as "maxPrice",
  // t_basicInfo.discountnumber as "discountNumber",
  // t_basicInfo.discount as "discount",
  // t_basicInfo.minprice_afterdiscount as "minPrice_AfterDiscount",
  // t_basicInfo.maxprice_afterdiscount as "maxPrice_AfterDiscount",
  // t_basicInfo.multiunitname as "multiUnitName",
  // t_basicInfo.oddunitname as "oddUnitName",
  // t_basicInfo.maxpurchaselimit as "maxPurchaseLimit",
  // t_basicInfo.buylimittext as "buyLimitText",
  // t_basicInfo.quantityavaliable as "quantityAvaliable",
  // t_basicInfo.comingSoon as "comingSoon",
  // t_productId.productId as "productId",
  // t_titles.title,
  // t_mainimages.image_link_array as "images",
  // t_properties.property_array as "sizesColors",
  // t_pricelist.byname as "priceList_InNames",
  // t_pricelist.bynumber as "priceList_InNumbers",
  // t_pricelist.bydata  as "priceList_Data",
  // t_specs.specs as "specs"
  // from shop.t_productId
  // join shop.t_basicInfo on t_basicInfo.foreign_id = t_productId.id
  // join shop.t_titles on t_titles.foreign_id = t_productId.id
  // join shop.t_mainimages on t_mainimages.foreign_id = t_productId.id
  // join shop.t_properties on t_properties.foreign_id = t_productId.id
  // join shop.t_pricelist on t_pricelist.foreign_id = t_productId.id
  // join shop.t_specs on t_specs.foreign_id = t_productId.id
  // where t_productId.productId = 3256804143766081;
  // `);
  // console.log(output.rows[0]);
  // return
  const tableNames = ["t_productid", "t_titles", "t_pricelist", "t_specs", "t_product_ratings", "t_storeinfo", "t_shippingdetails", "t_modifieddescription", "t_basicInfo", "t_mainImages", "t_properties"];
  const result = [];
  let firstResult = null;
  const connection = await getConnection()
  for (let index = 0; index < tableNames.length; index++) {
    const table = tableNames[index];
    const output = await query(`SELECT count(id) as count From shop.${table}`, connection);
    result.push({ [table]: output["rows"][0]["count"] * 1 });
    if (index === 0) {
      firstResult = output["rows"][0]["count"] * 1;
    }
  }
  connection.release()
  console.log(result);
  for (let index = 0; index < result.length; index++) {
    const value = Object.values(result[index]);
    if (firstResult != value[0]) {
      console.log(chalk.redBright("Error ==> Number of Table rows are not same"));
      return;
    }
  }
  console.log(chalk.greenBright("Success ==> Number of Table rows are same ==> '" + firstResult + "'"));
}

function reset() {
  rimraf.sync("output/resolved/*");
  rimraf.sync("output/resolved_sql/*");
  rimraf.sync("output/rejected/*");
  fs.writeFileSync("variables/lastSearchedProductData.json", "");
  console.log("Reset Completed");
}

async function reCreateDataBase_with_authentication() {
  if (!(await askPassword())) {
    return;
  }
  reCreateDataBase();
}

// Note options[0] == optionsDisplay[0]
const options = ["import", "count", "recreate", "reset", "getAllProducts", "getSingleProduct", "searchAllProducts", "searchSingleProduct", "resetAllSearchData", "editSearchCategoriesFile", "RetryGettingRejectedProducts", "getFailedProductsFromDb", "RetryGettingFailedRejectedProducts"];
const optionsDisplay = [
  "Auto Import To Db",
  "Count All Tables rows in db",
  "Recreate db",
  "Remove ('resolved/*' & 'resolved_sql/*' & 'output/rejected/*') and reset variable",
  "Get All Products Data",
  "Get Single Products Data",
  "Search All Categories",
  "Search Single Category",
  "Reset Search Data",
  "Add/Edit Search Categories",
  "Retry Getting Rejected Products",
  "Get Failed Products From database",
  "Retry Getting Failed Products From database",
];

let inputParameter = process.argv[2] ? options.findIndex((el) => el.toLowerCase() === process.argv[2].toLowerCase()) : null;
if (!inputParameter || inputParameter === -1) {
  console.log(chalk.greenBright("Please Select Option"));
  console.log(chalk.greenBright(`${optionsDisplay.map((el, index) => `\n(${index + 1}) - ${el}`)}\n`.replaceAll(",", "")));
  inputParameter = prompt("==> ") * 1 - 1;
}

console.log(chalk.greenBright(`Selected Option ==> (${inputParameter + 1}) - ${optionsDisplay[inputParameter]}`));

if (inputParameter == 0) {
  main();
} else if (inputParameter == 1) {
  countRowsInAllTables();
} else if (inputParameter == 2) {
  reCreateDataBase_with_authentication();
} else if (inputParameter == 3) {
  reset();
} else if (inputParameter == 4) {
  const productData = require("./mainFiles/productData");
  productData.getAllProductsData();
} else if (inputParameter == 5) {
  console.log(chalk.greenBright(`Note ==> Press TAB to enter previous entered productId ==> ${settings.hasOwnProperty("getSingleProductPreviousData") ? settings["getSingleProductPreviousData"] : ""}`));
  const productId = prompt("Enter ProductId: ", {
    autocomplete: complete([`${settings.hasOwnProperty("getSingleProductPreviousData") ? settings["getSingleProductPreviousData"] : ""}`]),
  });
  if (productId) {
    updateMainSettings("getSingleProductPreviousData", productId)
    const productData = require("./mainFiles/productData");
    productData.getSingleProductData(productId);
  } else {
    console.log(chalk.redBright("No ProductId entered ==> Exited"));
  }
} else if (inputParameter == 6) {
  const searchProducts = require("./mainFiles/searchProducts");
  searchProducts.searchAllProducts();
} else if (inputParameter == 7) {
  const category = prompt("Enter category to search: ");
  if (category) {
    const searchProducts = require("./mainFiles/searchProducts");
    searchProducts.searchSingleProduct(category);
  } else {
    console.log(chalk.redBright("No category entered ==> Exited"));
  }
} else if (inputParameter == 8) {
  console.log(chalk.greenBright("Reset\n(1) - Reset Search Variables\n(2) - Delete All Files ('output/searchProducts_Output/*')\n(3) - Do Both"));
  const number = prompt("Select a number: ");
  if (number && number == 1) {
    fs.writeFileSync("variables/lastSearched.json", "");
    console.log(chalk.greenBright("Variables Reseted Successfully"));
  } else if (number && number == 2) {
    rimraf.sync("output/searchProducts_Output/*.txt");
    console.log(chalk.greenBright("Deleted All files ==> output/searchProducts_Output/*.txt"));
  } else if (number && number == 3) {
    rimraf.sync("output/searchProducts_Output/*.txt");
    fs.writeFileSync("variables/lastSearched.json", "");
    console.log(chalk.greenBright("(Variables Reseted Successfully) && (Deleted All files ==> output/searchProducts_Output/*.txt"));
  } else {
    console.log(chalk.redBright("No number entered ==> Exited"));
  }
} else if (inputParameter == 9) {
  const data = fs.readFileSync("variables/search_these.json", "utf8");
  const dataArray = data ? JSON.parse(data) : [];
  console.log(chalk.blueBright("\nNote"));
  console.log(chalk.greenBright("You can add more catogories by name starting with / ==> Example ==> glasses/car/cover\n"));
  const defaultList = `Edit List ==> ${dataArray.map((el) => el).join("/")}/`;

  let getCommandFromUser = true;

  while (getCommandFromUser) {
    let input = prompt(chalk.greenBright("Press Tab To Continue: "), defaultList, {
      autocomplete: complete([defaultList]),
    });
    if (input && input.includes("Edit List ==> ") && input != defaultList) {
      input = input.split("Edit List ==> ")[1];
      input = input.split("/");
      input = input.filter(function (el) {
        return el != "";
      });
      fs.writeFileSync("variables/search_these.json", JSON.stringify(input));
      console.log(chalk.greenBright(`Saved Categories ==> ${input}`));
      getCommandFromUser = false;
    } else if (input == defaultList) {
      getCommandFromUser = false;
      input = input.split("Edit List ==> ")[1];
      input = input.split("/");
      input = input.filter(function (el) {
        return el != "";
      });
      console.log(chalk.greenBright(`Nothing Changed! But Current Categories are ==> ${input}`));
    } else {
      console.log(chalk.redBright("Tab Key not pressed ==> Exited"));
    }
  }
}
else if (inputParameter == 10) {
  getProductsDataFromArray()
}
else if (inputParameter == 11) {
  getFailedProductsFromDb()
}
else if (inputParameter == 12) {
  retryGettingFailedProductsFromDatabase()
}
else {
  console.log(chalk.redBright("Invalid Parameter"));
}

async function getProductsDataFromArray() {
  let files = await Glob("output/rejected/*.txt");
  if (files.length === 0) {
    console.log(chalk.redBright("No rejected files found"));
    return
  }
  files = files.map((el) => (el.split("rejected/")[1]).split(".txt")[0])
  const productData = require("./mainFiles/productData");
  productData.getAllProductsDataFromArray(files)

}

async function retryGettingFailedProductsFromDatabase() {
  let runWhileLoop = true
  const productData = require("./mainFiles/productData");
  while (runWhileLoop) {
    const files = await getFailedProductsFromDb(false)
    if (files["productId"] == null) {
      runWhileLoop = false
      console.log(chalk.greenBright("No Failed Products Found"));
      return
    } else {
      await productData.getAllProductsDataFromArray(files["productId"], false)
    }

  }
}

async function getFailedProductsFromDb(log = true) {
  const output = await query(`select array_agg(t_productid.productid)  as "productId"
  FROM shop.t_productid
  left join shop.t_basicInfo on t_basicInfo.foreign_id = t_productId.id
  left join shop.t_titles on t_titles.foreign_id = t_productId.id
  left join shop.t_product_ratings on t_product_ratings.foreign_id = t_productId.id
  left join shop.t_mainimages on t_mainimages.foreign_id = t_productId.id
  left join shop.t_properties on t_properties.foreign_id = t_productId.id
  left join shop.t_pricelist on t_pricelist.foreign_id = t_productId.id
  left join shop.t_specs on t_specs.foreign_id = t_productId.id
  WHERE (shop.t_product_ratings.id IS null) 
  OR (shop.t_basicinfo.id IS null) 
  OR (shop.t_titles.id IS null)
  OR (shop.t_mainimages.id IS null)
  OR (shop.t_properties.id IS null)
  OR (shop.t_pricelist.id IS null)
  OR (shop.t_specs.id IS null)
  limit(25);
  `)

  if (log) {
    console.log(output["rows"][0]);
  }

  return output["rows"][0]
}

function complete(commands) {
  return function (str) {
    var i;
    var ret = [];
    for (i = 0; i < commands.length; i++) {
      if (commands[i].indexOf(str) == 0) ret.push(commands[i]);
    }
    return ret;
  };
}
