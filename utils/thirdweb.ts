import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Create the thirdweb client
export const client = createThirdwebClient({ 
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "" 
});

const chain = defineChain({
  id: 8408,
  chainId: 8408,
  rpc: "https://zenchain-testnet.api.onfinality.io/public",
  nativeCurrency: {
    name: "ZEN",
    symbol: "ZEN",
    decimals: 18
  },
  name: "Zenchain Testnet",
  shortName: "zen-testnet",
  slug: "zenchain-testnet",
})

// Export the chain for use in components
export { chain };
