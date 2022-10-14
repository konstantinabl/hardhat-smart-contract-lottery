const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const VRF_SUB_AMOUNT = ethers.utils.parseEther("30")
module.exports = async function ({ getNamedAccounts, deployment }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    let vrfCoordinatorV2Address, subscriptionId
    let chainId = network.config.chainId
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse =
            await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        //fund the subscription
        const VRF_SUB_AMOUNT = ethers.utils.parseEther("30")
        await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            VRF_SUB_AMOUNT
        )
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const keyHash = networkConfig[chainId]["keyHash"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    args = [
        vrfCoordinatorV2Address,
        entranceFee,
        keyHash,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const simpleLottery = await deploy("SimpleLottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(simpleLottery.address, args)
    }
}

module.exports.tags = ["all", "simpleLottery"]
