import type { AppProps } from "next/app";
import { ThirdwebProvider } from "thirdweb/react";
import "../styles/globals.css";
import "../styles/background.css";  // Import the background styles
import Navbar from "../components/Navbar";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider >
      <Navbar />
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
