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

// UI imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, KeyRound, AlertCircle, Loader2 } from "lucide-react";

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
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-lg font-medium">Initializing Crypto Environment...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 md:p-10">
            {step === "password" && (
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Create a Password</CardTitle>
                        <CardDescription className="text-center">
                            This password will encrypt your secret phrase on this device
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password (min 8 characters)"
                                        className="pr-10"
                                        required
                                        minLength={8}
                                        disabled={!isCryptoReady}
                                    />
                                    <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                            
                            {error && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={!isCryptoReady}
                            >
                                {!isCryptoReady && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continue
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {step === "mnemonic" && (
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Your Secret Recovery Phrase</CardTitle>
                        <CardDescription className="text-center">
                            Write this down and store it securely
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="warning" className="border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-medium text-sm">
                                WRITE THIS DOWN! Store it securely offline. This is the ONLY way
                                to recover your account. Do NOT share it with anyone.
                            </AlertDescription>
                        </Alert>
                        
                        <div className="bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-md p-4 font-mono text-center break-all">
                            {mnemonic.split(' ').map((word, i) => (
                                <span key={i} className="inline-block m-1 px-2 py-1 bg-white dark:bg-gray-800 shadow-sm rounded-md">
                                    {word}
                                </span>
                            ))}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="mnemonicConfirm" 
                                checked={mnemonicConfirmed} 
                                onCheckedChange={() => handleMnemonicConfirmation()} 
                            />
                            <Label htmlFor="mnemonicConfirm" className="text-sm">
                                I have saved my Secret Recovery Phrase securely
                            </Label>
                        </div>
                        
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <Button
                            onClick={handleProceedToDashboard}
                            disabled={!mnemonicConfirmed || !isCryptoReady || isConnecting}
                            className="w-full"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Proceed to Dashboard
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === "error" && (
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-red-600">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            An Error Occurred
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive">
                            <AlertDescription>{error || "An unknown error occurred."}</AlertDescription>
                        </Alert>
                        
                        <Button
                            onClick={() => {
                                setIsCryptoReady(false);
                                setStep("loading");
                                setError(null);
                                setPassword("");
                                setMnemonic("");
                            }}
                            className="w-full"
                        >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Retry Initialization
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
