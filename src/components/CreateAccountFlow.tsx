"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useRouter } from "next/navigation";
import {
    mnemonicGenerate,
    mnemonicValidate,
    cryptoWaitReady, // Import cryptoWaitReady
    mnemonicToMiniSecret, // Import function to get private key bytes
} from "@polkadot/util-crypto";
import { Keyring } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { ApiPromise, WsProvider } from '@polkadot/api'; // Import API components

// Define the Westend Asset Hub endpoint
const WESTEND_ASSET_HUB_ENDPOINT = 'wss://westend-asset-hub-rpc.polkadot.io';

// --- IMPORTANT SECURITY NOTE ---
// In a real app, you MUST implement strong encryption here.
// We are skipping the actual encryption step for this basic example.
// Libraries like crypto-js or the browser's SubtleCrypto API should be used.
// --- FUNCTION DEFINITION WAS MISSING - ADDED BACK ---
async function encryptMnemonic(mnemonic: string, password: string): Promise<string> {
    console.warn("!!! MNEMONIC ENCRYPTION IS NOT IMPLEMENTED !!! Storing unencrypted for demo.");
    // Placeholder: In reality, derive key from password (PBKDF2), encrypt mnemonic (AES-GCM)
    // const salt = window.crypto.getRandomValues(new Uint8Array(16));
    // const keyMaterial = await window.crypto.subtle.importKey( ... ); // import password
    // const derivedKey = await window.crypto.subtle.deriveKey( ... ); // derive key using PBKDF2
    // const iv = window.crypto.getRandomValues(new Uint8Array(12));
    // const encodedMnemonic = new TextEncoder().encode(mnemonic);
    // const encryptedData = await window.crypto.subtle.encrypt( ... ); // encrypt using AES-GCM
    // Return a string combining salt, iv, and ciphertext (e.g., base64 encoded)
    return mnemonic; // Storing unencrypted - VERY INSECURE
}
// --- END SECURITY NOTE & FUNCTION DEFINITION ---


type Step = "loading" | "password" | "mnemonic" | "error"; // Add loading state

