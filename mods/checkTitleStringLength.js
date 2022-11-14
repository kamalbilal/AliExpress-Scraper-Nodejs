const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("output/final_output/output.json", "utf8")
);
const arr = [];

data.forEach((element, index) => {
    
    element.images.forEach((element2) => {
      arr.push(String(element2).length);
      
  });
});
fs.writeFileSync(
  "data.txt",
  String(
    arr.sort(function (a, b) {
      return b - a;
    })
  )
);
