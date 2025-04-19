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
import { useState } from "react"

// Update the AccountItem interface to include additional properties
interface AccountItem {
  id: string
  title: string
  description?: string
  balance: string
  type: "bitcoin" | "ethereum" | "altcoin" | "stablecoin"
  symbol?: string
  price?: string
  change?: string
  changeType?: "up" | "down"
}

interface List01Props {
  totalBalance?: string
  accounts?: AccountItem[]
  className?: string
}

// Update the ACCOUNTS array to include the new properties
const ACCOUNTS: AccountItem[] = [
  {
    id: "1",
    title: "Bitcoin",
    description: "BTC",
    balance: "0.45 BTC ($18,459.45)",
    type: "bitcoin",
    symbol: "BTC",
    price: "$41,250.00",
    change: "2.4%",
    changeType: "up",
  },
  {
    id: "2",
    title: "Ethereum",
    description: "ETH",
    balance: "2.5 ETH ($4,850.00)",
    type: "ethereum",
    symbol: "ETH",
    price: "$1,940.00",
    change: "1.2%",
    changeType: "up",
  },
  {
    id: "3",
    title: "Solana",
    description: "SOL",
    balance: "120 SOL ($9,230.80)",
    type: "altcoin",
    symbol: "SOL",
    price: "$76.92",
    change: "3.5%",
    changeType: "up",
  },
  {
    id: "4",
    title: "USDC",
    description: "Stablecoin",
    balance: "1,200 USDC ($1,200.00)",
    type: "stablecoin",
    symbol: "USDC",
    price: "$1.00",
    change: "0.01%",
    changeType: "down",
  },
  {
    id: "5",
    title: "Cardano",
    description: "ADA",
    balance: "3,000 ADA ($2,800.00)",
    type: "altcoin",
    symbol: "ADA",
    price: "$0.93",
    change: "1.8%",
    changeType: "down",
  },
]

// Add a new CryptoActionDialog component
function CryptoActionDialog({ crypto }: { crypto: AccountItem }) {
  const [activeView, setActiveView] = useState<"main" | "send" | "receive" | "swap">("main")
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")

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
  const renderSendView = () => (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Send {crypto.title}</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Transfer {crypto.symbol} to another wallet</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="recipient" className="text-zinc-700 dark:text-zinc-300">
            Recipient Address
          </Label>
          <Input
            id="recipient"
            placeholder={`Enter ${crypto.symbol} address`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
          />
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
              {crypto.symbol}
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Available: {crypto.balance.split(" ")[0]}</span>
            <button
              className="text-zinc-900 dark:text-zinc-100 font-medium"
              onClick={() => setAmount(crypto.balance.split(" ")[0])}
            >
              MAX
            </button>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => setActiveView("main")}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <SendHorizontal className="w-5 h-5" />
            <span>Send {crypto.symbol}</span>
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

  // Function to render the receive view
  const renderReceiveView = () => (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Receive {crypto.title}</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Share your address to receive {crypto.symbol}</p>
      </div>

      <div className="flex flex-col items-center justify-center mb-6">
        <div className="bg-white p-4 rounded-lg mb-4">
          <QrCode className="w-40 h-40 sm:w-48 sm:h-48 text-zinc-900" />
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">
          Scan this QR code to receive {crypto.symbol}
        </p>
      </div>

      <div className="space-y-2 mb-6">
        <Label htmlFor="wallet-address" className="text-zinc-700 dark:text-zinc-300">
          Your {crypto.title} Address
        </Label>
        <div className="flex gap-2">
          <Input
            id="wallet-address"
            value={`${crypto.symbol.toLowerCase()}1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l`}
            readOnly
            className="flex-1 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
          />
          <button
            type="button"
            className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(`${crypto.symbol.toLowerCase()}1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l`)
            }}
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
          Only send {crypto.symbol} to this address. Sending any other asset may result in permanent loss.
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

  // Function to render the swap view
  const renderSwapView = () => (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Swap {crypto.title}</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Exchange {crypto.symbol} for other cryptocurrencies</p>
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
              {crypto.symbol}
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Available: {crypto.balance.split(" ")[0]}</span>
            <button
              className="text-zinc-900 dark:text-zinc-100 font-medium"
              onClick={() => setAmount(crypto.balance.split(" ")[0])}
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
            <select className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center border border-zinc-200 dark:border-zinc-700">
              <option>ETH</option>
              <option>USDC</option>
              <option>SOL</option>
            </select>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">1 {crypto.symbol} ≈ 15 ETH • Fee: 0.1%</p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => setActiveView("main")}
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

// Update the render function to include the dialog
export default function List01({ totalBalance = "$36,540.25", accounts = ACCOUNTS, className }: List01Props) {
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
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{totalBalance}</h1>
      </div>

      {/* Accounts List */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Your Assets</h2>
        </div>

        <div className="space-y-1">
          {accounts.map((account) => (
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
                        className={cn("p-1.5 rounded-lg", {
                          "bg-orange-100 dark:bg-orange-900/30": account.type === "bitcoin",
                          "bg-blue-100 dark:bg-blue-900/30": account.type === "ethereum",
                          "bg-purple-100 dark:bg-purple-900/30": account.type === "altcoin",
                          "bg-green-100 dark:bg-green-900/30": account.type === "stablecoin",
                        })}
                      >
                        {account.type === "bitcoin" && (
                          <Wallet className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        )}
                        {account.type === "ethereum" && (
                          <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                        {account.type === "altcoin" && (
                          <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        )}
                        {account.type === "stablecoin" && (
                          <CreditCard className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{account.title}</h3>
                        {account.description && (
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{account.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{account.balance}</span>
                    </div>
                  </div>
                </DialogTrigger>
                <CryptoActionDialog crypto={account} />
              </Dialog>
            </div>
          ))}
        </div>
      </div>

      {/* Updated footer with four buttons */}
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