export default function CreateAccountFlow() {
    // Add state to track crypto readiness
    const [isCryptoReady, setIsCryptoReady] = useState(false);
    // Start in 'loading' state until crypto is ready
    const [step, setStep] = useState<Step>("loading");
    const [password, setPassword] = useState("");
    const [mnemonic, setMnemonic] = useState("");
    const [publicKey, setPublicKey] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false); // Add state for connection status
    const router = useRouter();

    // Effect hook to initialize crypto WASM environment
    useEffect(() => {
        const initCrypto = async () => {
            try {
                console.log("Initializing Polkadot crypto...");
                await cryptoWaitReady(); // Wait for WASM initialization
                console.log("Polkadot crypto ready.");
                setIsCryptoReady(true);
                setStep("password"); // Move to password step only after crypto is ready
            } catch (err) {
                console.error("Crypto initialization failed:", err);
                setError(
                    `Failed to initialize crypto environment: ${err instanceof Error ? err.message : String(err)
                    }`
                );
                setStep("error");
            }
        };
        initCrypto();
    }, []); // Empty dependency array ensures this runs only once on mount

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Double check crypto is ready (though button should be disabled if not)
        if (!isCryptoReady) {
            setError("Crypto environment not ready. Please wait or refresh.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }
        setError(null);

        try {
            // Generate Mnemonic (Now safe to call)
            const newMnemonic = mnemonicGenerate(12);
            if (!mnemonicValidate(newMnemonic)) { // Also safe now
                setError("Failed to generate a valid mnemonic. Please try again.");
                setStep("error");
                return;
            }
            setMnemonic(newMnemonic);
            setStep("mnemonic");
        } catch (err) {
            console.error("Error during mnemonic generation:", err);
            setError(`An error occurred during mnemonic generation: ${err instanceof Error ? err.message : String(err)}`);
            setStep("error");
        }
    };

    const handleMnemonicConfirmation = () => {
        setMnemonicConfirmed(true);
    };

    const handleProceedToDashboard = async () => {
        // Double check crypto is ready
        if (!isCryptoReady) {
            setError("Crypto environment not ready. Please wait or refresh.");
            return;
        }
        if (!mnemonicConfirmed) {
            setError("Please confirm you have saved your mnemonic phrase.");
            return;
        }
        if (!password || !mnemonic) {
            setError("Missing password or mnemonic. Please restart the process.");
            setStep("error");
            return;
        }
        setError(null);
        setIsConnecting(true); // Set connecting state

        try {
            // 1. Derive Keys and Address using Keyring (still useful for address/publicKey)
            const keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
            const pair = keyring.addFromUri(mnemonic, { name: "My Wallet" });
            const derivedAddress = pair.address;
            const derivedPublicKey = u8aToHex(pair.publicKey);
            setPublicKey(derivedPublicKey); // Keep setting state if needed elsewhere

            // --- !!! SECURITY WARNING & DEBUGGING !!! ---
            // Derive the raw private key bytes (mini secret) directly from the mnemonic.
            // Logging private keys is extremely insecure. REMOVE THIS AFTER TESTING.
            const privateKeyBytes = mnemonicToMiniSecret(mnemonic);
            const privateKeyHex = u8aToHex(privateKeyBytes);
            console.warn("!!! DEBUG ONLY - RAW PRIVATE KEY (HEX) !!!:", privateKeyHex);
            // --- END SECURITY WARNING & DEBUGGING ---

            // 2. "Encrypt" Mnemonic (Placeholder)
            const encryptedMnemonic = await encryptMnemonic(mnemonic, password);

            // 3. Store relevant data in Local Storage
            localStorage.setItem("userAddress", derivedAddress);
            localStorage.setItem("userPublicKey", derivedPublicKey);
            localStorage.setItem("encryptedMnemonic", encryptedMnemonic);
            localStorage.setItem("ss58Format", "42");
            localStorage.setItem("accountName", "My Wallet");
            localStorage.setItem("networkEndpoint", WESTEND_ASSET_HUB_ENDPOINT); // Store endpoint

            // 4. Connect to Asset Hub Westend
            console.log(`Connecting to ${WESTEND_ASSET_HUB_ENDPOINT}...`);
            const wsProvider = new WsProvider(WESTEND_ASSET_HUB_ENDPOINT);
            const api = await ApiPromise.create({ provider: wsProvider });

            await api.isReady;
            console.log(`Successfully connected to ${api.runtimeChain} v${api.runtimeVersion}`);

            // TODO: Store the api instance (e.g., in context or global state) for use elsewhere
            // For now, we just connect and log. Disconnect is not handled here.

            // 5. Navigate to Dashboard
            router.push("/dashboard");

        } catch (err) {
            console.error("Error during key generation, storage, or connection:", err);
            setError(
                `An error occurred: ${err instanceof Error ? err.message : String(err)}`
            );
            setStep("error");
        } finally {
            setIsConnecting(false); // Reset connecting state
        }
    };

    // Render loading state
    if (step === "loading") {
        return <div style={styles.container}>Loading Crypto Environment...</div>
    }

    return (
        <div style={styles.container}>
            {step === "password" && (
                <form onSubmit={handlePasswordSubmit} style={styles.form}>
                    <h2>Create a Password</h2>
                    <p>This password encrypts your secret phrase on this device.</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (min 8 characters)"
                        style={styles.input}
                        required
                        minLength={8}
                        disabled={!isCryptoReady} // Disable if crypto not ready
                    />
                    {error && <p style={styles.error}>{error}</p>}
                    <button
                        type="submit"
                        style={!isCryptoReady ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
                        disabled={!isCryptoReady} // Disable if crypto not ready
                    >
                        Continue
                    </button>
                </form>
            )}

            {step === "mnemonic" && (
                <div style={styles.form}>
                    <h2>Your Secret Recovery Phrase</h2>
                    <p style={styles.warning}>
                        ⚠️ WRITE THIS DOWN! Store it securely offline. This is the ONLY way
                        to recover your account. Do NOT share it with anyone.
                    </p>
                    <div style={styles.mnemonicBox}>{mnemonic}</div>
                    <div style={styles.confirmation}>
                        <input
                            type="checkbox"
                            id="mnemonicConfirm"
                            checked={mnemonicConfirmed}
                            onChange={handleMnemonicConfirmation}
                        />
                        <label htmlFor="mnemonicConfirm">
                            I have saved my Secret Recovery Phrase securely.
                        </label>
                    </div>
                    {error && <p style={styles.error}>{error}</p>}
                    <button
                        onClick={handleProceedToDashboard}
                        disabled={!mnemonicConfirmed || !isCryptoReady || isConnecting} // Disable if connecting
                        style={!mnemonicConfirmed || !isCryptoReady || isConnecting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
                    >
                        {isConnecting ? 'Connecting...' : 'Proceed to Dashboard'}
                    </button>
                </div>
            )}

            {step === "error" && (
                <div>
                    <h2>An Error Occurred</h2>
                    <p style={styles.error}>{error || "An unknown error occurred."}</p>
                    {/* Optionally allow retry which might re-trigger useEffect if component remounts */}
                    <button
                        onClick={() => {
                            // Reset state and potentially trigger re-initialization if needed
                            setIsCryptoReady(false); // Force re-check on potential remount/retry logic
                            setStep("loading");
                            setError(null);
                            setPassword("");
                            setMnemonic("");
                            // Consider if a full page refresh might be simpler for user on critical init error
                        }}
                        style={styles.button}
                    >
                        Retry Initialization
                    </button>
                </div>
            )}
        </div>
    );
}

// Basic Styling (Add buttonDisabled style)
const styles: { [key: string]: React.CSSProperties } = {
    // ... (keep existing styles: container, form, input, button, warning, mnemonicBox, confirmation, error)
    button: {
        padding: "12px 25px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "#0070f3",
        color: "white",
        border: "none",
        borderRadius: "5px",
        opacity: 1,
        transition: 'opacity 0.2s ease-in-out', // Smooth transition for disabled state
    },
    buttonDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    // ... (rest of existing styles)
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
        fontFamily: "sans-serif",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "15px",
        border: "1px solid #ccc",
        padding: "30px",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "400px",
    },
    input: {
        padding: "10px",
        fontSize: "16px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        width: "90%",
    },
    warning: {
        color: "#e67e22",
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: '10px',
    },
    mnemonicBox: {
        border: "1px dashed #aaa",
        padding: "15px",
        borderRadius: "5px",
        backgroundColor: "#f9f9f9",
        fontSize: "18px",
        letterSpacing: "1px",
        textAlign: "center",
        wordSpacing: "5px",
        margin: "10px 0",
        width: '90%',
    },
    confirmation: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '10px',
    },
    error: {
        color: "red",
        marginTop: "10px",
    },
};
