const glob = require("glob");
const fs = require("fs");

function Glob(query) {
  return new Promise((resolve, reject) => {
    glob(query, null, function (er, files) {
      resolve(files);
    });
  });
}

async function main() {
  const files = await Glob("output/resolved/*.json");
  await fs.writeFileSync("output/final_output/output.json", "[");
  await files.forEach((dir, index) => {
    const fileData = JSON.parse(fs.readFileSync(dir, "utf8"));
    fs.appendFileSync("output/final_output/output.json", JSON.stringify(fileData));
    if (index !== files.length - 1) {
      fs.appendFileSync("output/final_output/output.json", ",");
    }
  });
  fs.appendFileSync("output/final_output/output.json", "]");

  console.log("All Completed");
}

main();
