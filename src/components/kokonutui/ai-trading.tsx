"use client"

import { useState } from "react"
import { Brain, TrendingUp, LineChart, CircleDollarSign, Zap, History, PlayCircle, StopCircle, Settings, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Trading strategies
const STRATEGIES = [
  {
    id: "1",
    name: "Momentum Trader",
    description: "Uses price momentum indicators to identify and capitalize on market trends",
    risk: "Moderate",
    timeframe: "Short to Medium",
    performance: 68,
    status: "active",
  },
  {
    id: "2",
    name: "Volatility Breakout",
    description: "Identifies potential breakouts during periods of low volatility",
    risk: "High",
    timeframe: "Short",
    performance: 74,
    status: "inactive",
  },
  {
    id: "3",
    name: "Mean Reversion",
    description: "Identifies overextended price movements and trades the reversal",
    risk: "Moderate",
    timeframe: "Short",
    performance: 62,
    status: "inactive",
  },
  {
    id: "4",
    name: "Sentiment Analysis",
    description: "Uses AI to analyze market sentiment from news and social media",
    risk: "Low to Moderate",
    timeframe: "Medium",
    performance: 59,
    status: "inactive",
  }
]

// AI trading signals
const TRADING_SIGNALS = [
  {
    id: "1",
    asset: "BTC/USD",
    action: "Buy",
    price: "$71,245",
    confidence: 89,
    timestamp: "15 min ago",
    reason: "Bullish pattern detected with increasing volume",
  },
  {
    id: "2",
    asset: "ETH/USD",
    action: "Hold",
    price: "$3,576",
    confidence: 75,
    timestamp: "35 min ago",
    reason: "Consolidating in range, awaiting breakout confirmation",
  },
  {
    id: "3",
    asset: "SOL/USD",
    action: "Sell",
    price: "$154.32",
    confidence: 82,
    timestamp: "1 hour ago",
    reason: "Resistance rejection at key level with bearish divergence",
  },
  {
    id: "4",
    asset: "AXL/USD",
    action: "Buy",
    price: "$0.67",
    confidence: 91,
    timestamp: "25 min ago",
    reason: "Strong support bounce with increasing network activity",
  }
]

// Performance stats
const PERFORMANCE = {
  dailyReturn: "+2.4%",
  weeklyReturn: "+8.7%",
  monthlyReturn: "+17.2%",
  maxDrawdown: "-4.3%",
  winRate: "68%",
  tradesPerDay: "5-7",
  successfulTrades: 42,
  totalTrades: 62,
}

export default function AITrading() {
  const [activeStrategy, setActiveStrategy] = useState(STRATEGIES[0].id)

  return (
    <div className="space-y-6">
      {/* Header with overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F0F12] p-6 rounded-xl border border-gray-200 dark:border-[#1F1F23] flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Monthly Return</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{PERFORMANCE.monthlyReturn}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#0F0F12] p-6 rounded-xl border border-gray-200 dark:border-[#1F1F23] flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CircleDollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Success Rate</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{PERFORMANCE.winRate}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#0F0F12] p-6 rounded-xl border border-gray-200 dark:border-[#1F1F23] flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Active Strategy</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Momentum</p>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Trading Strategies */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Trading Strategies
              </h2>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </div>
            
            <div className="space-y-4">
              {STRATEGIES.map((strategy) => (
                <div 
                  key={strategy.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    strategy.id === activeStrategy
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-[#1F1F23] hover:border-blue-300 dark:hover:border-blue-700"
                  )}
                  onClick={() => setActiveStrategy(strategy.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{strategy.name}</h3>
                    {strategy.status === "active" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{strategy.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Risk:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">{strategy.risk}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Timeframe:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">{strategy.timeframe}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Performance</span>
                      <span className="text-gray-900 dark:text-white">{strategy.performance}%</span>
                    </div>
                    <Progress 
                      value={strategy.performance} 
                      className={cn(
                        "h-1.5",
                        strategy.performance > 70 ? "bg-green-200 dark:bg-green-900/20" : "bg-blue-200 dark:bg-blue-900/20"
                      )}
                      indicatorClassName={strategy.performance > 70 
                        ? "bg-green-500 dark:bg-green-400" 
                        : "bg-blue-500 dark:bg-blue-400"
                      }
                    />
                  </div>
                  
                  {strategy.id === activeStrategy ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <StopCircle className="h-4 w-4" />
                      Stop Running
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3 border-green-300 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Start
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right panel - AI Signals and Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Trading Signals */}
          <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                AI Trading Signals
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Updated 5 minutes ago</span>
            </div>
            
            <div className="space-y-4">
              {TRADING_SIGNALS.map((signal) => (
                <div 
                  key={signal.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-[#1F1F23] hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{signal.asset}</h3>
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs",
                        signal.action === "Buy" 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                          : signal.action === "Sell"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      )}>
                        {signal.action}
                      </span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">{signal.price}</span>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{signal.reason}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                      <div className="flex items-center">
                        <span className={cn(
                          "font-medium",
                          signal.confidence > 85 
                            ? "text-green-600 dark:text-green-400" 
                            : signal.confidence > 70
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        )}>
                          {signal.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <History className="h-3 w-3" />
                      <span>{signal.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Trading Signals
            </Button>
          </div>
          
          {/* Performance Metrics */}
          <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LineChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Performance Metrics
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs">1W</Button>
                <Button size="sm" variant="default" className="text-xs">1M</Button>
                <Button size="sm" variant="outline" className="text-xs">3M</Button>
                <Button size="sm" variant="outline" className="text-xs">1Y</Button>
              </div>
            </div>
            
            {/* Mockup Chart */}
            <div className="h-48 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-6 relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                <path
                  d="M0,50 C20,40 40,60 60,50 C80,40 100,60 120,50 C140,40 160,70 180,50 C200,30 220,60 240,50 C260,40 280,30 300,40 C320,50 340,20 360,30 C380,40 400,50 400,50"
                  fill="none"
                  stroke="rgba(79, 70, 229, 0.5)"
                  strokeWidth="3"
                />
                <path
                  d="M0,50 C20,40 40,60 60,50 C80,40 100,60 120,50 C140,40 160,70 180,50 C200,30 220,60 240,50 C260,40 280,30 300,40 C320,50 340,20 360,30 C380,40 400,50 400,50 L400,100 L0,100 Z"
                  fill="rgba(79, 70, 229, 0.1)"
                />
              </svg>
              <div className="absolute top-2 right-2 px-2 py-1 bg-white dark:bg-[#0F0F12] rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                Simulated Chart
              </div>
            </div>
            
            {/* Performance Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-[#1F1F23] p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Return</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{PERFORMANCE.dailyReturn}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1F1F23] p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weekly Return</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{PERFORMANCE.weeklyReturn}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1F1F23] p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Drawdown</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{PERFORMANCE.maxDrawdown}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1F1F23] p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Win Rate</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{PERFORMANCE.winRate}</p>
              </div>
            </div>
            
            {/* Trade Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#1F1F23]">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Trade Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Success Trades</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{PERFORMANCE.successfulTrades}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(PERFORMANCE.successfulTrades / PERFORMANCE.totalTrades) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Failed Trades</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{PERFORMANCE.totalTrades - PERFORMANCE.successfulTrades}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${((PERFORMANCE.totalTrades - PERFORMANCE.successfulTrades) / PERFORMANCE.totalTrades) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}