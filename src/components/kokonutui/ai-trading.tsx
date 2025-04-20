"use client"

import { useState } from "react"
import { Brain, TrendingUp, LineChart, CircleDollarSign, Zap, History, PlayCircle, StopCircle, Settings, Lightbulb, DollarSign, Target, Clock, AlertTriangle, BarChart2, Sliders, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts'

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

// Define types for our component
interface UserProfile {
  user_id: string;
  fund: number;
  max_exposure: number;
  risk_level: "low" | "medium" | "high";
  time_horizon: number;
  kill_switch: number;
  investment_goals: string[];
  preferred_activities: string[];
}

interface StrategyAllocation {
  protocol: string;
  weight_pct: number;
}

interface Strategy {
  allocations: StrategyAllocation[];
}

interface SimulationSummary {
  mean_final_value: number;
  median_final_value: number;
  std_dev_final_value: number;
  percentile_5th: number;
  percentile_95th: number;
  num_simulations: number;
}

interface StrategyResponse {
  strategy: Strategy;
  simulation_summary: SimulationSummary;
}

// Chart data generation function
const generateSimulationChartData = (response: StrategyResponse | null, userProfile: UserProfile) => {
  if (!response) return [];

  // Generate time points based on time horizon (monthly)
  const timePoints = Array.from({ length: userProfile.time_horizon + 1 }, (_, i) => i);
  
  // Calculate monthly growth rate from median final value
  const monthlyRate = Math.pow(
    response.simulation_summary.median_final_value / userProfile.fund, 
    1 / userProfile.time_horizon
  ) - 1;
  
  // Calculate monthly growth rates for different percentiles
  const lowMonthlyRate = Math.pow(
    response.simulation_summary.percentile_5th / userProfile.fund, 
    1 / userProfile.time_horizon
  ) - 1;
  
  const highMonthlyRate = Math.pow(
    response.simulation_summary.percentile_95th / userProfile.fund, 
    1 / userProfile.time_horizon
  ) - 1;

  // Generate data points
  return timePoints.map(month => {
    const median = userProfile.fund * Math.pow(1 + monthlyRate, month);
    const low = userProfile.fund * Math.pow(1 + lowMonthlyRate, month);
    const high = userProfile.fund * Math.pow(1 + highMonthlyRate, month);
    
    // Add some randomness to make the chart more realistic
    const medianWithNoise = median * (1 + (Math.random() * 0.04 - 0.02));
    
    return {
      month,
      median: Math.round(medianWithNoise),
      low: Math.round(low),
      high: Math.round(high),
      initial: userProfile.fund
    };
  });
};

export default function AITradingForm() {
  // Define state for form inputs
  const [userProfile, setUserProfile] = useState<UserProfile>({
    user_id: "001",
    fund: 20000,
    max_exposure: 0.5,
    risk_level: "low",
    time_horizon: 24,
    kill_switch: -0.1,
    investment_goals: ["passive_income"],
    preferred_activities: ["lending", "staking"]
  });

  // State for API response and loading state
  const [response, setResponse] = useState<StrategyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Investment goals options
  const investmentGoals = [
    { id: "passive_income", label: "Passive Income" },
    { id: "capital_appreciation", label: "Capital Appreciation" },
    { id: "wealth_preservation", label: "Wealth Preservation" },
    { id: "portfolio_diversification", label: "Portfolio Diversification" }
  ];

  // Activities options
  const activities = [
    { id: "lending", label: "Lending" },
    { id: "staking", label: "Staking" },
    { id: "yield_farming", label: "Yield Farming" },
    { id: "trading", label: "Trading" }
  ];

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to format percentage
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  // Handle changes to investment goals
  const handleGoalChange = (goalId: string, checked: boolean) => {
    if (checked) {
      setUserProfile({
        ...userProfile,
        investment_goals: [...userProfile.investment_goals, goalId]
      });
    } else {
      setUserProfile({
        ...userProfile,
        investment_goals: userProfile.investment_goals.filter(id => id !== goalId)
      });
    }
  };

  // Handle changes to preferred activities
  const handleActivityChange = (activityId: string, checked: boolean) => {
    if (checked) {
      setUserProfile({
        ...userProfile,
        preferred_activities: [...userProfile.preferred_activities, activityId]
      });
    } else {
      setUserProfile({
        ...userProfile,
        preferred_activities: userProfile.preferred_activities.filter(id => id !== activityId)
      });
    }
  };

  // Function to generate strategy
  const generateStrategy = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate strategy');
      }
      
      const data = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate expected return from the simulation (difference between median final value and initial fund)
  const expectedReturn = response 
    ? (response.simulation_summary.median_final_value - userProfile.fund) / userProfile.fund 
    : 0;

  // Calculate risk (using standard deviation as a percentage of initial fund)
  const riskMetric = response 
    ? response.simulation_summary.std_dev_final_value / userProfile.fund 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              AI Strategy Generator
            </CardTitle>
            <CardDescription>
              Configure your investment profile and let our AI generate an optimal DeFi strategy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Initial Investment */}
            <div className="space-y-2">
              <Label htmlFor="fund" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                Initial Investment
              </Label>
              <Input
                id="fund"
                type="number"
                value={userProfile.fund}
                onChange={(e) => setUserProfile({ ...userProfile, fund: Number(e.target.value) })}
                min="1000"
                step="1000"
              />
              <p className="text-xs text-gray-500">Amount available for investment in USD</p>
            </div>

            {/* Maximum Exposure */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="max-exposure" className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-gray-500" />
                  Maximum Exposure
                </Label>
                <span className="text-sm font-medium">{formatPercent(userProfile.max_exposure)}</span>
              </div>
              <Slider
                id="max-exposure"
                value={[userProfile.max_exposure * 100]}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) => setUserProfile({ ...userProfile, max_exposure: value[0] / 100 })}
                className="py-2"
              />
              <p className="text-xs text-gray-500">Percentage of funds to be invested vs. held as cash</p>
            </div>

            {/* Risk Level */}
            <div className="space-y-2">
              <Label htmlFor="risk-level" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                Risk Level
              </Label>
              <Select
                value={userProfile.risk_level}
                onValueChange={(value) => setUserProfile({ 
                  ...userProfile, 
                  risk_level: value as "low" | "medium" | "high" 
                })}
              >
                <SelectTrigger id="risk-level">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Horizon */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="time-horizon" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Time Horizon (Months)
                </Label>
                <span className="text-sm font-medium">{userProfile.time_horizon} months</span>
              </div>
              <Slider
                id="time-horizon"
                value={[userProfile.time_horizon]}
                min={1}
                max={60}
                step={1}
                onValueChange={(value) => setUserProfile({ ...userProfile, time_horizon: value[0] })}
                className="py-2"
              />
            </div>

            {/* Kill Switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="kill-switch" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  Kill Switch Threshold
                </Label>
                <span className="text-sm font-medium">{formatPercent(userProfile.kill_switch)}</span>
              </div>
              <Slider
                id="kill-switch"
                value={[Math.abs(userProfile.kill_switch) * 100]}
                min={5}
                max={50}
                step={5}
                onValueChange={(value) => setUserProfile({ ...userProfile, kill_switch: -(value[0] / 100) })}
                className="py-2"
              />
              <p className="text-xs text-gray-500">Maximum drawdown before stopping the strategy</p>
            </div>

            {/* Investment Goals */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-gray-500" />
                Investment Goals
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {investmentGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={goal.id}
                      checked={userProfile.investment_goals.includes(goal.id)}
                      onCheckedChange={(checked) => handleGoalChange(goal.id, checked === true)}
                    />
                    <Label htmlFor={goal.id} className="text-sm font-normal cursor-pointer">
                      {goal.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Activities */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gray-500" />
                Preferred Activities
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={activity.id}
                      checked={userProfile.preferred_activities.includes(activity.id)}
                      onCheckedChange={(checked) => handleActivityChange(activity.id, checked === true)}
                    />
                    <Label htmlFor={activity.id} className="text-sm font-normal cursor-pointer">
                      {activity.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={generateStrategy} 
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Strategy'}
            </Button>
          </CardFooter>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Strategy & Simulation Results
            </CardTitle>
            <CardDescription>
              AI-generated strategy based on your investment profile with performance simulation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="text-gray-500">Generating your optimal strategy and running Monte Carlo simulations...</p>
              </div>
            )}

            {!isLoading && !error && response && (
              <>
                {/* Strategy Allocation Card */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Recommended Allocation
                  </h3>
                  
                  <div className="space-y-4">
                    {response.strategy.allocations.map((allocation, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-200">
                            {allocation.protocol}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {formatPercent(allocation.weight_pct)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${allocation.weight_pct * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Cash Position */}
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          Cash
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {formatPercent(1 - userProfile.max_exposure)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(1 - userProfile.max_exposure) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation Results */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Simulation Results
                  </h3>
                  
                  {/* Key Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Final Value</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-200">
                        {formatCurrency(response.simulation_summary.median_final_value)}
                      </p>
                      <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                        {formatPercent(expectedReturn)} return
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Initial Investment</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-200">
                        {formatCurrency(userProfile.fund)}
                      </p>
                      <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {userProfile.time_horizon} months period
                      </div>
                    </div>
                  </div>
                  
                  {/* Simulation Chart */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                    <Tabs defaultValue="area" className="w-full">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Simulation Chart</h4>
                        <TabsList className="grid w-52 grid-cols-2">
                          <TabsTrigger value="area">Area</TabsTrigger>
                          <TabsTrigger value="line">Line</TabsTrigger>
                        </TabsList>
                      </div>
                      
                      <TabsContent value="area" className="mt-0 border-0 p-0">
                        <div className="h-64 sm:h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={generateSimulationChartData(response, userProfile)}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient id="colorMedian" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="month" 
                                label={{ 
                                  value: 'Months', 
                                  position: 'insideBottom', 
                                  offset: -5 
                                }} 
                                tickFormatter={(value) => value % 6 === 0 ? value : ''}
                              />
                              <YAxis 
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                width={60}
                              />
                              <Tooltip 
                                formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                                labelFormatter={(value) => `Month ${value}`}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="low" 
                                stackId="1"
                                stroke="none" 
                                fill="url(#colorRange)" 
                                name="Worst Case (5%)"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="high" 
                                stackId="1"
                                stroke="none" 
                                fill="url(#colorRange)" 
                                name="Best Case (95%)"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="median" 
                                stroke="#3b82f6" 
                                fill="url(#colorMedian)"
                                name="Expected Value"
                                strokeWidth={2}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="initial" 
                                stroke="#9ca3af" 
                                strokeDasharray="3 3" 
                                fill="none"
                                name="Initial Investment"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="line" className="mt-0 border-0 p-0">
                        <div className="h-64 sm:h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={generateSimulationChartData(response, userProfile)}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="month" 
                                label={{ 
                                  value: 'Months', 
                                  position: 'insideBottom', 
                                  offset: -5 
                                }} 
                                tickFormatter={(value) => value % 6 === 0 ? value : ''}
                              />
                              <YAxis 
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                width={60}
                              />
                              <Tooltip 
                                formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                                labelFormatter={(value) => `Month ${value}`}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="low" 
                                stroke="#f59e0b" 
                                name="Worst Case (5%)"
                                dot={false}
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="high" 
                                stroke="#22c55e" 
                                name="Best Case (95%)"
                                dot={false}
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="median" 
                                stroke="#3b82f6" 
                                name="Expected Value"
                                dot={false}
                                strokeWidth={2.5}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="initial" 
                                stroke="#9ca3af" 
                                strokeDasharray="3 3"
                                name="Initial Investment"
                                dot={false}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="text-xs text-gray-500">
                      <p>Chart shows expected investment value progression over {userProfile.time_horizon} months based on simulations.</p>
                    </div>
                  </div>
                  
                  {/* Detailed Stats */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Simulation Details</h4>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Mean Final Value:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(response.simulation_summary.mean_final_value)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Median Final Value:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(response.simulation_summary.median_final_value)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Standard Deviation:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(response.simulation_summary.std_dev_final_value)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Risk Profile:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {formatPercent(riskMetric)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">5th Percentile:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(response.simulation_summary.percentile_5th)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">95th Percentile:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(response.simulation_summary.percentile_95th)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">Simulations Run:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {response.simulation_summary.num_simulations.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Results Range */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Worst Case (5%)</span>
                    <span>Best Case (95%)</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="absolute h-2 bg-gradient-to-r from-amber-500 via-blue-500 to-green-500 rounded-full"
                      style={{ 
                        left: `${((response.simulation_summary.percentile_5th - userProfile.fund * 0.8) / (userProfile.fund * 1.5)) * 100}%`,
                        width: `${((response.simulation_summary.percentile_95th - response.simulation_summary.percentile_5th) / (userProfile.fund * 1.5)) * 100}%`
                      }}
                    ></div>
                    <div 
                      className="absolute w-2 h-4 -mt-1 bg-blue-600 rounded-full"
                      style={{ 
                        left: `${((response.simulation_summary.median_final_value - userProfile.fund * 0.8) / (userProfile.fund * 1.5)) * 100}%`,
                        transform: "translateX(-50%)"
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-medium pt-1">
                    <span className="text-amber-600 dark:text-amber-400">
                      {formatCurrency(response.simulation_summary.percentile_5th)}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(response.simulation_summary.median_final_value)}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(response.simulation_summary.percentile_95th)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {!isLoading && !error && !response && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                  <LineChart className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-200">No Results Yet</p>
                  <p className="text-gray-500">Configure your investment profile and generate a strategy to see results here.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}