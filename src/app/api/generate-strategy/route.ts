import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
// Import statistics functions - use require since types are missing
const ss = require('simple-statistics');

// Define the expected input structure from your frontend
interface UserProfileInput {
  fund: number;
  max_exposure: number;
  risk_level: "low" | "medium" | "high";
  time_horizon: number; // months
  kill_switch: number; // e.g., -0.1 for -10%
  investment_goals: string[]; // e.g., ["capital_appreciation", "passive_income"]
  preferred_activities: string[]; // e.g., ["lending", "staking", "yield_farming", "trading"]
}

// Define the expected structure of the strategy part of the AI response
interface StrategyAllocation {
    protocol: string;
    weight_pct: number; // e.g., 0.45 for 45%
}
interface Strategy {
    trend_ma_fast?: number; // Optional for now
    trend_ma_slow?: number; // Optional for now
    allocations: StrategyAllocation[];
}

// Define the structure for the final response (including simulation later)
interface StrategyApiResponse {
    strategy: Strategy | null;
    simulation_summary: any; // Define simulation summary structure later
    error?: string;
    details?: string;
}

// --- DefiLlama Interfaces ---
interface DefiLlamaPool {
    pool: string; // Unique ID
    chain: string;
    project: string; // Slug, e.g., "aave-v3"
    symbol: string;
    tvlUsd: number;
    apy: number;
    apyBase?: number; // APY from base interest/fees
    apyReward?: number; // APY from reward tokens
    // ... other fields available
}

interface MarketParameters {
    [protocolSlug: string]: {
        daily_return_mean: number;
        daily_return_stddev: number;
        sourceApy: number; // Store the APY used
    };
}

// Define Simulation Summary structure
interface SimulationSummary {
    mean_final_value: number;
    median_final_value: number;
    std_dev_final_value: number;
    percentile_5th: number;
    percentile_95th: number;
    num_simulations: number;
}

// Function to safely parse JSON from AI response (similar to process_json.py)
function extractJsonFromMarkdown(text: string): Strategy | null {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
        try {
            // Attempt to clean potential markdown/escaping issues if direct parse fails
             const cleanedJson = match[1].replace(/\\`/g, '`').replace(/\\"/g, '"');
            return JSON.parse(cleanedJson) as Strategy;
        } catch (e) {
            console.error("Failed to parse JSON from markdown block:", e);
             try {
                 // Fallback: try parsing the raw matched content directly
                 return JSON.parse(match[1]) as Strategy;
             } catch (e2) {
                 console.error("Failed fallback parsing JSON from markdown block:", e2);
                 return null;
             }
        }
    }
    // Try parsing the whole text directly if no markdown block found
    try {
        return JSON.parse(text) as Strategy;
    } catch (e) {
        // Ignore if direct parsing fails silently
    }
    return null;
}

// Box-Muller transform to generate standard normal random numbers (mean 0, stddev 1)
// We generate two at a time, but only use one per call for simplicity here.
// A more optimized version could cache the second value.
function boxMullerRandomNormal(): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Prevent log(0)
    while(v === 0) v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log(u) ) * Math.cos( 2.0 * Math.PI * v );
    // z is approximately normally distributed (mean 0, stddev 1)
    return z;
}

