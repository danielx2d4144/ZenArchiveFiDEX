import { ConnectButton } from "thirdweb/react";
import { client, chain } from "../utils/thirdweb";

export default function Navbar() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "10px",
        }}>
            <h1>ZenArchiveFI DEX</h1>
            <ConnectButton client={client} chain={chain} />
        </div>
    )
}