const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("SimpleLottery Staging Tests", function () {
          let simpleLottery, simpleLotteryEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              simpleLottery = await ethers.getContract(
                  "SimpleLottery",
                  deployer
              )
              simpleLotteryEntranceFee = await simpleLottery.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  // enter the simpleLottery
                  console.log("Setting up test...")
                  const startingTimeStamp =
                      await simpleLottery.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      // setup listener before we enter the simpleLottery
                      // Just in case the blockchain moves REALLY fast
                      simpleLottery.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our asserts here
                              const recentWinner =
                                  await simpleLottery.getRecentWinner()
                              const simpleLotteryState =
                                  await simpleLottery.getRaffleState()
                              const winnerEndingBalance =
                                  await accounts[0].getBalance()
                              const endingTimeStamp =
                                  await simpleLottery.getLatestTimeStamp()

                              await expect(simpleLottery.getPlayer(0)).to.be
                                  .reverted
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              )
                              assert.equal(simpleLotteryState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(simpleLotteryEntranceFee)
                                      .toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // Then entering the simpleLottery
                      console.log("Entering simpleLottery...")
                      const tx = await simpleLottery.enterLottery({
                          value: simpleLotteryEntranceFee,
                      })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance =
                          await accounts[0].getBalance()

                      // and this code WONT complete until our listener has finished listening!
                  })
              })
          })
      })
