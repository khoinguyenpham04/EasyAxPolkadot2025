"use client"; // Add this line

import { useState, useEffect } from 'react'; // Import hooks

import { Calendar, Bitcoin, Coins, Wallet } from "lucide-react"; // Add Wallet icon
import { CryptoCurrencyMarket } from "react-ts-tradingview-widgets";
import List01 from "./list-01";
import List02 from "./list-02";
import List03 from "./list-03";

export default function Content() {
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    // Runs only on the client side
    const address = localStorage.getItem("userAddress");
    if (address) {
      setUserAddress(address);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="space-y-4">
      {/* Display User Address */}
      {userAddress && (
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 mb-4 border border-gray-200 dark:border-[#1F1F23] flex items-center gap-3">
          <Wallet className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Address:</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{userAddress}</p>
          </div>
        </div>
      )}

      {/* Existing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ... existing Crypto Assets card ... */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
            <Bitcoin className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
            Crypto Assets
          </h2>
          <div className="flex-1">
            <List01 className="h-full" />
          </div>
        </div>
        {/* ... existing Recent Transactions card ... */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
            Recent Transactions
          </h2>
          <div className="flex-1">
            Coming Soon
          </div>
        </div>
      </div>

      {/* ... existing Market Events card ... */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col items-start justify-start border border-gray-200 dark:border-[#1F1F23]">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
          Market Events
        </h2>
        Coming soon
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Live Crypto Market
        </h2>
        <div className="border dark:border-[#1F1F23] rounded-xl overflow-hidden">
          <CryptoCurrencyMarket
            colorTheme="dark"
            width="100%"
            height={400}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Live Crypto Market
        </h2>
        <div className="border dark:border-[#1F1F23] rounded-xl overflow-hidden">
          <CryptoCurrencyMarket
            colorTheme="dark"
            width="100%"
            height={400}
          />
        </div>
      </div>
    </div>
  );
}