// --- Monte Carlo Simulation Function ---
function runMonteCarloSimulation(
    userProfile: UserProfileInput,
    validAllocations: StrategyAllocation[], // Only allocations with market data
    marketParams: MarketParameters,
    numSimulations: number = 1000 // Default to 1000 simulations
): SimulationSummary {

    const initialFund = userProfile.fund;
    const timeHorizonMonths = userProfile.time_horizon;
    const killSwitchThreshold = userProfile.kill_switch; // e.g., -0.1
    const riskLevel = userProfile.risk_level; // Get risk level from profile
    const numDays = Math.max(1, Math.round(timeHorizonMonths * 30.44)); // Avg days/month

    const finalValues: number[] = [];
    let killSwitchTriggerCount = 0;

    // Calculate the total weight of valid allocations being simulated
    const weightSumValid = validAllocations.reduce((sum, alloc) => sum + alloc.weight_pct, 0);
    const effectiveInitialInvested = initialFund * weightSumValid;
    const cashAmount = initialFund * (1 - weightSumValid);

    // --- Define risk scaling factors ---
    let volatility_scale: number;
    let overall_mean_return_scale: number;

    switch (riskLevel) {
        case 'low':
            volatility_scale = 0.6;
            overall_mean_return_scale = 0.8; // Less reduction for low risk
            break;
        case 'high':
            volatility_scale = 1.8;
            overall_mean_return_scale = 1.0; // No reduction for high risk (matching python example)
            break;
        case 'medium':
        default:
            volatility_scale = 1.0;
            overall_mean_return_scale = 0.8; // Default to medium scale
            break;
    }
    console.log(`Risk Level: ${riskLevel}, Vol Scale: ${volatility_scale}, Mean Scale: ${overall_mean_return_scale}`);
    // --- End risk scaling factors ---


    console.log(`Starting simulation: ${numSimulations} paths, ${numDays} days, Initial Invested: ${effectiveInitialInvested.toFixed(2)}, Cash: ${cashAmount.toFixed(2)}`);

    for (let i = 0; i < numSimulations; i++) {
        let currentInvestedValue = effectiveInitialInvested;
        let hitKillSwitch = false;

        for (let day = 0; day < numDays; day++) {
            let dailyWeightedReturn = 0;

            // Calculate return for each asset in the valid portfolio part
            for (const allocation of validAllocations) {
                const protocolSlug = allocation.protocol.toLowerCase().replace(/\s+/g, '-').replace(/[.:]/g, '');
                const params = marketParams[protocolSlug];

                if (params) {
                    // --- Apply risk scaling to individual asset parameters ---
                    // Note: The prototyping bias is still applied *before* this scaling in the market data step.
                    const scaled_mean = params.daily_return_mean * overall_mean_return_scale;
                    // Scale stddev, not variance. Ensure non-negative.
                    const scaled_stddev = Math.max(0, params.daily_return_stddev * volatility_scale);
                    // --- End risk scaling ---


                    // Generate random daily return based on SCALED mean and stddev
                    const randomNormal = boxMullerRandomNormal(); // Mean 0, StdDev 1
                    const dailyReturn = scaled_mean + scaled_stddev * randomNormal;

                    const weightWithinInvested = weightSumValid > 0 ? allocation.weight_pct / weightSumValid : 0;
                    dailyWeightedReturn += dailyReturn * weightWithinInvested;
                }
            }

            currentInvestedValue *= (1 + dailyWeightedReturn);

            const totalPortfolioValue = currentInvestedValue + cashAmount;
            if ((totalPortfolioValue / initialFund) - 1 <= killSwitchThreshold) {
                killSwitchTriggerCount++;
                hitKillSwitch = true;
                break;
            }
        } // End daily loop

        const finalTotalValue = currentInvestedValue + cashAmount;
        finalValues.push(finalTotalValue);

        if ((i + 1) % (numSimulations / 10) === 0) {
             console.log(`Simulation progress: ${i + 1}/${numSimulations}`);
        }

    } // End simulation loop

    // --- Analyze Results ---
    // Ensure we have results before calculating stats
    if (finalValues.length === 0) {
        console.error("Monte Carlo simulation produced no results.");
        // Return a default/error structure?
        return {
            mean_final_value: initialFund, median_final_value: initialFund, std_dev_final_value: 0,
            percentile_5th: initialFund, percentile_95th: initialFund, num_simulations: 0,
        };
    }

    // Sort values for median and percentiles
    finalValues.sort((a, b) => a - b);

    const mean = ss.mean(finalValues);
    const median = ss.medianSorted(finalValues); // Use sorted version
    const stdDev = ss.standardDeviation(finalValues);
    const p5 = ss.quantileSorted(finalValues, 0.05); // Use sorted version
    const p95 = ss.quantileSorted(finalValues, 0.95);
    const killSwitchPct = (killSwitchTriggerCount / numSimulations) * 100;

    console.log(`Simulation complete. Mean: ${mean.toFixed(2)}, Median: ${median.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}, P5: ${p5.toFixed(2)}, P95: ${p95.toFixed(2)}, Kill Switch: ${killSwitchPct.toFixed(1)}%`);

    return {
        mean_final_value: mean,
        median_final_value: median,
        std_dev_final_value: stdDev,
        percentile_5th: p5,
        percentile_95th: p95,
        num_simulations: numSimulations,
    };
}

