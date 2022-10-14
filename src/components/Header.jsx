import { ConnectButton } from "web3uikit"

export default function Header() {
    return (
        <div className="border-b-2 p-5 flex flex-row border-[#7700a6]">
            <h1 className="py-4 px-4 font-blog text-3xl">
                Decentralized lottery
            </h1>
            <div className="ml-auto py-2 px-4 connect-button">
                <ConnectButton moralisAuth={false} />
            </div>
        </div>
    )
}
