function handleErrors(error) {
    const reason = error.reason
    if (reason === "Sorry, this item is no longer available!") {
        // console.log("Sorry, this item is no longer available!");
    }
}

module.exports = handleErrors