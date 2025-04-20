"use client"

import { useState, useEffect } from "react"
import { Brain, TrendingUp, LineChart, CircleDollarSign, Zap, History, PlayCircle, StopCircle, Settings, Lightbulb, DollarSign, Target, Clock, AlertTriangle, BarChart2, Sliders, PieChart, Share2, Download, BookOpen, HelpCircle, RefreshCw, ArrowRightCircle, Info } from "lucide-react"
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
  ComposedChart,
  Bar,
  BarChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts'
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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

  // New states for enhanced UX
  const [activeTab, setActiveTab] = useState("form");
  const [savedStrategies, setSavedStrategies] = useState<Array<{
    id: string;
    name: string;
    date: string;
    userProfile: UserProfile;
    response: StrategyResponse | null;
  }>>([]);
  const [strategyName, setStrategyName] = useState("My Strategy");
  const [showStrategyGuide, setShowStrategyGuide] = useState(false);
  
  // Risk level descriptions for better user understanding
  const riskLevelInfo = {
    low: {
      description: "Conservative approach with stable returns and minimal volatility. Suitable for capital preservation.",
      expectedReturn: "3-8% annually",
      protocolTypes: "Established lending platforms, liquid staking protocols",
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    },
    medium: {
      description: "Balanced approach with moderate risk for higher returns. Good for overall portfolio growth.",
      expectedReturn: "8-15% annually",
      protocolTypes: "Mid-range DeFi platforms, blue-chip asset staking",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    },
    high: {
      description: "Aggressive approach seeking maximum returns with higher volatility and risk.",
      expectedReturn: "15%+ annually",
      protocolTypes: "New protocols, yield farming strategies, trading",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    }
  };

  // Predefined template profiles for quick selection
  const profileTemplates = [
    {
      name: "Conservative Income",
      profile: {
        fund: 10000,
        max_exposure: 0.7,
        risk_level: "low" as const,
        time_horizon: 36,
        kill_switch: -0.1,
        investment_goals: ["passive_income", "wealth_preservation"],
        preferred_activities: ["lending", "staking"]
      }
    },
    {
      name: "Balanced Growth",
      profile: {
        fund: 25000,
        max_exposure: 0.8,
        risk_level: "medium" as const,
        time_horizon: 24,
        kill_switch: -0.15,
        investment_goals: ["capital_appreciation", "portfolio_diversification"],
        preferred_activities: ["lending", "staking", "yield_farming"]
      }
    },
    {
      name: "Aggressive Growth",
      profile: {
        fund: 15000,
        max_exposure: 0.9,
        risk_level: "high" as const,
        time_horizon: 12,
        kill_switch: -0.2,
        investment_goals: ["capital_appreciation"],
        preferred_activities: ["yield_farming", "trading"]
      }
    }
  ];

  // Apply a template profile
  const applyTemplate = (template: typeof profileTemplates[0]) => {
    setUserProfile({
      ...userProfile,
      ...template.profile
    });
  };

  // Save current strategy
  const saveStrategy = () => {
    if (!response) return;
    
    setSavedStrategies([
      ...savedStrategies,
      {
        id: Date.now().toString(),
        name: strategyName,
        date: new Date().toLocaleDateString(),
        userProfile: { ...userProfile },
        response
      }
    ]);
  };
  
  // Generate pie chart data from allocations
  const generatePieChartData = () => {
    if (!response) return [];
    
    const allocations = [...response.strategy.allocations];
    
    // Add cash position
    allocations.push({
      protocol: "Cash",
      weight_pct: 1 - userProfile.max_exposure
    });
    
    return allocations.map(item => ({
      name: item.protocol,
      value: item.weight_pct
    }));
  };

  // Color palette for pie chart
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b', '#ef4444'];
  
  // Annual return calculation (compounded)
  const annualReturn = response 
    ? Math.pow(response.simulation_summary.median_final_value / userProfile.fund, 12 / userProfile.time_horizon) - 1
    : 0;

  // Calculate Sharpe ratio (simplified)
  const sharpeRatio = response && riskMetric > 0
    ? (annualReturn - 0.02) / riskMetric // Assuming 2% risk-free rate
    : 0;

  // Format as regular number with decimals
  const formatNumber = (value: number, decimals = 2) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  return (
    <div className="space-y-6">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <TabsList className="mb-2 sm:mb-0">
            <TabsTrigger value="form" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Create Strategy</span>
            </TabsTrigger>
            <TabsTrigger value="strategies" className="gap-2">
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">My Strategies</span>
              {savedStrategies.length > 0 && (
                <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {savedStrategies.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Trading Insights</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 items-center self-end sm:self-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Guide</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto" side="right">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Strategy Creation Guide
                  </SheetTitle>
                  <SheetDescription>
                    Learn how to create optimal investment strategies
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Understanding Risk Levels</h3>
                    <div className="space-y-3">
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                        <h4 className="font-medium text-green-800 dark:text-green-400">Low Risk</h4>
                        <p className="text-sm mt-1">Focuses on capital preservation with stable returns. Primarily uses established lending platforms and staking protocols.</p>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <h4 className="font-medium text-blue-800 dark:text-blue-400">Medium Risk</h4>
                        <p className="text-sm mt-1">Balanced approach for moderate growth. Mix of lending, staking, and some yield farming opportunities.</p>
                      </div>
                      
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <h4 className="font-medium text-amber-800 dark:text-amber-400">High Risk</h4>
                        <p className="text-sm mt-1">Aggressive approach for maximum returns. Includes newer protocols, active yield farming, and trading strategies.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Investment Goals</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 mt-0.5">
                          <CircleDollarSign className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Passive Income</p>
                          <p className="text-gray-500">Focus on generating regular yield through lending and staking</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1 mt-0.5">
                          <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">Capital Appreciation</p>
                          <p className="text-gray-500">Focus on growing principal through higher-risk, higher-reward strategies</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1 mt-0.5">
                          <CircleDollarSign className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium">Wealth Preservation</p>
                          <p className="text-gray-500">Focus on maintaining value with minimal risk of loss</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1 mt-0.5">
                          <PieChart className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">Portfolio Diversification</p>
                          <p className="text-gray-500">Focus on spreading risk across different protocols and strategies</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Understanding Metrics</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium">Sharpe Ratio</p>
                        <p className="text-gray-500">Measures risk-adjusted returns. Higher is better. Above 1.0 is considered good.</p>
                      </div>
                      <div>
                        <p className="font-medium">Risk Metric</p>
                        <p className="text-gray-500">Measures volatility relative to investment. Lower values indicate more stable returns.</p>
                      </div>
                      <div>
                        <p className="font-medium">Percentile Values</p>
                        <p className="text-gray-500">5th percentile shows worst-case scenario, 95th shows best-case scenario based on simulations.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => saveStrategy()} disabled={!response}>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save this strategy</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share this strategy</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
        </div>

        <TabsContent value="form" className="mt-0 border-0 p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strategy Form Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      AI Strategy Generator
                    </CardTitle>
                    <CardDescription>
                      Configure your investment profile and let our AI generate an optimal DeFi strategy.
                    </CardDescription>
                  </div>

                  <div className="flex-shrink-0">
                    <Select 
                      onValueChange={(value) => {
                        const template = profileTemplates.find(t => t.name === value);
                        if (template) applyTemplate(template);
                      }}
                    >
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue placeholder="Template profiles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom" disabled>Select a template</SelectItem>
                        {profileTemplates.map(template => (
                          <SelectItem key={template.name} value={template.name}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-3">
                {/* Risk Level Selection with Info */}
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
                  
                  <div className={`text-xs p-2 rounded-md mt-1 ${riskLevelInfo[userProfile.risk_level].color}`}>
                    <p className="font-medium">{riskLevelInfo[userProfile.risk_level].description}</p>
                    <div className="mt-1 flex flex-col xs:flex-row justify-between gap-x-2">
                      <p>Expected: {riskLevelInfo[userProfile.risk_level].expectedReturn}</p>
                      <p>Focus: {riskLevelInfo[userProfile.risk_level].protocolTypes}</p>
                    </div>
                  </div>
                </div>
                
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
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Short term</span>
                    <span>Medium term</span>
                    <span>Long term</span>
                  </div>
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
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowRightCircle className="mr-2 h-4 w-4" />
                      Generate Strategy
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Results Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Strategy Results
                    {response && (
                      <Badge variant="outline" className="ml-2 text-xs font-normal">
                        {userProfile.risk_level.toUpperCase()}
                      </Badge>
                    )}
                  </CardTitle>
                  {response && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => generateStrategy()}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
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
                    {/* Strategy Overview Tabs */}
                    <Tabs defaultValue="allocation" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="allocation">Allocation & Metrics</TabsTrigger>
                        <TabsTrigger value="simulation">Simulation</TabsTrigger>
                      </TabsList>
                      
                      {/* Combined Allocation and Metrics View */}
                      <TabsContent value="allocation" className="mt-4 space-y-4">
                        {/* Performance Metrics Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Annual ROI</p>
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3.5 w-3.5 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs w-56">Expected annual return based on simulation</p>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-200">
                              {formatPercent(annualReturn)}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3.5 w-3.5 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs w-56">Measures risk-adjusted return. Higher is better. Above 1.0 is good.</p>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-200">
                              {formatNumber(sharpeRatio)}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Risk Metric</p>
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3.5 w-3.5 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs w-56">Volatility as percentage of initial investment. Lower values indicate more stable returns.</p>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-200">
                              {formatPercent(riskMetric)}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Final Value</p>
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3.5 w-3.5 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs w-56">Expected median value at the end of time horizon</p>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-200">
                              {formatCurrency(response.simulation_summary.median_final_value)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Pie Chart */}
                          <div className="w-full md:w-1/2 h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={generatePieChartData()}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {generatePieChartData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatPercent(value as number)} />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Allocation Bars */}
                          <div className="w-full md:w-1/2 space-y-4">
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
                        
                        {/* Statistical Summary */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Statistical Summary</h4>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Mean Value:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-200">
                                {formatCurrency(response.simulation_summary.mean_final_value)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Profit Probability:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-200">
                                {response.simulation_summary.percentile_5th > userProfile.fund ? '95%+' : 
                                  response.simulation_summary.percentile_5th * 1.2 > userProfile.fund ? '~85%' : '~70%'}
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
                          </div>
                          
                          {/* Results Range Visualization */}
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
                        </div>
                        
                        {/* Investment Amount Summary */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Investment</p>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-200">
                              {formatCurrency(userProfile.fund * userProfile.max_exposure)}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Cash Reserve</p>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-200">
                              {formatCurrency(userProfile.fund * (1 - userProfile.max_exposure))}
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      {/* Simulation View */}
                      <TabsContent value="simulation" className="mt-4 space-y-4">
                        {/* Simulation Chart */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                          <Tabs defaultValue="area" className="w-full">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Projection Chart</h4>
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
                              <div className="h-80 sm:h-100">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsLineChart
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
                                    <Legend 
                                      verticalAlign="top" 
                                      height={36}
                                      iconSize={10}
                                      wrapperStyle={{ paddingBottom: 10 }}
                                      formatter={(value) => {
                                        return <span style={{ fontSize: '0.75rem', marginRight: '8px' }}>{value}</span>;
                                      }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="median" 
                                      name="Expected Value" 
                                      stroke="#3b82f6" 
                                      strokeWidth={2}
                                      dot={false}
                                      activeDot={{ r: 6 }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="low" 
                                      name="Worst Case (5%)" 
                                      stroke="#f97316" 
                                      strokeWidth={1.5}
                                      strokeDasharray="4 4"
                                      dot={false}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="high" 
                                      name="Best Case (95%)" 
                                      stroke="#22c55e" 
                                      strokeWidth={1.5}
                                      strokeDasharray="4 4"
                                      dot={false}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="initial" 
                                      name="Initial Investment" 
                                      stroke="#9ca3af" 
                                      strokeDasharray="3 3"
                                      dot={false}
                                    />
                                  </RechartsLineChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                        
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
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Annual ROI</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-200">
                              {formatPercent(annualReturn)}
                            </p>
                            <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                              {userProfile.time_horizon} months projection
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    {/* Strategy Name Input */}
                    {response && (
                      <div className="flex items-center gap-3 mt-4">
                        <Input
                          placeholder="Name your strategy"
                          value={strategyName}
                          onChange={(e) => setStrategyName(e.target.value)}
                          className="flex-grow"
                        />
                        <Button onClick={saveStrategy}>Save</Button>
                      </div>
                    )}
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
        </TabsContent>

        <TabsContent value="strategies" className="mt-0 border-0 p-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                My Saved Strategies
              </CardTitle>
              <CardDescription>
                View and compare your saved investment strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedStrategies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                  <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-200">No Saved Strategies</p>
                    <p className="text-gray-500">Generate and save strategies to compare them later.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedStrategies.map((strategy) => (
                    <div key={strategy.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-lg">{strategy.name}</h3>
                          <p className="text-sm text-gray-500">{strategy.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {strategy.userProfile.risk_level.toUpperCase()}
                          </Badge>
                          {strategy.response && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {formatPercent((strategy.response.simulation_summary.median_final_value - strategy.userProfile.fund) / strategy.userProfile.fund)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-sm">
                          <p className="text-gray-500">Initial Investment</p>
                          <p className="font-medium">{formatCurrency(strategy.userProfile.fund)}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-gray-500">Time Horizon</p>
                          <p className="font-medium">{strategy.userProfile.time_horizon} months</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-gray-500">Activities</p>
                          <p className="font-medium">{strategy.userProfile.preferred_activities.join(', ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setUserProfile(strategy.userProfile);
                            setResponse(strategy.response);
                            setActiveTab("form");
                          }}
                        >
                          Load
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-0 border-0 p-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Trading Insights & Signals
              </CardTitle>
              <CardDescription>
                AI-powered market analysis and trading opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trading Signals */}
              <div>
                <h3 className="text-lg font-medium mb-4">Market Signals</h3>
                <div className="space-y-3">
                  {TRADING_SIGNALS.map((signal) => (
                    <div key={signal.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      <div className={cn(
                        "flex-shrink-0 rounded-full p-2",
                        signal.action === "Buy" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                        signal.action === "Sell" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        {signal.action === "Buy" ? <TrendingUp className="h-5 w-5" /> : 
                         signal.action === "Sell" ? <TrendingUp className="h-5 w-5 transform rotate-180" /> :
                         <LineChart className="h-5 w-5" />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{signal.asset}</p>
                            <Badge variant="outline" className={cn(
                              signal.action === "Buy" ? "text-green-600" :
                              signal.action === "Sell" ? "text-red-600" :
                              "text-blue-600"
                            )}>
                              {signal.action}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{signal.price}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{signal.reason}</p>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <p>{signal.timestamp}</p>
                          <p>Confidence: {signal.confidence}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Trading Strategies */}
              <div>
                <h3 className="text-lg font-medium mb-4">AI Trading Strategies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STRATEGIES.map((strategy) => (
                    <div key={strategy.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{strategy.name}</h4>
                        <Badge variant={strategy.status === "active" ? "default" : "outline"}>
                          {strategy.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{strategy.description}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Risk Level</p>
                          <p className="font-medium">{strategy.risk}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Timeframe</p>
                          <p className="font-medium">{strategy.timeframe}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Performance</p>
                          <div className="flex items-center mt-1">
                            <Progress value={strategy.performance} className="h-1.5 flex-grow" />
                            <span className="ml-2 font-medium">{strategy.performance}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}