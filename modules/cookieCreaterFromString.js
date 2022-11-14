function cookieCreaterFromString(str) {
    const temp = {};
    str = str.split("; ");
    str.forEach((element) => {
      if (element.toLowerCase() == "path=/") return;
      if (element.toLowerCase() == "domain=.aliexpress.com") return;
      if (element.toLowerCase().includes("expires") && element.split("=").length == 2) return;
      element = element.replace("HttpOnly, ", "");
      element = element.replace("Path=/, ", "");
  
      if (element.split("=").length == 2) {
        temp[element.split("=")[0]] = element.split("=")[1];
        return;
      }
      if (element.split("=").length == 4 && !element.includes(", ") && element.includes("==")) {
        element = element.split(/=(.*)/s)
        temp[element[0]] = element[1];
        return
      }
      if (element.includes(", ") && element[0].toLowerCase() == "e") {
        element = element.split("GMT, ")[1]
        element = element.split(/=(.*)/s)
        temp[element[0]] = element[1]
        return
      }
      
      element = element.split(/=(.*)/s)
      temp[element[0]] = element[1]
    });
    temp["aep_usuc_f"] = "site=glo&c_tp=USD&region=US&b_locale=en_US"
  
    return temp;
  }

module.exports = cookieCreaterFromString