export async function POST(req: NextRequest): Promise<NextResponse<StrategyApiResponse | { error: string, details?: string }>> {
  try {
    let userProfile: UserProfileInput;
    try {
      userProfile = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // --- 1. Get Gemini API Key & Generate Strategy ---
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY environment variable is not set.');
        return NextResponse.json({ error: 'Internal configuration error: Missing API Key' }, { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" }); // default gemini-2.5-pro-preview-03-25

    const prompt = `
      Analyze the following user profile for DeFi investments:
      - Initial Fund: ${userProfile.fund} USD
      - Max Exposure: ${userProfile.max_exposure * 100}%
      - Risk Level: ${userProfile.risk_level}
      - Time Horizon: ${userProfile.time_horizon} months
      - Kill Switch Threshold: ${userProfile.kill_switch * 100}% loss
      - Investment Goals: ${userProfile.investment_goals.join(', ')}
      - Preferred Activities: ${userProfile.preferred_activities.join(', ')}

      Based on this profile, generate a suitable DeFi investment strategy.
      Focus on the 'Preferred Activities'. If 'lending' or 'staking' are preferred,
      suggest established protocols like Aave, Compound, Lido, Rocket Pool etc.
      If 'yield_farming' or 'trading' are mentioned, consider protocols known for those activities,
      but maintain diversification according to the risk level.

      Output ONLY the strategy as a JSON object within a markdown code block (like \`\`\`json ... \`\`\`).
      The JSON object MUST have the following structure:
      {
        "allocations": [
          { "protocol": "ProtocolName1", "weight_pct": percentage1_decimal },
          { "protocol": "ProtocolName2", "weight_pct": percentage2_decimal }
        ]
      }
      Ensure the sum of 'weight_pct' values equals the 'max_exposure' (${userProfile.max_exposure}).
      Use decimals for percentages (e.g., 0.45 for 45%).
      Do NOT include any other text, explanation, or preamble outside the JSON markdown block.
    `;

    let strategy: Strategy | null = null;
    let aiResponseText: string = '';
    try {
        const generationConfig = {
            temperature: 0.3, // Adjust for creativity vs determinism
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            // responseMimeType: "application/json", // Consider enabling if reliable
        };
        const safetySettings = [ // Configure safety settings as needed
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

        console.log("Generating strategy with Gemini...");
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
          safetySettings,
        });

        const response = result.response;
        aiResponseText = response.text();
        console.log("Received AI response:", aiResponseText);

        strategy = extractJsonFromMarkdown(aiResponseText);

        if (!strategy || !strategy.allocations || !Array.isArray(strategy.allocations) || strategy.allocations.length === 0) {
             console.error("Failed validation after parsing strategy from AI model response:", strategy);
            return NextResponse.json({
                error: "Failed to decode a valid strategy structure from AI model",
                details: `Received: ${aiResponseText}`
            }, { status: 500 });
        }

        // Validate structure further
         for(const alloc of strategy.allocations) {
             if (typeof alloc.protocol !== 'string' || typeof alloc.weight_pct !== 'number') {
                 console.error("Invalid allocation structure:", alloc);
                 return NextResponse.json({ error: "Invalid allocation structure in AI response", details: JSON.stringify(strategy)}, { status: 500 });
             }
         }

        // Validate sum of weights
        const totalWeight = strategy.allocations.reduce((sum, alloc) => sum + (alloc.weight_pct || 0), 0);
        if (Math.abs(totalWeight - userProfile.max_exposure) > 0.01) { // Allow 1% tolerance
             console.warn(`Strategy weights (${totalWeight}) sum differs significantly from max exposure (${userProfile.max_exposure}). AI Response: ${aiResponseText}`);
             // Potentially normalize weights or return warning/error? For now, just warn.
             // strategy.allocations = strategy.allocations.map(a => ({...a, weight_pct: a.weight_pct * (userProfile.max_exposure / totalWeight)}));
        }
        console.log("Successfully parsed strategy:", strategy);

    } catch (error: any) {
        console.error("Error calling or processing Gemini API:", error);
        const errorMessage = error.message || 'Unknown error during AI strategy generation';
        // Check for specific Gemini errors (e.g., billing, quota) if possible from the error structure
        return NextResponse.json({ error: `AI API Error: ${errorMessage}`, details: aiResponseText || error.toString() }, { status: 500 });
    }
    // --- END Gemini Section ---


    // --- 6. Fetch Market Data ---
    let marketParams: MarketParameters = {};
    const protocolsNotFound: string[] = [];
    try {
        console.log("Fetching market data from DefiLlama...");
        const poolsResponse = await fetch('https://yields.llama.fi/pools', { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (!poolsResponse.ok) {
             const errorText = await poolsResponse.text();
            throw new Error(`DefiLlama API error: ${poolsResponse.status} ${poolsResponse.statusText}. Body: ${errorText}`);
        }
        const poolsData: { data: DefiLlamaPool[] } = await poolsResponse.json();

        if (!poolsData || !poolsData.data || !Array.isArray(poolsData.data)) {
            throw new Error("Invalid data format received from DefiLlama pools API.");
        }

        console.log(`Fetched ${poolsData.data.length} pools from DefiLlama.`);

        // Create a map for faster lookup
        const projectPoolMap = new Map<string, DefiLlamaPool[]>();
        for (const pool of poolsData.data) {
            if (!projectPoolMap.has(pool.project)) {
                projectPoolMap.set(pool.project, []);
            }
            projectPoolMap.get(pool.project)?.push(pool);
        }

        // Process data to find parameters for allocated protocols
        for (const allocation of strategy.allocations) {
            const protocolName = allocation.protocol;
            // Simple slug conversion - this is a weak point, might need a better mapping
            const protocolSlug = protocolName.toLowerCase().replace(/\s+/g, '-').replace(/[.:]/g, ''); // Remove dots/colons too

            let chosenPool: DefiLlamaPool | null = null;

            const poolsForProject = projectPoolMap.get(protocolSlug);

            if (poolsForProject && poolsForProject.length > 0) {
                // Try finding stablecoin pools first if lending/low risk, otherwise highest TVL on major chains
                let filteredPools = poolsForProject;
                const majorChains = ["Ethereum", "Arbitrum", "Optimism", "Polygon", "Base"];
                if (userProfile.risk_level === 'low' || userProfile.preferred_activities.includes('lending')) {
                   const stablePools = filteredPools.filter(p => p.symbol.match(/(USD|DAI|EUR)/i) && majorChains.includes(p.chain));
                   if (stablePools.length > 0) {
                       filteredPools = stablePools;
                   }
                }

                // Sort remaining candidates by TVL desc
                filteredPools.sort((a, b) => b.tvlUsd - a.tvlUsd);

                // Prioritize major chains
                 chosenPool = filteredPools.find(p => majorChains.includes(p.chain)) || filteredPools[0] || null;

            }


            if (chosenPool && typeof chosenPool.apy === 'number') {
                const annualApy = chosenPool.apy / 100; // Convert percentage to decimal

                // Clamp APY to reasonable bounds (-50% to +500%) to avoid extreme simulation results
                const clampedApy = Math.max(-0.5, Math.min(annualApy, 5.0));

                // --- Estimate daily parameters ---
                const base_daily_return_mean = Math.pow(1 + clampedApy, 1 / 365) - 1;
                const daily_return_bias = 0.000611; // Approx +25% annualized bias for prototyping
                const daily_return_mean = base_daily_return_mean + daily_return_bias;

                // --- Placeholder Volatility ---
                // This needs significant improvement - ideally using historical data or better heuristics
                let annual_volatility: number;
                const symbolLower = chosenPool.symbol.toLowerCase();
                const isStable = symbolLower.includes('usd') || symbolLower.includes('dai') || symbolLower.includes('eur');

                if (isStable || protocolSlug.includes('lending') || protocolSlug.includes('aave') || protocolSlug.includes('compound')) {
                    annual_volatility = 0.05; // Very low for stable/lending
                } else if (protocolSlug.includes('staking') || protocolSlug.includes('lido') || protocolSlug.includes('rocket-pool') || symbolLower.includes('eth')) {
                     annual_volatility = 0.40; // Moderate vol for LSTs/ETH staking
                } else if (protocolSlug.includes('yield-farming') || protocolSlug.includes('convex') || protocolSlug.includes('curve')) {
                    annual_volatility = 0.75; // High vol for yield farming
                } else {
                    annual_volatility = 0.60; // Default high-ish vol
                }
                const daily_return_stddev = annual_volatility / Math.sqrt(365);

                 // Ensure stddev is not zero or negative if volatility is somehow zero
                 const safe_daily_stddev = Math.max(daily_return_stddev, 1e-6); // Prevent zero std dev


                marketParams[protocolSlug] = {
                    daily_return_mean: daily_return_mean,
                    daily_return_stddev: safe_daily_stddev,
                    sourceApy: chosenPool.apy,
                };
                console.log(`Found params for ${protocolSlug} (Pool: ${chosenPool.symbol}, Chain: ${chosenPool.chain}): Mean=${daily_return_mean.toFixed(6)}, StdDev=${safe_daily_stddev.toFixed(6)} (from APY ${chosenPool.apy.toFixed(2)}%)`);
            } else {
                console.warn(`Could not find suitable pool or APY for protocol: ${protocolName} (slug: ${protocolSlug})`);
                protocolsNotFound.push(protocolName);
                // Simulation needs to handle missing protocols
            }
        }

        // Check if we found parameters for *any* protocol
        if (Object.keys(marketParams).length === 0 && strategy.allocations.length > 0) {
            throw new Error(`Could not find market data for any of the allocated protocols: ${strategy.allocations.map(a => a.protocol).join(', ')}`);
        }


    } catch (error: any) {
        console.error("Error fetching or processing market data:", error);
        return NextResponse.json({ error: `Failed to get market data: ${error.message}`, details: protocolsNotFound.length > 0 ? `Protocols not found: ${protocolsNotFound.join(', ')}` : undefined }, { status: 500 });
    }
    // --- END Market Data Section ---


    // --- 7. Run Portfolio Simulation ---
    console.log("Running portfolio simulation...");
    // Pass userProfile directly (which contains risk_level)
    const simulationSummary: SimulationSummary = runMonteCarloSimulation(
        userProfile, // Pass the whole profile
        strategy.allocations, // Corrected: Pass only allocations with market data
        marketParams
    );


    // --- 8. Return Result ---
    console.log("API request processed successfully.");
    return NextResponse.json({ strategy, simulation_summary: simulationSummary }, { status: 200 });

  } catch (error: unknown) {
    console.error('Unhandled error in Next.js API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}

// Optional: Add GET or other methods if needed, otherwise POST is the default export 
// Optional: Add GET or other methods if needed, otherwise POST is the default export 