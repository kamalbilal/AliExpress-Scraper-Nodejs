const fs = require("fs")
const insertOrUpdate_ProductData = require("./createProductToDb_Queries")

async function WriteToFile_WithoutCheckingImages(array) {
    console.log("Checking Images is false...");
    for (let index = 0; index < array.length; index++) {
        if (array[index]["status"] === "fulfilled") {
            fs.writeFileSync(`output/resolved/${array[index]["value"]["old_productId"]}.json`, JSON.stringify(array[index]["value"]));
            insertOrUpdate_ProductData(array[index]["value"])
            // try{
                // fs.writeFileSync(`output/resolved_sql/${array[index]["value"]["old_productId"]}.sql`, await insertOrUpdate_ProductData(array[index]["value"]));
            // } catch(e) {
            //     console.log(array[index]);
            //     console.log(e);
            
            // }
        }
        
    }
    return null
}

module.exports = WriteToFile_WithoutCheckingImages