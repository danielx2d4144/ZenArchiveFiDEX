import { getContract, prepareContractCall, toTokens } from "thirdweb";
import {
  useReadContract,
  useActiveAccount,
  useWalletBalance,
} from "thirdweb/react";
import { sendAndConfirmTransaction } from "thirdweb";
import { getWalletBalance } from "thirdweb/wallets";
import { toWei, toEther } from "thirdweb/utils";
import styles from "../styles/Home.module.css";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import SwapInput from "../components/SwapInput";
import { client, chain } from "../utils/thirdweb";

const Home: NextPage = () => {
  // Contracts for the DEX and the token
  const TOKEN_CONTRACT = "0x354d531d8Df8Cee0f4DC7c83ae2cc21049951Ab0";
  const DEX_CONTRACT = "0x248e3ed8dc386c2f4e731ff5ed4dfb90a6cea578";
  
  // Default slippage tolerance (1% = 0.01)
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.01);

  // Get contract instances
  const tokenContract = getContract({
    client,
    address: TOKEN_CONTRACT,
    chain: chain,
  });

  const dexContract = getContract({
    client,
    address: DEX_CONTRACT,
    chain: chain,
  });

  // Get the address of the connected account
  const account = useActiveAccount();
  const address = account?.address;

  // Get token symbol and balance
  const { data: symbol } = useReadContract({
    contract: tokenContract,
    method: "function symbol() returns (string)",
  });

  const { data: tokenBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address) returns (uint256)",
    params: [address || "0x0"],
  });
  // Get native balance and LP token balance
  const { data: nativeBalance } = useWalletBalance({
    client,
    address,
    chain: chain,
  });

  const { data: contractTokenBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address) returns (uint256)",
    params: [DEX_CONTRACT],
  });

  // State for the contract balance and the values to swap
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [nativeValue, setNativeValue] = useState<string>("0");
  const [tokenValue, setTokenValue] = useState<string>("0");
  const [currentFrom, setCurrentFrom] = useState<string>("native");
  const [isLoading, setIsLoading] = useState<boolean>(false);



  // Get the amount of tokens to get based on the value to swap
  const { data: amountToGet } = useReadContract({
    contract: dexContract,
    method:
      "function getAmountOfTokens(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve) pure returns (uint256)",
    params: currentFrom === "native"
      ? [
        toWei((nativeValue as string) || "0"),
        toWei((contractBalance as string) || "0"),
        contractTokenBalance || BigInt(0),
      ]
      : [
        toWei((tokenValue as string) || "0"),
        contractTokenBalance || BigInt(0),
        toWei((contractBalance as string) || "0"),
      ]
  });

  // Fetch the contract balance
  const fetchContractBalance = async () => {
    try {
      const balance = await getWalletBalance({
        address: DEX_CONTRACT,
        client,
        chain: chain,
      });
      setContractBalance(balance?.displayValue || "0");
    } catch (error) {
      console.error(error);
    }
  };

  // Execute the swap
  // This function will swap the token to native or the native to the token
  const executeSwap = async () => {
    setIsLoading(true);
    try {
      if (!account) {
        alert("Please connect your wallet");
        return;
      }

      // Calculate the expected amount out based on current values
      const expectedAmountOut = amountToGet || BigInt(0);
      const minAmountOut = calculateMinAmountOut(expectedAmountOut);

      if (currentFrom === "native") {
        // Check if the contract has a function to set a minimum amount out
        // If your contract doesn't support this, we'll log for informational purposes
        console.log(`Swapping ${nativeValue} ZTC for minimum of ${toEther(minAmountOut)} ${symbol}`);
        
        const swapNativeToken = prepareContractCall({
          contract: dexContract,
          method: "function swapEthTotoken() payable",
          params: [], // Ideally should include minAmountOut if your contract supports it
          value: toWei((nativeValue as string) || "0"),
        });
        
        sendAndConfirmTransaction({
          account,
          transaction: swapNativeToken,
        });

      } else {
        console.log(`Swapping ${tokenValue} ${symbol} for minimum of ${toEther(minAmountOut)} ZTC`);
        
        // Approve token spending first
        const approveTokenSpending = prepareContractCall({
          contract: tokenContract,
          method: "function approve(address spender, uint256 amount) returns (bool)",
          params: [DEX_CONTRACT, toWei((tokenValue as string) || "0")],
        });
        
        await sendAndConfirmTransaction({
          account,
          transaction: approveTokenSpending,
        });
        
        // Execute the swap with slippage protection if supported
        const swapTokenToNative = prepareContractCall({
          contract: dexContract,
          method: "function swapTokenToEth(uint256 _tokensSold)",
          params: [toWei((tokenValue as string) || "0")], // Ideally should include minAmountOut parameter
        });

        try {
          await sendAndConfirmTransaction({
            account,
            transaction: swapTokenToNative,
          });
        } catch (error) {
          console.error(error);
          alert("An error occurred while trying to execute the swap");
        }
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while trying to execute the swap");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the contract balance and update it every 10 seconds
  useEffect(() => {
    fetchContractBalance();
    setInterval(fetchContractBalance, 10000);
  }, []);

  // Helper function to calculate minimum amount out with slippage protection
  const calculateMinAmountOut = (expectedAmount: bigint): bigint => {
    // Apply slippage tolerance: amount * (1 - slippageTolerance)
    return expectedAmount - (expectedAmount * BigInt(Math.floor(slippageTolerance * 10000)) / BigInt(10000));
  };

  // Calculate effective price (for display purposes)
  const calculateEffectivePrice = (): string => {
    if (!amountToGet || 
        (currentFrom === "native" && (nativeValue === "0" || nativeValue === "")) ||
        (currentFrom === "token" && (tokenValue === "0" || tokenValue === ""))) {
      return "0";
    }

    if (currentFrom === "native") {
      const inputAmount = parseFloat(nativeValue);
      const outputAmount = parseFloat(tokenValue);
      return inputAmount && outputAmount ? (inputAmount / outputAmount).toFixed(6) : "0";
    } else {
      const inputAmount = parseFloat(tokenValue);
      const outputAmount = parseFloat(nativeValue);
      return inputAmount && outputAmount ? (inputAmount / outputAmount).toFixed(6) : "0";
    }
  };

  // Update the amount to get based on the value
  useEffect(() => {
    if (!amountToGet) return;
    if (currentFrom === "native") {
      setTokenValue(toEther(amountToGet));
    } else {
      setNativeValue(toEther(amountToGet));
    }
  }, [amountToGet]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "2.5rem",
            borderRadius: "16px",
            minWidth: "500px",
            border: "1px solid #333",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div>
            <SwapInput
              current={currentFrom as string}
              type={currentFrom === "native" ? "native" : "token"}
              max={currentFrom === "native" ? nativeBalance?.displayValue : toTokens(tokenBalance || BigInt(0), 18)}
              value={currentFrom === "native" ? nativeValue : tokenValue}
              setValue={currentFrom === "native" ? setNativeValue : setTokenValue}
              tokenSymbol={currentFrom === "native" ? "ZTC" : (symbol as string)}
              tokenBalance={currentFrom === "native" ? nativeBalance?.displayValue : toTokens(tokenBalance || BigInt(0), 18)}
            />
            <button
              onClick={() => {
                // Swap the current direction
                const newDirection = currentFrom === "native" ? "token" : "native";
                setCurrentFrom(newDirection);

                // Swap the input values
                const tempValue = nativeValue;
                setNativeValue(tokenValue);
                setTokenValue(tempValue);
              }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "none",
                background: "#3b82f6",
                color: "white",
                fontSize: "1.2rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "1rem auto",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
              }}
            >
              ↓
            </button>
            <SwapInput
              current={currentFrom as string}
              type={currentFrom === "native" ? "token" : "native"}
              max={currentFrom === "native" ? toTokens(tokenBalance || BigInt(0), 18) : nativeBalance?.displayValue}
              value={currentFrom === "native" ? tokenValue : nativeValue}
              setValue={currentFrom === "native" ? setTokenValue : setNativeValue}
              tokenSymbol={currentFrom === "native" ? (symbol as string) : "ZTC"}
              tokenBalance={currentFrom === "native" ? toTokens(tokenBalance || BigInt(0), 18) : nativeBalance?.displayValue}
            />
          </div>
          {address ? (
            <div
              style={{
                textAlign: "center",
              }}
            >
              {/* Display price info and slippage settings */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#232323",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                  <div style={{ marginBottom: "0.3rem" }}>
                    Rate: 1 {currentFrom === "native" ? "ZTC" : symbol} = {calculateEffectivePrice()} {currentFrom === "native" ? symbol : "ZTC"}
                  </div>
                  <div>
                    Min received: {amountToGet ? (
                      currentFrom === "native" 
                        ? `${(parseFloat(tokenValue) * (1 - slippageTolerance)).toFixed(6)} ${symbol}`
                        : `${(parseFloat(nativeValue) * (1 - slippageTolerance)).toFixed(6)} ZTC`
                    ) : "0"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.9rem", color: "#9ca3af", marginRight: "0.5rem" }}>
                    Slippage:
                  </span>
                  <select 
                    value={slippageTolerance} 
                    onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                    style={{
                      background: "#2a2a2a",
                      color: "white",
                      border: "1px solid #444",
                      padding: "0.3rem",
                      borderRadius: "6px",
                      fontSize: "0.9rem"
                    }}
                  >
                    <option value="0.005">0.5%</option>
                    <option value="0.01">1%</option>
                    <option value="0.02">2%</option>
                    <option value="0.05">5%</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={executeSwap}
                disabled={isLoading as boolean}
                style={{
                  width: "100%",
                  padding: "1rem 2rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  borderRadius: "12px",
                  border: "none",
                  background: isLoading ? "#555" : "#3b82f6",
                  color: "white",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
                  }
                }}
              >
                {isLoading ? "Processing..." : "Swap"}
              </button>
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "1.5rem",
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              marginTop: "1rem"
            }}>
              <p style={{
                color: "#9ca3af",
                fontSize: "1rem",
                margin: "0",
                fontWeight: "500"
              }}>
                🔗 Connect your wallet to start swapping
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Home;
