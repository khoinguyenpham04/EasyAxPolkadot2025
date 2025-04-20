"use client"

import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  SendHorizontal,
  QrCode,
  Plus,
  ArrowRight,
  CreditCard,
  Bitcoin,
  ChevronRight,
  Clock,
  ArrowDown, // Added ArrowDown for swap icon
} from "lucide-react"
import { ethers } from 'ethers'; // Import ethers
import FlexibleForwarderAbi from '../../../scripts/swap.json'; // Adjust path as needed

// Dialog imports
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react"

// Polkadot API imports
import { ApiPromise, WsProvider } from '@polkadot/api'; // Import API components
import { formatBalance, u8aToString } from '@polkadot/util'; // Import balance formatting utility
import type { AccountInfo } from '@polkadot/types/interfaces/system'; // Import AccountInfo type
import type { AssetId, AccountId } from '@polkadot/types/interfaces'; // Import AssetId and AccountId
import type { AssetAccount, AssetMetadata } from '@polkadot/types/interfaces/assets'; // Import Asset types
import type { Option } from '@polkadot/types/codec'; // Import Option type
import { web3Enable, web3FromSource } from '@polkadot/extension-dapp';
import { ContractPromise } from '@polkadot/api-contract';
import BN from 'bn.js';
// Import WeightV2 for explicit type usage
import type { WeightV2 } from '@polkadot/types/interfaces/runtime';
// Assuming you have the ABI json imported or available
import SimpleDexMVPAbi from '../../../contracts/artifacts/contracts_swap_sol_SimpleDexMVP.abi'; // Adjust path as needed

// Define the contract address (replace with your actual deployed address)
const DEX_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DEX_CONTRACT_ADDRESS || "YOUR_DEPLOYED_DEX_CONTRACT_ADDRESS"; // <-- REPLACE THIS or use env var
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";

// Update the AccountItem interface to include additional properties
interface AccountItem {
  id: string
  title: string
  description?: string
  balance: string
  type: "bitcoin" | "ethereum" | "altcoin" | "stablecoin" | "native"
  symbol?: string
  price?: string
  change?: string
  changeType?: "up" | "down"
  decimals: number // Added decimals
  assetId?: string | number // Optional: Store asset ID if needed for actions
}

interface List01Props {
  className?: string
}

// Add api and userAddress to CryptoActionDialog props
interface CryptoActionDialogProps {
  crypto: AccountItem;
  api: ApiPromise | null; // Add api prop
  userAddress: string | null; // Add userAddress prop
}

