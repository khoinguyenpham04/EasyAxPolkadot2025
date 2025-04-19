"use client";

import { useState, useEffect } from 'react';
import { Calendar, Bitcoin, Coins, Wallet, ArrowUpRight, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { CryptoCurrencyMarket } from "react-ts-tradingview-widgets";
import { motion } from "framer-motion";
import List01 from "./list-01";
import List02 from "./list-02";
import List03 from "./list-03";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Content() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isAddressCopied, setIsAddressCopied] = useState(false);

  useEffect(() => {
    // Runs only on the client side
    const address = localStorage.getItem("userAddress");
    if (address) {
      setUserAddress(address);
    }
  }, []);

  const copyAddressToClipboard = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      setIsAddressCopied(true);
      setTimeout(() => setIsAddressCopied(false), 2000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div 
      className="space-y-6 pb-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Welcome Section with Address */}
      {userAddress && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Welcome to Your Dashboard</h1>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-xs md:max-w-md">
                      {userAddress.substring(0, 8)}...{userAddress.substring(userAddress.length - 8)}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      onClick={copyAddressToClipboard}
                    >
                      {isAddressCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    <TrendingUp className="w-3 h-3 mr-1" /> Live
                  </Badge>
                  <Badge variant="outline" className="bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                    <Clock className="w-3 h-3 mr-1" /> Testnet
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Crypto Assets card */}
        <motion.div className="lg:col-span-7" variants={itemVariants}>
          <Card className="border shadow-sm dark:shadow-none h-full">
            <CardHeader className="pb-2 pt-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Bitcoin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  Crypto Assets
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-600 dark:text-zinc-400">
                  View All <ArrowUpRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <List01 className="h-full" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions card */}
        <motion.div className="lg:col-span-5" variants={itemVariants}>
          <Card className="border shadow-sm dark:shadow-none h-full">
            <CardHeader className="pb-2 pt-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Recent Transactions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2 h-[300px] flex items-center justify-center">
              <div className="text-center text-zinc-500 dark:text-zinc-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Coming Soon</p>
                <p className="text-sm mt-1">Transaction history will appear here</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Market Events card */}
      <motion.div variants={itemVariants}>
        <Card className="border shadow-sm dark:shadow-none">
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Market Events
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 h-[100px] flex items-center justify-center">
            <div className="text-center text-zinc-500 dark:text-zinc-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">Coming Soon</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Crypto Market */}
      <motion.div variants={itemVariants}>
        <Card className="border shadow-sm dark:shadow-none overflow-hidden">
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-lg font-bold">Live Crypto Market</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="border dark:border-zinc-800 rounded-xl overflow-hidden">
              <CryptoCurrencyMarket
                colorTheme="dark"
                width="100%"
                height={400}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Remove duplicate Live Crypto Market section */}
    </motion.div>
  );
}
