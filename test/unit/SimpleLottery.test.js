const { ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { deployments } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("SimpleLottery", function () {
          let simpleLottery,
              vrfCoordinatorV2Mock,
              lotteryEntranceFee,
              deployer,
              interval
          const chainId = network.config.chainId
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              simpleLottery = await ethers.getContract(
                  "SimpleLottery",
                  deployer
              )
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
              lotteryEntranceFee = await simpleLottery.getEntranceFee()
              interval = await simpleLottery.getInterval()
          })

          describe("constructor", function () {
              it("initializes the raffle correctly", async function () {
                  //ideally we make our tests have just 1 assert per it
                  const simpleLotteryState =
                      await simpleLottery.getRaffleState()
                  const interval = await simpleLottery.getInterval()
                  assert.equal(simpleLotteryState.toString(), "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId]["interval"]
                  )
              })
          })

          describe("enterLottery", function () {
              it("reverts when you do not pay enough", async function () {
                  await expect(simpleLottery.enterLottery()).to.be.revertedWith(
                      "SimpleLottery__NotEnoughETHEntered"
                  )
              })

              it("reverts when lottery is closed", async function () {
                  await simpleLottery.enterLottery({
                      value: lotteryEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  // pretend to be a chainlink keeper
                  await simpleLottery.performUpkeep([])
                  await expect(
                      simpleLottery.enterLottery({ value: lotteryEntranceFee })
                  ).to.be.revertedWith("SimpleLottery__NotOpen")
              })

              it("records players when they enter", async function () {
                  await simpleLottery.enterLottery({
                      value: lotteryEntranceFee,
                  })
                  const playerFromContract = await simpleLottery.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })

              it("emits event on enter", async function () {
                  await expect(
                      simpleLottery.enterLottery({ value: lotteryEntranceFee })
                  ).to.emit(simpleLottery, "SimpleLotteryEnter")
              })
          })

          describe("checkUpkeep", function () {
              it("return false if people havent sent any ETH", async function () {
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  const { upKeepNeeded } =
                      await simpleLottery.callStatic.checkUpkeep([])
                  assert(!upKeepNeeded)
              })

              it("return false if lottery isnt open", async function () {
                  await simpleLottery.enterLottery({
                      value: lotteryEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await simpleLottery.performUpkeep([])
                  const lotteryState = await simpleLottery.getRaffleState()
                  const { upkeepNeeded } =
                      await simpleLottery.callStatic.checkUpkeep([])
                  assert.equal(lotteryState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
          })

          describe("performUpkeep", function () {
              it("it can only run if checkUpkeep is true", async function () {
                  await simpleLottery.enterLottery({
                      value: lotteryEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  const tx = await simpleLottery.performUpkeep([])
                  assert(tx)
              })
          })

          describe("fulfillRandomWords", function () {
              beforeEach(async function () {
                  await simpleLottery.enterLottery({
                      value: lotteryEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
              })
              it("can only be called after performUpkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(
                          0,
                          simpleLottery.address
                      )
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(
                          1,
                          simpleLottery.address
                      )
                  ).to.be.revertedWith("nonexistent request")
              })

              //veeery big
              it("pick a winner, resets the lottery and sends money", async function () {
                  //pick a winner
                  const additionalEntrants = 3
                  const startingAccountIndex = 1 // deployer = 0
                  const accounts = await ethers.getSigners()
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountsConnected = simpleLottery.connect(
                          accounts[i]
                      )
                      await accountsConnected.enterLottery({
                          value: lotteryEntranceFee,
                      })
                  }
                  const startingTimeStamp =
                      await simpleLottery.getLatestTimeStamp()
                  //perform Upkeep (mock chainlink keepers)
                  //mock being chainlink vrf
                  // we will have to wait for the fulfill random words
                  await new Promise(async (resolve, reject) => {
                      //listener for the event - when a winner is picked
                      simpleLottery.once("WinnerPicked", async () => {
                          try {
                              const recentWinner =
                                  await simpleLottery.getRecentWinner()
                              const lotteryState =
                                  await simpleLottery.getRaffleState()
                              const endingTimeStamp =
                                  await simpleLottery.getLatestTimeStamp()
                              const numPlayers =
                                  await simpleLottery.getNumberOfPlayers()
                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(lotteryState.toString(), "0")
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      //here we fire the event so the listener can pick it up
                      const tx = await simpleLottery.performUpkeep([])
                      txReceipt = await tx.wait(1)
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          simpleLottery.address
                      )
                  })
              })
          })
      })
