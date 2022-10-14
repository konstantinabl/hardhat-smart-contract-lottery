const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    //0xBb2404c9981f465069B1957377DCf1F09f54546d
    console.log("Verifying contract")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
