const { exec } = require("child_process");
const operatingSystem = "linux" // linux or windows


function connectToWindscribe() {
  return new Promise((resolve, reject) => {
      exec(operatingSystem === "linux" ? "windscribe disconnect && windscribe connect best" : "cd windscribe_vpn_installation && windscribe-cli connect best", (error, stdout, stderr) => {
      if (error) {
        reject({ status: "error" })
        return;
      }
      if (stderr) {
        reject({ status: "stderr error" })
        return;
      }
      console.log(`stdout: ${stdout}`);
      resolve({
        status: "connected"
      })
      // if (stdout.includes("Your IP changed")) {
      //   resolve({
      //     status: "connected", 
      //     previousIp: ((stdout.split("Your IP changed from ")[1]).split(" to")[0]),
      //     newIp: ((stdout.split("Your IP changed from")[1]).split("to ")[1]).split("\n")[0],
      //   })
      // }
      //  else {
      //   reject({status: "ip did not changed"})
      // }
    });
  })
}
function disconnectWindscribe() {
  return new Promise((resolve, reject) => {
    exec(operatingSystem === "linux" ? "windscribe disconnect" : "cd windscribe_vpn_installation && windscribe-cli disconnect", (error, stdout, stderr) => {
      if (error) {
        reject({ status: "error disconnect" })
        return;
      }
      if (stderr) {
        reject({ status: "stderr error disconnect" })
        return;
      }
      console.log(`stdout: ${stdout}`);

      resolve({
        status: "disconnected",
      })
    });
  })
}

(async function () {
  await disconnectWindscribe()
})()

module.exports = { connectToWindscribe, disconnectWindscribe }