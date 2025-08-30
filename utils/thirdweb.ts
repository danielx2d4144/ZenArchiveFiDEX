import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Create the thirdweb client with your client ID
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "eb6392fc427e0b637a5d2c61513c2da8"
});

const chain = defineChain({
  id: 8408,
  chainId: 8408,
  rpc: "https://zenchain-testnet.api.onfinality.io/public",
  nativeCurrency: {
    name: "ZTC",
    symbol: "ZTC",
    decimals: 18
  },
  name: "Zenchain Testnet",
  shortName: "zen-testnet",
  slug: "zenchain-testnet",
})

// Export the chain for use in components
export { chain };