// Add a new CryptoActionDialog component
function CryptoActionDialog({ crypto, api, userAddress }: CryptoActionDialogProps) {
  const [activeView, setActiveView] = useState<"main" | "send" | "receive" | "swap">("main")
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  // Remove userQRAddress state
  // const [userQRAddress, setUserQRAddress] = useState<string | null>(null);

  // Add QR scanner related states at the top level
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Remove the useEffect that was setting userQRAddress
  // useEffect(() => {
  //   const address = localStorage.getItem("userQRAddress");
  //   if (address) {
  //     setUserQRAddress(address);
  //   }
  // }, []);

  // Function to handle QR code scanning result
  const handleScanResult = (result: string) => {
    setAddress(result);
    setShowScanner(false);
  };

  // Sample transaction data (replace with actual data fetching)
  const transactions = [
    {
      id: "1",
      type: "Transfer",
      from: `bc1qamgj...6rgqwfkew688k`,
      amount: "***", // Fixed unterminated string
      date: "4/8/25",
      time: "21:17",
    },
    {
      id: "2",
      type: "Transfer",
      from: `bc1qamgj...6rgqwfkew688k`,
      amount: "***", // Fixed unterminated string
      date: "3/31/25",
      time: "13:13",
    },
    {
      id: "3",
      type: "Transfer",
      from: `bc1qamgj...6rgqwfkew688k`,
      amount: "***", // Fixed unterminated string
      date: "3/1/25",
      time: "15:14",
    },
    {
      id: "4",
      type: "Transfer",
      from: `bc1qamgj...6rgqwfkew688k`,
      amount: "***", // Fixed unterminated string
      date: "2/28/25",
      time: "07:32",
    },
  ]

  // QR Code Scanner component - moved to top level of CryptoActionDialog
  const QRScanner = () => {
    const qrContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!qrContainerRef.current) return;

      // Clear any previous content
      qrContainerRef.current.innerHTML = '';

      // Create instance with container ID, config and callbacks
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        },
        /* verbose= */ false
      );

      // Define success callback
      const onScanSuccess = (decodedText: string) => {
        console.log(`QR Code detected: ${decodedText}`);
        setAddress(decodedText);

        // Stop scanning and close scanner
        html5QrcodeScanner.clear();
        setShowScanner(false);
      };

      // Handle scan failure - just log it
      const onScanFailure = (error: string) => {
        // We don't need to show errors for every frame
        console.log(`QR scan error: ${error}`);
      };

      // Render the scanner UI and start scanning
      html5QrcodeScanner.render(onScanSuccess, onScanFailure);

      // Clean up on unmount
      return () => {
        html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
      };
    }, []);

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg w-full max-w-sm">
          <h3 className="text-lg font-medium mb-2 text-center text-zinc-900 dark:text-white">
            Scan QR Code
          </h3>
          <div
            id="qr-reader"
            ref={qrContainerRef}
            className="qr-container"
          ></div>
          <button
            onClick={() => setShowScanner(false)}
            className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Function to render the main view
  const renderMainView = () => (
    <>
      {/* Crypto Title and Logo */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-1">{crypto.title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Main network</p>
        </div>
        <div
          className={cn("w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center", {
            "bg-orange-500": crypto.type === "bitcoin",
            "bg-blue-500": crypto.type === "ethereum",
            "bg-purple-500": crypto.type === "altcoin",
            "bg-green-500": crypto.type === "stablecoin",
          })}
        >
          {crypto.type === "bitcoin" && <Bitcoin className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
          {crypto.type === "ethereum" && <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
          {crypto.type === "altcoin" && <ArrowUpRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
          {crypto.type === "stablecoin" && <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
        </div>
      </div>

      {/* Balance Card */}
      <div className="mx-4 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
        <p className="text-zinc-500 dark:text-zinc-400 mb-2">Balance</p>
        <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          {crypto.balance.split(" ")[0]}
        </p>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">{crypto.balance.split(" ")[1]}</p>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveView("receive")}
            className="flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white p-2 sm:p-3 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Receive</span>
          </button>
          <button
            onClick={() => setActiveView("send")}
            className="flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white p-2 sm:p-3 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Send</span>
          </button>
          <button
            onClick={() => setActiveView("swap")}
            className="flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white p-2 sm:p-3 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Swap</span>
          </button>
        </div>
      </div>

      {/* Market Price Card */}
      <div className="mx-4 mt-4 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 mb-1">{crypto.symbol} Market Price</p>
            <div className="flex items-center">
              <p className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mr-2">{crypto.price}</p>
              <span
                className={cn(
                  "flex items-center text-xs sm:text-sm",
                  crypto.changeType === "up" ? "text-green-500" : "text-red-500",
                )}
              >
                {crypto.changeType === "up" ? "▲" : "▼"} {crypto.change} last 24h
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <svg width="80" height="30" viewBox="0 0 80 30" className="text-blue-500">
              <path
                d="M0,15 C5,13 10,18 15,15 C20,12 25,20 30,15 C35,10 40,5 45,10 C50,15 55,5 60,10 C65,15 70,20 75,15 L80,15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <ChevronRight className="w-5 h-5 text-zinc-500 dark:text-zinc-400 ml-2" />
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="mx-4 mt-4 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-zinc-500 dark:text-zinc-400">Transactions</p>
          <button className="flex items-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
            <span className="text-xs sm:text-sm">Explorer</span>
          </button>
        </div>

        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id}>
              <p className="text-zinc-500 dark:text-zinc-500 text-xs sm:text-sm mb-2">{tx.date}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mr-3">
                    <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700 dark:text-white" />
                  </div>
                  <div>
                    <p className="text-zinc-900 dark:text-white font-medium text-sm sm:text-base">{tx.type}</p>
                    <p className="text-zinc-500 dark:text-zinc-500 text-xs sm:text-sm">from: {tx.from}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-zinc-900 dark:text-white text-sm sm:text-base">{tx.amount}</p>
                  <p className="text-zinc-500 dark:text-zinc-500 text-xs sm:text-sm">{tx.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  // --- Browser-based forwardPayment function (ensure this exists) ---
  const forwardPayment = async (senderAddress: string, recipientAddress: string, amountString: string) => {
    console.log(`Initiating forwardPayment: ${amountString} ETH from ${senderAddress} to ${recipientAddress}`);

    // Check if MetaMask/provider is available
    if (!(window as any).ethereum) {
      alert("MetaMask (or another Ethereum wallet provider) is not installed. Please install it.");
      console.error("Ethereum provider not found.");
      setActiveView("main"); // Go back if no provider
      return;
    }

    try {
      // Request account access
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

      // Use ethers with the browser provider
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const connectedAddress = await signer.getAddress();

      // Verify the connected address matches the intended sender
      if (connectedAddress.toLowerCase() !== senderAddress.toLowerCase()) {
        alert(`Connected wallet address (${connectedAddress}) does not match the required sender address (${senderAddress}). Please connect the correct wallet.`);
        console.error(`Address mismatch: Connected=${connectedAddress}, Required=${senderAddress}`);
        setActiveView("main"); // Go back on mismatch
        return;
      }

      // Create contract instance
      const forwarderContract = new ethers.Contract('0x655F5aD2ef22754988cc8862576a8655a48dC4f5', FlexibleForwarderAbi, signer);

      // Convert amount to wei
      const amountWei = ethers.parseEther(amountString);

      console.log(`Calling forwardPayment on contract ${'0x655F5aD2ef22754988cc8862576a8655a48dC4f5'} with value ${amountWei.toString()} wei`);

      // Send the transaction - DO NOT await (as per previous request)
      forwarderContract.forwardPayment(senderAddress, recipientAddress, {
        value: amountWei
      }).then(tx => {
        console.log(`Transaction sent: ${tx.hash}`);
        alert(`Transaction submitted: ${tx.hash}. Check your wallet for status.`);
        // Note: Without await, we don't wait for confirmation.
      }).catch(error => {
        console.error("Error sending forwardPayment transaction:", error);
        // Try to provide a more specific error message if available
        const reason = error?.reason || error?.message || error;
        alert(`Error sending transaction: ${reason}`);
      });

      // Return to main view immediately after initiating
      setActiveView("main");

    } catch (error: any) {
      console.error("Error setting up forwardPayment transaction:", error);
      alert(`Failed to initiate transaction: ${error.message || error}`);
      // Ensure view returns to main even if setup fails
      setActiveView("main");
    }
  };
  // --- End forwardPayment function ---

  // Function to render the send view
  const renderSendView = () => {

    return (
      <div className="p-4 sm:p-6">
        {showScanner && <QRScanner />}

        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Send {crypto.title}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Transfer {crypto.symbol} to another wallet via Forwarder</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-zinc-700 dark:text-zinc-300">
              Recipient Address
            </Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                placeholder={`Enter recipient Ethereum address`} // Updated placeholder
                value={address} // Use state variable 'address'
                onChange={(e) => setAddress(e.target.value)} // Update state variable 'address'
                className="flex-1 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
              <button
                onClick={() => setShowScanner(true)}
                className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white p-2 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700"
                title="Scan QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="send-amount" className="text-zinc-700 dark:text-zinc-300">
              Amount to Send (ETH)
            </Label>
            <div className="flex gap-2">
              <Input
                id="send-amount"
                placeholder="0.00"
                type="number" // Use number type for better input
                step="any"
                value={amount} // Use state variable 'amount'
                onChange={(e) => setAmount(e.target.value)} // Update state variable 'amount'
                className="flex-1 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
              <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border border-zinc-200 dark:border-zinc-700">
                ETH {/* Assuming the forwarder handles ETH */}
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Available: {crypto.balance}</span>
              <button
                className="text-zinc-900 dark:text-zinc-100 font-medium"
                onClick={() => setAmount(crypto.balance.split(' ')[0])}
              >
                MAX
              </button>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={() => {
                // --- Updated onClick Logic ---
                const recipientAddress = address; // Get from state
                const amountToSend = amount;     // Get from state

                // 1. Get Sender Address from localStorage
                const senderEvmAddress = localStorage.getItem("userEvmAddress");

                // 2. Validation
                if (!senderEvmAddress) {
                  alert("Error: Sender EVM address not found in local storage. Please ensure you are connected.");
                  return;
                }
                if (!recipientAddress || !amountToSend) {
                  alert("Please enter both recipient address and amount");
                  return;
                }
                if (!ethers.isAddress(recipientAddress)) {
                  alert("Please enter a valid recipient Ethereum address.");
                  return;
                }
                if (parseFloat(amountToSend) <= 0) {
                  alert("Please enter a valid amount greater than zero.");
                  return;
                }

                // 3. Call the browser-based forwardPayment function
                console.log(`Calling forwardPayment with: sender=${senderEvmAddress}, recipient=${recipientAddress}, amount=${amountToSend}`);
                forwardPayment(senderEvmAddress, recipientAddress, amountToSend);
                // --- End Updated onClick Logic ---
              }}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              <SendHorizontal className="w-5 h-5" />
              <span>Send via Forwarder</span> {/* Updated button text */}
            </button>

            <button
              onClick={() => setActiveView("main")}
              className="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white p-3 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Function to render the receive view
  const renderReceiveView = () => {
    // Use userAddress directly instead of addressToDisplay
    // const addressToDisplay = userQRAddress || `${crypto.symbol?.toLowerCase() || 'address'}1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l`;

    // Use a placeholder if userAddress is null
    const displayAddress = userAddress || `${crypto.symbol?.toLowerCase() || 'address'}1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l`;

    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Receive {crypto.title}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Share your address to receive {crypto.symbol || 'Asset'}</p>
        </div>

        <div className="flex flex-col items-center justify-center mb-6">
          <div className="bg-white p-4 rounded-lg mb-4">
            {userAddress ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(userAddress)}`}
                alt={`${crypto.title} address QR code`}
                className="w-40 h-40 sm:w-48 sm:h-48"
              />
            ) : (
              <QrCode className="w-40 h-40 sm:w-48 sm:h-48 text-zinc-900" />
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">
            Scan this QR code to receive {crypto.symbol || 'Asset'}
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <Label htmlFor="wallet-address" className="text-zinc-700 dark:text-zinc-300">
            Your {crypto.title} Address
          </Label>
          <div className="flex gap-2">
            <Input
              id="wallet-address"
              value={displayAddress}
              readOnly
              className="flex-1 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            />
            <button
              type="button"
              className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(displayAddress)
              }}
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Only send {crypto.symbol || 'this asset'} to this address. Sending any other asset may result in permanent loss.
          </p>
        </div>

        <button
          onClick={() => setActiveView("main")}
          className="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white p-3 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Back to Wallet
        </button>
      </div>
    )
  }
  // --- SWAP LOGIC ---
  const handleSwapWNDForLSP = async () => {
    // ... (swap logic remains largely the same, ensure DEX_CONTRACT_ADDRESS is valid) ...
    if (!api || !userAddress || !amount || Number(amount) <= 0 || crypto.symbol !== 'WND' || !DEX_CONTRACT_ADDRESS || DEX_CONTRACT_ADDRESS === "YOUR_DEPLOYED_DEX_CONTRACT_ADDRESS") {
      setSwapError("Invalid input, configuration, or contract address for WND -> LSP swap.");
      console.error("Swap prerequisites not met:", { api: !!api, userAddress, amount, symbol: crypto.symbol, DEX_CONTRACT_ADDRESS });
      return;
    }

    setIsSwapping(true);
    setSwapError(null);

    try {
      // ... (extension enabling, signer setup) ...
      const extensions = await web3Enable('EasyAxPolkadot DApp');
      if (extensions.length === 0) {
        throw new Error("Polkadot{.js} extension not found.");
      }
      const injector = await web3FromSource(extensions[0].name);
      if (!injector.signer) {
        throw new Error("Signer not available. Ensure the extension is unlocked and permissions granted.");
      }
      // Use the primary API instance for transactions if available
      const txApi = api;
      txApi.setSigner(injector.signer);

      const contract = new ContractPromise(txApi, SimpleDexMVPAbi, DEX_CONTRACT_ADDRESS);
      const nativeDecimals = txApi.registry.chainDecimals[0];
      const valueToSend = new BN(Math.floor(parseFloat(amount) * (10 ** nativeDecimals))); // Use Math.floor for safety

      console.log(`Attempting to swap ${amount} WND (${valueToSend.toString()} Planck) via contract ${DEX_CONTRACT_ADDRESS}`);

      // Explicitly type gasLimit as WeightV2
      const gasLimit: WeightV2 = txApi.registry.createType('WeightV2', {
        refTime: new BN(3000000000), // Adjust based on estimation/benchmarking
        proofSize: new BN(200000),   // Adjust based on estimation/benchmarking
      });

      const unsub = await contract.tx
        .swapWNDForOther({ value: valueToSend, gasLimit })
        .signAndSend(userAddress, (result) => {
          // ... (status handling remains the same) ...
          console.log(`Transaction status: ${result.status.type}`);

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
            unsub();
            setIsSwapping(false);
            setAmount("");
            alert("Swap successful!");
            setActiveView("main");
            // TODO: Trigger balance refresh here
          } else if (result.isError) {
            console.error('Transaction Error:', result.internalError || result.dispatchError || 'Unknown error');
            let errorMsg = 'Transaction failed.';
            if (result.dispatchError) {
              if (result.dispatchError.isModule) {
                const decoded = txApi.registry.findMetaError(result.dispatchError.asModule);
                errorMsg = `Transaction failed: ${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              } else {
                errorMsg = `Transaction failed: ${result.dispatchError.toString()}`;
              }
            }
            throw new Error(errorMsg);
          }
        });

    } catch (err: unknown) { // Use unknown instead of any
      console.error("Swap failed:", err);
      setSwapError(`Swap failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsSwapping(false);
    }
  };
  // --- END SWAP LOGIC ---

  // Function to render the swap view
  const renderSwapView = () => {
    // ... (swap view rendering remains largely the same) ...
    const canSwapFrom = crypto.symbol === 'WND';
    const targetSymbol = 'LSP';

    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Swap {crypto.title}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Exchange {crypto.symbol || 'Asset'} for {targetSymbol}</p>
        </div>

        {!canSwapFrom && (
          <div className="text-center text-orange-500 bg-orange-100 dark:bg-orange-900/30 p-4 rounded-lg">
            Swapping from {crypto.symbol} is not yet supported in this direction (requires approval first). Please select WND to swap for {targetSymbol}.
          </div>
        )}

        {canSwapFrom && (
          <div className="space-y-6">
            {/* From Section */}
            <div className="space-y-2">
              <Label htmlFor="from-amount" className="text-zinc-700 dark:text-zinc-300">
                From
              </Label>
              <div className="flex gap-2">
                <Input
                  id="from-amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSwapping} // Disable input while swapping
                  className="flex-1 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  type="number" // Use number type for better input handling
                  step="any"
                />
                <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border-zinc-200 dark:border-zinc-700">
                  {crypto.symbol || 'Tokens'} {/* Should be WND here */}
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Available: {crypto.balance}</span>
                <button
                  className="text-zinc-900 dark:text-zinc-100 font-medium disabled:opacity-50"
                  onClick={() => setAmount(crypto.balance.split(' ')[0])}
                  disabled={isSwapping}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Swap Direction Icon */}
            <div className="flex justify-center">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full">
                {/* Use ArrowDown */}
                <ArrowDown className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </div>
            </div>

            {/* To Section */}
            <div className="space-y-2">
              <Label htmlFor="to-amount" className="text-zinc-700 dark:text-zinc-300">
                To (Estimated)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="to-amount"
                  placeholder="0.00"
                  // IMPORTANT: This calculation is a placeholder!
                  // Replace with actual rate fetched from contract for accuracy.
                  value={amount && Number(amount) > 0 ? (Number(amount) * 15).toFixed(4) : ""}
                  readOnly // Estimated amount is read-only
                  className="flex-1 bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 cursor-not-allowed"
                />
                {/* Hardcode LSP as the target for this WND -> LSP flow */}
                <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border-zinc-200 dark:border-zinc-700">
                  {targetSymbol}
                </div>
              </div>
              {/* Placeholder rate/fee info */}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">1 {crypto.symbol} ≈ 15 {targetSymbol} • Fee: Network Fee</p>
              {/* You might want to fetch and display the actual exchange rate here */}
            </div>

            {/* Error Display */}
            {swapError && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{swapError}</p>
            )}

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              <button
                onClick={handleSwapWNDForLSP}
                disabled={isSwapping || !amount || Number(amount) <= 0} // Disable if swapping or amount invalid
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSwapping ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Swapping...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    <span>Swap WND for {targetSymbol}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => { setActiveView("main"); setSwapError(null); setAmount(""); }} // Reset state on cancel
                disabled={isSwapping} // Disable cancel while swapping
                className="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white p-3 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render the appropriate view based on the activeView state
  const renderContent = () => {
    switch (activeView) {
      case "send":
        return renderSendView()
      case "receive":
        return renderReceiveView()
      case "swap":
        return renderSwapView()
      default:
        return renderMainView()
    }
  }

  return (
    <DialogContent className="sm:max-w-[650px] md:max-w-[700px] p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Content based on active view - remove extra padding */}
      <div className="max-h-[75vh] overflow-y-auto rounded-lg">{renderContent()}</div>
    </DialogContent>
  )
}

// Update the main List01 component
export default function List01({ className }: List01Props) {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userAccounts, setUserAccounts] = useState<AccountItem[]>([]);
  const [totalBalanceValue, setTotalBalanceValue] = useState<number>(0); // Store raw total balance
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<ApiPromise | null>(null);

  // Effect to get address and connect to API
  useEffect(() => {
    const address = localStorage.getItem("userAddress");
    const endpoint = localStorage.getItem("networkEndpoint");
    setUserAddress(address);
    console.log(`Using address: ${address}, endpoint: ${endpoint}`); // Log address and endpoint

    let apiInstance: ApiPromise | null = null; // Variable to hold the instance for cleanup

    if (address && endpoint) {
      const connectApi = async () => {
        setIsLoading(true);
        setError(null);
        try {
          console.log(`Connecting to endpoint: ${endpoint}...`); // Log connection attempt
          const provider = new WsProvider(endpoint);
          apiInstance = await ApiPromise.create({ provider });
          await apiInstance.isReady;
          console.log(`Successfully connected to ${apiInstance.runtimeChain} v${apiInstance.runtimeVersion}`);
          setApi(apiInstance);
        } catch (err) {
          console.error("API connection failed:", err);
          setError(`Failed to connect to the network: ${err instanceof Error ? err.message : String(err)}`);
          setIsLoading(false);
        }
      };
      connectApi();
    } else {
      setError("User address or network endpoint not found in local storage.");
      setIsLoading(false);
    }

    // Disconnect API on component unmount or if endpoint/address changes
    return () => {
      console.log("Disconnecting API...");
      apiInstance?.disconnect();
      setApi(null); // Reset api state on cleanup
    };
  }, []); // Run only on mount

  // Effect to fetch balances when API is ready and address is available
  useEffect(() => {
    const fetchBalances = async () => {
      // ... (balance fetching logic remains largely the same) ...
      if (!userAddress) {
        console.log("UserAddress missing, skipping balance fetch.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      console.log(`Fetching balances for address: ${userAddress}`);
      console.log(`fihsahfiahsifaf ${localStorage.getItem("userEvmAddress")}`);

      let nativeApi: ApiPromise | null = null;
      const westendAssetHubEndpoint = 'wss://westend-asset-hub-rpc.polkadot.io';
      const fetchedAccounts: AccountItem[] = [];

      try {
        // 1. Fetch Native Balance from Westend Asset Hub
        try {
          console.log(`Connecting to Westend Asset Hub (${westendAssetHubEndpoint}) for native balance...`);
          const nativeProvider = new WsProvider(westendAssetHubEndpoint);
          nativeApi = await ApiPromise.create({ provider: nativeProvider });
          await nativeApi.isReady;
          console.log(`Successfully connected to ${nativeApi.runtimeChain} (Asset Hub) for native balance.`);

          const { data: balanceData } = await nativeApi.query.system.account<AccountInfo>(userAddress);
          const nativeTokenInfo = nativeApi.registry.chainTokens[0];
          const nativeDecimals = nativeApi.registry.chainDecimals[0];
          const nativeSymbol = nativeTokenInfo || 'WND';
          const nativeFree = balanceData.free;
          console.log(`Raw native free balance (Asset Hub): ${nativeFree.toString()}`);

          if (!nativeFree.isZero()) {
            const nativeAccount: AccountItem = {
              id: nativeSymbol,
              title: nativeSymbol,
              description: `Native Token (${nativeApi.runtimeChain})`,
              balance: formatBalance(nativeFree, { withSi: false, forceUnit: nativeSymbol, decimals: nativeDecimals }),
              type: 'native',
              symbol: nativeSymbol,
              price: 'N/A',
              change: 'N/A',
              changeType: 'up',
              decimals: nativeDecimals,
            };
            fetchedAccounts.push(nativeAccount);
            console.log("Fetched Native Account (Asset Hub):", nativeAccount);
          } else {
            console.log(`Native balance is zero on Westend Asset Hub for address ${userAddress}.`);
            console.log(`Native balance is zero on Westend Asset Hub for EVM address ${localStorage.getItem("userEvmAddress")}.`);

          }
        } catch (nativeErr: unknown) { // Use unknown instead of any
          console.error("Failed to connect or fetch native balance from Asset Hub:", nativeErr);
          // Optionally set a specific error state for native balance failure
        } finally {
          console.log("Disconnecting temporary Asset Hub API...");
          await nativeApi?.disconnect();
        }

        // 2. Fetch Asset Balances from the primary connected API
        if (!api || !api.isReady) {
          console.log("Primary API (for assets) not ready, skipping asset balance fetch.");
        } else {
          const currentApi = api;
          console.log(`Fetching asset balances from primary connection: ${currentApi.runtimeChain}`);
          try {
            console.log("Fetching all asset definitions from primary API...");
            const assetEntries = await currentApi.query.assets.asset.entries();
            console.log(`Found ${assetEntries.length} potential asset definitions on ${currentApi.runtimeChain}.`);

            console.log(`Found ${assetEntries.length} potential asset definitions on ${currentApi.runtimeChain}.`);

            const assetBalancePromises = assetEntries.map(async ([key, optionalAssetDetails]) => {
              try {
                // Check if the assetDetails exists (optionalAssetDetails is Option<AssetDetails>)
                // We don't strictly need assetDetails here, just the assetId from the key
                if (!optionalAssetDetails || optionalAssetDetails.isEmpty) {
                  // console.log(`Asset details empty for key: ${key.toHuman()}`);
                  // return null; // Don't skip yet, maybe metadata exists
                }

                // Extract the asset ID
                const assetId = key.args[0] as AssetId;
                // console.log(`Processing asset ID: ${assetId.toString()}`);

                // 1. Query the account balance for this asset
                const optionalAccountData = await currentApi.query.assets.account<Option<AssetAccount>>(assetId, userAddress);

                // Check if account data exists and has balance
                if (optionalAccountData.isNone) {
                  // console.log(`No account data for asset ${assetId.toString()}`);
                  return null;
                }
                const accountData = optionalAccountData.unwrap();
                if (accountData.balance.isZero() || accountData.isFrozen.isTrue) {
                  // console.log(`Zero balance or frozen asset for ID ${assetId.toString()}`);
                  return null;
                }
                const balance = accountData.balance; // This is already a BN

                // 2. Get metadata for the asset
                const optionalMetadata = await currentApi.query.assets.metadata<Option<AssetMetadata>>(assetId);

                // Check if metadata exists
                if (optionalMetadata.isNone) {
                  console.log(`No metadata for asset ${assetId.toString()}`);
                  return null;
                }
                const metadata = optionalMetadata.unwrap();

                // 3. Extract metadata fields
                const symbol = u8aToString(metadata.symbol);
                const decimals = metadata.decimals.toNumber();
                const assetName = u8aToString(metadata.name); // Use the actual asset name

                // console.log(`Asset metadata: ${assetName} (${symbol}) with ${decimals} decimals, Balance: ${balance.toString()}`);

                // 4. Skip if this is a duplicate of a native token we already have
                if (symbol === 'WND' && fetchedAccounts.some(acc => acc.symbol === 'WND')) {
                  console.log(`Skipping asset ${symbol} as native balance was already fetched.`);
                  return null;
                }

                // 5. Create and return the asset info
                return {
                  id: `${currentApi.runtimeChain}-${assetId.toString()}`,
                  title: assetName, // Use the fetched asset name
                  description: `${symbol} (${currentApi.runtimeChain})`,
                  balance: formatBalance(balance, { withSi: false, forceUnit: symbol, decimals: decimals }),
                  type: 'altcoin', // Could refine based on symbol/name later
                  symbol: symbol,
                  price: 'N/A', // Placeholder
                  change: 'N/A', // Placeholder
                  changeType: 'up', // Placeholder
                  decimals: decimals,
                  assetId: assetId.toString(), // Store assetId
                } as AccountItem;

              } catch (err) {
                const assetId = key.args[0] as AssetId;
                console.warn(`Error processing asset ${assetId?.toString() || 'UNKNOWN'}:`, err);
                return null; // Skip this asset if any error occurs during processing
              }
            });

            // Wait for all promises and filter out nulls safely
            const resolvedAccounts = await Promise.all(assetBalancePromises);
            const fetchedAssetAccounts = resolvedAccounts.filter((item): item is AccountItem => item !== null);

            console.log(`Fetched Asset Accounts (${currentApi.runtimeChain}):`, fetchedAssetAccounts);
            fetchedAccounts.push(...fetchedAssetAccounts);

          } catch (assetErr: unknown) {
            setError(`Failed to fetch asset balances: ${assetErr instanceof Error ? assetErr.message : String(assetErr)}`);
          }
        }

        setUserAccounts(fetchedAccounts);
        // Calculate total balance based on fetched accounts (example: sum WND if available)
        const wndBalance = fetchedAccounts.find(acc => acc.symbol === 'WND');
        const wndValue = wndBalance ? parseFloat(wndBalance.balance.split(' ')[0].replace(/,/g, '')) : 0;
        setTotalBalanceValue(wndValue * 1621.15); // Update placeholder total based on WND
        console.log("Final accounts list being set:", fetchedAccounts);

      } catch (err: unknown) {
        console.error("Overall balance fetching failed:", err);
        setError(`Failed to fetch balances: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
        console.log("Balance fetching finished.");
      }
    }; // End of fetchBalances

    // ... (useEffect call logic remains the same) ...
    if (api?.isReady && userAddress) {
      const timer = setTimeout(() => {
        fetchBalances();
      }, 100); // Small delay
      return () => clearTimeout(timer);
    } else if (!userAddress) {
      setIsLoading(false);
    }

  }, [api, userAddress]);


  // Format total balance for display
  const formattedTotalBalance = isLoading ? "Loading..." : `$${totalBalanceValue.toFixed(2)}`; // Simplified formatting


  // ... (rest of the return statement)


  if (!userAddress) {
    return <div className={cn("p-4 text-center text-red-500", className)}>User address not found. Please create or import an account.</div>;
  }

  if (isLoading) {
    return <div className={cn("p-4 text-center", className)}>Loading assets...</div>;
  }

  if (error) {
    return <div className={cn("p-4 text-center text-red-500", className)}>Error: {error}</div>;
  }

  return (
    <div
      className={cn(
        "w-full max-w-xl mx-auto",
        "bg-white dark:bg-zinc-900/70",
        "border border-zinc-100 dark:border-zinc-800",
        "rounded-xl shadow-sm backdrop-blur-xl",
        className,
      )}
    >
      {/* Total Balance Section */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Portfolio Value</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{formattedTotalBalance}</h1>
      </div>

      {/* Accounts List */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Your Assets</h2>
        </div>

        <div className="space-y-1">
          {userAccounts.length > 0 ? (
            userAccounts.map((account) => (
              <div key={account.id} className="w-full">
                <Dialog>
                  <DialogTrigger className="w-full">
                    <div
                      className={cn(
                        "group flex items-center justify-between w-full",
                        "p-2 rounded-lg",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                        "transition-all duration-200",
                        "cursor-pointer",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          // Refined icon logic based on type/symbol
                          className={cn("p-1.5 rounded-lg", {
                            "bg-gray-100 dark:bg-gray-900/30": account.type === 'native',
                            "bg-orange-100 dark:bg-orange-900/30": account.symbol === 'BTC', // Keep examples
                            "bg-blue-100 dark:bg-blue-900/30": account.symbol === 'ETH',
                            "bg-purple-100 dark:bg-purple-900/30": account.type === "altcoin",
                            "bg-green-100 dark:bg-green-900/30": account.type === "stablecoin",
                          })}
                        >
                          {/* Refined icon rendering */}
                          {account.type === 'native' && <Wallet className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />}
                          {account.symbol === 'BTC' && <Bitcoin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />}
                          {account.symbol === 'ETH' && <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                          {account.type === 'altcoin' && account.symbol !== 'BTC' && account.symbol !== 'ETH' && <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                          {account.type === 'stablecoin' && <CreditCard className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{account.title}</h3>
                          {account.description && (
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{account.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {/* Display formatted balance */}
                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{account.balance}</span>
                      </div>
                    </div>
                  </DialogTrigger>
                  {/* Pass the fetched account data to the dialog */}
                  <CryptoActionDialog crypto={account} api={api} userAddress={userAddress} />
                </Dialog>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">No assets found or still loading.</p>
          )}
        </div>
      </div>

      {/* Footer with four buttons - Corrected JSX structure */}
      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="grid grid-cols-4 gap-2">
          {/* Button 1: Buy */}
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buy</span>
          </button>
          {/* Button 2: Send */}
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
            )}
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
          {/* Button 3: Receive */}
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
            )}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Receive</span>
          </button>
          {/* Button 4: Swap */}
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-zinc-900 dark:bg-zinc-50",
              "text-zinc-50 dark:text-zinc-900",
              "hover:bg-zinc-800 dark:hover:bg-zinc-200",
              "shadow-sm hover:shadow",
              "transition-all duration-200",
            )}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
        </div> {/* Closing grid div */}
      </div> {/* Closing footer div */}
    </div> // Closing main component div
  )
}
