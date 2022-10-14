//have a function enters the lottery
import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const dispatch = useNotification()
    const lotteryAddress =
        chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const {
        runContractFunction: enterLottery,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress, //specify network
        functionName: "enterLottery",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress, //specify network
        functionName: "getEntranceFee",
        params: {},
        msgValue: "",
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress, //specify network
        functionName: "getNumberOfPlayers",
        params: {},
        msgValue: "",
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress, //specify network
        functionName: "getRecentWinner",
        params: {},
        msgValue: "",
    })
    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
            listenForWinnerToBePicked()
        }
    }, [isWeb3Enabled, numPlayers])

    async function listenForWinnerToBePicked() {
        const lottery = new ethers.Contract(lotteryAddress, abi, web3)
        console.log("Waiting for a winner ...")
        await new Promise((resolve, reject) => {
            lottery.on("WinnerPicked", async () => {
                console.log("We got a winner!")
                try {
                    await updateUI()
                    resolve()
                } catch (error) {
                    console.log(error)
                    reject(error)
                }
            })
        })
    }

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        setEntranceFee(entranceFeeFromCall)
        const numPlayersFromCall = await getNumberOfPlayers()
        setNumPlayers(numPlayersFromCall)
        const recentWinnerFromCall = await getRecentWinner()
        setRecentWinner(recentWinnerFromCall)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const handleSuccess = async function (tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }

    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction complete!",
            title: "Transaction Notification",
            position: "topR",
        })
    }
    return (
        <div className="p-5">
            {lotteryAddress ? (
                <div>
                    <div className="flex">
                        <div className="stats text-xl">
                            <div>
                                <h2>Entrance fee</h2>
                            </div>
                            <div className="flex items-center justify-center">
                                {ethers.utils.formatUnits(
                                    entranceFee.toString(),
                                    "ether"
                                )}
                                ETH
                            </div>
                        </div>
                        <div className="stats text-xl">
                            <div>Current number of players:</div>
                            <div className="flex items-center justify-center">
                                {parseInt(numPlayers)}
                            </div>
                        </div>
                        <div className="stats text-xl">
                            <div>
                                <div>The recent winner is : </div>
                                <div className="flex items-center justify-center">
                                    {recentWinner.slice(0, 9)}{" "}
                                </div>
                            </div>
                        </div>
                        <div className="stats text-xl">
                            <div>Prize : </div>
                            <div className="flex items-center justify-center">
                                {parseInt(numPlayers) * 0.1}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center py-10 text-xl flash">
                        Try your luck now!
                    </div>
                    <div className="flex items-center justify-center">
                        <button
                            className="bg-transparent hover:border py-2 px-4 rounded-lg border-t"
                            onClick={async function () {
                                await enterLottery({
                                    onSuccess: handleSuccess,
                                    onError: (error) => console.log(error),
                                })
                            }}
                            disabled={isLoading || isFetching}
                        >
                            {isLoading || isFetching ? (
                                <div className="animate spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                            ) : (
                                <div>Enter</div>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div>No Raffle Address detected</div>
            )}
        </div>
    )
}
