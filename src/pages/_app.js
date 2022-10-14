import "../styles/globals.css"
import { MoralisProvider } from "react-moralis"
import { NotificationProvider } from "web3uikit"
import background from "../styles/gray-wireframe-wave-with-geometric-shapes-black-background.jpg"

function MyApp({ Component, pageProps }) {
    return (
        <div className="bg-scroll bg-[url('../styles/gray-wireframe-wave-with-geometric-shapes-black-background.jpg')] bg-cover h-screen">
            <MoralisProvider initializeOnMount={false}>
                <NotificationProvider>
                    <Component {...pageProps} />
                </NotificationProvider>
            </MoralisProvider>
        </div>
    )
}

export default MyApp
