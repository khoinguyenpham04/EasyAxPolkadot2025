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
} from "lucide-react"

// Dialog imports
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react"

// Polkadot API imports
import { ApiPromise, WsProvider } from '@polkadot/api'; // Import API components
import { formatBalance, u8aToString } from '@polkadot/util'; // Import balance formatting utility
import type { AccountInfo } from '@polkadot/types/interfaces/system'; // Import AccountInfo type
import type { AssetDetails, AssetMetadata, AssetAccount } from '@polkadot/types/interfaces/assets'; // Import Asset types
import type { Option } from '@polkadot/types'; // Import Option type
import type { AssetId } from '@polkadot/types/interfaces/runtime'; // Import AssetId
import type { AccountId } from '@polkadot/types/interfaces/runtime'; // Import AccountId
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
}

interface List01Props {
  totalBalance?: string
  accounts?: AccountItem[]
  className?: string
}

// Add a new CryptoActionDialog component
function CryptoActionDialog({ crypto }: { crypto: AccountItem }) {
  const [activeView, setActiveView] = useState<"main" | "send" | "receive" | "swap">("main")
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [userQRAddress, setUserQRAddress] = useState<string | null>(null);

  // Add QR scanner related states at the top level
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Move the useEffect to the component top level
  useEffect(() => {
    const address = localStorage.getItem("userQRAddress");
    if (address) {
      setUserQRAddress(address);
    }
  }, []);

  // Function to handle QR code scanning result
  const handleScanResult = (result: string) => {
    setAddress(result);
    setShowScanner(false);
  };

  // Sample transaction data
  const transactions = [
    {
      id: "1",
      type: "Transfer",
      from: `bc1qamgj...6rgqwfkew688k`,
      amount: "***",
      date: "4/8/25",
      time: "21:17",
    },
    {
      id: "2",
      type: "Transfer",
      from: `bc1qamgj...6rgqwfkew688k`,
      amount: "***",
      date: "3/31/25",
      time: "13:13",
    },
    {
      id: "3",
      type: "Transfer",
      from: `bc1qamgj...6rgqwfkew688k`,
      amount: "***",
      date: "3/1/25",
      time: "15:14",
    },
    {
      id: "4",
      type: "Transfer",
      from: `bc1qamgj...6rgqwfkew688k`,
      amount: "***",
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

  // Function to render the send view
  const renderSendView = () => {

    return (
      <div className="p-4 sm:p-6">
        {showScanner && <QRScanner />}

        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Send {crypto.title}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Transfer {crypto.symbol} to another wallet</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-zinc-700 dark:text-zinc-300">
              Recipient Address
            </Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                placeholder={`Enter ${crypto.symbol || 'Asset'} address`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
              Amount to Send
            </Label>
            <div className="flex gap-2">
              <Input
                id="send-amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
              <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border border-zinc-200 dark:border-zinc-700">
                {crypto.symbol || 'Tokens'}
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
                // Here you would call your actual send function
                const handleSend = (recipientAddress: string, amountToSend: string) => {
                  console.log(`Sending ${amountToSend} ${crypto.symbol} to ${recipientAddress}`);
                  // Implement actual send functionality here
                  alert(`Transaction initiated: ${amountToSend} ${crypto.symbol} to ${recipientAddress}`);
                  setActiveView("main");
                };

                if (address && amount) {
                  handleSend(address, amount);
                } else {
                  alert("Please enter both recipient address and amount");
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              <SendHorizontal className="w-5 h-5" />
              <span>Send {crypto.symbol || 'Asset'}</span>
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
    const addressToDisplay = userQRAddress || `${crypto.symbol?.toLowerCase() || 'address'}1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l`;

    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Receive {crypto.title}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Share your address to receive {crypto.symbol || 'Asset'}</p>
        </div>

        <div className="flex flex-col items-center justify-center mb-6">
          <div className="bg-white p-4 rounded-lg mb-4">
            {userQRAddress ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(userQRAddress)}`}
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
              value={addressToDisplay}
              readOnly
              className="flex-1 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            />
            <button
              type="button"
              className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(addressToDisplay)
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
    );
  }

  // Function to render the swap view
  const renderSwapView = () => (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Swap {crypto.title}</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Exchange {crypto.symbol || 'Asset'} for other cryptocurrencies</p>
      </div>

      <div className="space-y-6">
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
              className="flex-1 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            />
            <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border border-zinc-200 dark:border-zinc-700">
              {crypto.symbol || 'Tokens'}
            </div>
          </div>
          <div className="flex justify-between text-xs">
            {/* Use formatted balance */}
            <span className="text-zinc-500 dark:text-zinc-400">Available: {crypto.balance}</span>
            <button
              className="text-zinc-900 dark:text-zinc-100 font-medium"
              // Use formatted balance
              onClick={() => setAmount(crypto.balance.split(' ')[0])}
            >
              MAX
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full">
            <ArrowDownLeft className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="to-amount" className="text-zinc-700 dark:text-zinc-300">
            To (Estimated)
          </Label>
          <div className="flex gap-2">
            <Input
              id="to-amount"
              placeholder="0.00"
              value={amount ? (Number(amount) * 15).toFixed(2) : ""}
              readOnly
              className="flex-1 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            />
            <select
              aria-label="Select currency to swap to" // Added aria-label
              className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border border-zinc-200 dark:border-zinc-700"
            >
              <option>ETH</option>
              <option>USDC</option>
              <option>SOL</option>
            </select>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">1 {crypto.symbol || 'Asset'} ≈ 15 ETH • Fee: 0.1%</p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            // onClick={() => setActiveView("main")} // Keep user on swap view for now
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>Swap</span>
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
  )

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
    <DialogContent className="sm:max-w-[650px] md:max-w-[700px] p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Content based on active view */}
      <div className="max-h-[75vh] overflow-y-auto rounded-lg">{renderContent()}</div>
    </DialogContent>
  )
}

// Update the main List01 component
export default function List01({ className }: List01Props) { // Remove accounts and totalBalance from props for now
  const [userQRAddress, setUserQRAddress] = useState<string | null>(null);
  const [userAccounts, setUserAccounts] = useState<AccountItem[]>([]);
  const [totalBalanceValue, setTotalBalanceValue] = useState<number>(0); // Store raw total balance
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<ApiPromise | null>(null);

  // Effect to get address and connect to API
  useEffect(() => {
    const address = localStorage.getItem("userQRAddress");
    const endpoint = localStorage.getItem("networkEndpoint");
    setUserQRAddress(address);
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
      // Ensure API for assets is connected (or connecting) and userAddress exists
      if (!userQRAddress) {
        console.log("UserQRAddress missing, skipping balance fetch.");
        setIsLoading(false); // Set loading false if address is missing
        return;
      }

      // Set loading true when starting the fetch
      setIsLoading(true);
      setError(null);
      console.log(`Fetching balances for address: ${userQRAddress}`);

      let relayApi: ApiPromise | null = null;
      const westendRelayEndpoint = 'wss://westend-rpc.polkadot.io';
      const fetchedAccounts: AccountItem[] = [];

      try {
        // 1. Fetch Native WND Balance from Westend Relay Chain
        try {
          console.log(`Connecting to Westend Relay Chain (${westendRelayEndpoint}) for native balance...`);
          const relayProvider = new WsProvider(westendRelayEndpoint);
          relayApi = await ApiPromise.create({ provider: relayProvider });
          await relayApi.isReady;
          console.log(`Successfully connected to ${relayApi.runtimeChain} for native balance.`);

          const { data: balanceData } = await relayApi.query.system.account<AccountInfo>(userQRAddress);
          const nativeTokenInfo = relayApi.registry.chainTokens[0];
          const nativeDecimals = relayApi.registry.chainDecimals[0];
          const nativeSymbol = nativeTokenInfo || 'WND'; // Default to WND if not found
          const nativeFree = balanceData.free;
          console.log(`Raw native free balance (Relay Chain): ${nativeFree.toString()}`);

          if (!nativeFree.isZero()) {
            const nativeAccount: AccountItem = {
              id: nativeSymbol,
              title: nativeSymbol,
              description: 'Native Token (Westend)',
              balance: formatBalance(nativeFree, { withSi: false, forceUnit: nativeSymbol, decimals: nativeDecimals }),
              type: 'native',
              symbol: nativeSymbol,
              price: 'N/A',
              change: 'N/A',
              changeType: 'up',
              decimals: nativeDecimals,
            };
            fetchedAccounts.push(nativeAccount);
            console.log("Fetched Native Account (Relay Chain):", nativeAccount);
          } else {
            console.log(`Native balance is zero on Westend Relay Chain for address ${userQRAddress}.`);
          }
        } catch (relayErr) {
          console.error("Failed to connect or fetch native balance from Relay Chain:", relayErr);
          // Don't set global error yet, maybe asset hub connection works
        } finally {
          console.log("Disconnecting temporary Relay Chain API...");
          await relayApi?.disconnect(); // Disconnect temporary API
        }

        // 2. Fetch Asset Balances from the primary connected API (e.g., Asset Hub)
        if (!api || !api.isReady) {
          console.log("Primary API (for assets) not ready, skipping asset balance fetch.");
        } else {
          console.log(`Fetching asset balances from primary connection: ${api.runtimeChain}`);
          try {
            console.log("Fetching all asset definitions from primary API...");
            const assetEntries = await api.query.assets.asset.entries<Option<AssetDetails>, [AssetId]>();
            console.log(`Found ${assetEntries.length} potential asset definitions on ${api.runtimeChain}.`);

            const assetBalancePromises = assetEntries.map(async ([key, optionalAssetDetails]) => {
              if (optionalAssetDetails.isNone) return null;
              const assetId = key.args[0];
              const optionalAccountData = await api.query.assets.account<Option<AssetAccount>, [AssetId, AccountId]>(assetId, userQRAddress);

              if (optionalAccountData.isNone) return null;
              const accountData = optionalAccountData.unwrap();
              if (accountData.balance.isZero() || accountData.isFrozen.isTrue) return null;

              const optionalMetadata = await api.query.assets.metadata<Option<AssetMetadata>, [AssetId]>(assetId);
              if (optionalMetadata.isNone) return null;
              const metadata = optionalMetadata.unwrap();

              const symbol = u8aToString(metadata.symbol);
              const decimals = metadata.decimals.toNumber();
              const name = u8aToString(metadata.name);

              // Avoid adding the native token if it somehow appears as an asset
              if (symbol === 'WND' && fetchedAccounts.some(acc => acc.symbol === 'WND')) {
                console.log(`Skipping asset ${symbol} as native balance was already fetched.`);
                return null;
              }

              return {
                id: `${api.runtimeChain}-${assetId.toString()}`, // Prefix ID with chain name
                title: name || `Asset #${assetId.toString()}`,
                description: `${symbol} (${api.runtimeChain})`, // Add chain context
                balance: formatBalance(accountData.balance, { withSi: false, forceUnit: symbol, decimals: decimals }),
                type: 'altcoin',
                symbol: symbol,
                price: 'N/A',
                change: 'N/A',
                changeType: 'up',
                decimals: decimals,
              } as AccountItem;
            });

            const fetchedAssetAccounts = (await Promise.all(assetBalancePromises)).filter(Boolean) as AccountItem[];
            console.log(`Fetched Asset Accounts (${api.runtimeChain}):`, fetchedAssetAccounts);
            fetchedAccounts.push(...fetchedAssetAccounts); // Add assets to the list

          } catch (assetErr) {
            console.error(`Failed to fetch asset balances from ${api.runtimeChain}:`, assetErr);
            setError(`Failed to fetch asset balances: ${assetErr instanceof Error ? assetErr.message : String(assetErr)}`);
          }
        }

        // Combine native and asset accounts (already done by pushing)
        setUserAccounts(fetchedAccounts);
        setTotalBalanceValue(Number(fetchedAccounts[0].balance) * 1621.15); // Update placeholder total
        console.log("Final accounts list being set:", fetchedAccounts);

      } catch (err) {
        // Catch any broader errors not caught in specific sections
        console.error("Overall balance fetching failed:", err);
        setError(`Failed to fetch balances: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false); // Set loading false after all fetches complete or fail
        console.log("Balance fetching finished.");
      }
    };

    // Debounce or delay fetchBalances slightly after API becomes ready
    const timer = setTimeout(() => {
      fetchBalances();
    }, 100); // Small delay

    return () => clearTimeout(timer); // Clear timeout on cleanup

  }, [api, userQRAddress]); // Re-run if primary api instance or userAddress changes

  // Format total balance for display (placeholder)
  const formattedTotalBalance = isLoading ? "Loading..." : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(totalBalanceValue.toFixed(2)))}`; // Indicate it's a count

  // ... (rest of the return statement)


  if (!userQRAddress) {
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

      {/* Accounts List - Use fetched userAccounts */}
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
                  <CryptoActionDialog crypto={account} />
                </Dialog>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">No assets found or still loading.</p>
          )}
        </div>
      </div>

      {/* Footer with four buttons (remains the same) */}
      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="grid grid-cols-4 gap-2">
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
        </div>
      </div>
    </div>
  )
}
