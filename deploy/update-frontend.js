const { ethers } = require("hardhat")
const fs = require("fs")
const { network } = require("hardhat")

const FRONT_END_ADDRESSES_FILE =
    "../smart-contract-lottery-ui/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../smart-contract-lottery-ui/constants/abi.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updateing front end...")
        updateContractAddresses()
        updateAbi()
    }
}

async function updateAbi() {
    const lottery = await ethers.getContract("SimpleLottery")
    fs.writeFileSync(
        FRONT_END_ABI_FILE,
        lottery.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddresses() {
    const lottery = await ethers.getContract("SimpleLottery")
    const chainId = network.config.chainId.toString()
    const currentAddresses = JSON.parse(
        fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf-8")
    )
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(lottery.address)) {
            currentAddresses[chainId].pushlottery.address
        }
    } else {
        currentAddresses[chainId] = [lottery.address]
    }
    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]
