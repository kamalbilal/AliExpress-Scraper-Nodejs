function convertJsonCookieToString(json) {
    let tempString = "";
    const keys = Object.keys(json);
    keys.forEach((element, index) => {
      tempString += `${element}=${json[element]}`;
      if (index != keys.length - 1) {
        tempString += "; ";
      }
    });
    return tempString;
  }

module.exports = convertJsonCookieToString