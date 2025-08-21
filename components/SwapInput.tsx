import React from "react";
import styles from "../styles/Home.module.css";

type Props = {
    type: "native" | "token";
    tokenSymbol?: string;
    tokenBalance?: string;
    current: string;
    setValue: (value: string) => void;
    max?: string;
    value: string;
};

export default function SwapInput({
    type,
    tokenSymbol,
    tokenBalance,
    setValue,
    value,
    current,
    max,
}: Props) {
    const truncate = (value: string) => {
        if (value === undefined) return;
        if (value.length > 5) {
            return value.slice(0, 5);
        }
        return value;
    };

    return (
        <div style={{
            backgroundColor: "#2a2a2a",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #444",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            marginBottom: "1rem",
            transition: "all 0.2s ease",
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem"
            }}>
                <input 
                    type="number"
                    placeholder="0.0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={current !== type} 
                    style={{
                        flex: 1,
                        fontSize: "1.8rem",
                        fontWeight: "600",
                        color: "white",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        padding: "0.5rem 0",
                        marginRight: "1rem",
                        fontFamily: "inherit"
                    }}
                />
                <div style={{
                    textAlign: "right",
                    minWidth: "80px"
                }}>
                    <p style={{
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        color: "white",
                        margin: "0 0 0.2rem 0",
                        textAlign: "right"
                    }}>{tokenSymbol}</p>
                    <p style={{
                        fontSize: "0.85rem",
                        color: "#9ca3af",
                        margin: "0",
                        textAlign: "right"
                    }}>Balance: {truncate(tokenBalance as string)}</p>
                </div>
            </div>
            {current === type && (
                <div style={{
                    display: "flex",
                    justifyContent: "flex-end"
                }}>
                    <button
                        onClick={() => setValue(max || "0")}
                        style={{
                            padding: "0.4rem 0.8rem",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            borderRadius: "8px",
                            border: "1px solid #555",
                            background: "#333",
                            color: "#bbb",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#444";
                            e.currentTarget.style.borderColor = "#666";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#333";
                            e.currentTarget.style.borderColor = "#555";
                        }}
                    >
                        Max
                    </button>
                </div>
            )}
        </div>
    )
}