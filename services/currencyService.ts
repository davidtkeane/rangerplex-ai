
import { Currency } from "../types";

// Approximate pricing per 1M tokens (Input / Output) as of early 2025
const PRICING_MAP: Record<string, { input: number, output: number }> = {
    // OpenAI (token costs to be confirmed for the newest models; NaN prevents cost display)
    'gpt-5.1': { input: NaN, output: NaN },
    'gpt-5': { input: NaN, output: NaN },
    'gpt-5-mini': { input: NaN, output: NaN },
    'gpt-5-nano': { input: NaN, output: NaN },
    'gpt-5-pro': { input: NaN, output: NaN },
    'gpt-5.1-codex': { input: NaN, output: NaN },
    'gpt-5-codex': { input: NaN, output: NaN },
    'gpt-5.1-codex-mini': { input: NaN, output: NaN },
    'gpt-4.1': { input: 5.00, output: 15.00 },
    'gpt-4.1-mini': { input: 0.15, output: 0.60 },
    'gpt-4.1-nano': { input: NaN, output: NaN },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o-search-preview': { input: NaN, output: NaN },
    'gpt-4o-mini-search-preview': { input: NaN, output: NaN },
    'chatgpt-4o-latest': { input: NaN, output: NaN },
    'o1': { input: 15.00, output: 60.00 },
    'o1-mini': { input: 3.00, output: 12.00 },
    'o1-pro': { input: NaN, output: NaN },
    'o3': { input: NaN, output: NaN },
    'o3-mini': { input: NaN, output: NaN },
    'o3-pro': { input: NaN, output: NaN },
    'o3-deep-research': { input: NaN, output: NaN },
    'o4-mini': { input: NaN, output: NaN },
    'o4-mini-deep-research': { input: NaN, output: NaN },
    
    // Anthropic
    'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
    'claude-sonnet-4': { input: 3.00, output: 15.00 }, // broader match for 4.x Sonnet
    'claude-3-7-sonnet': { input: 2.80, output: 14.00 }, // approx for 3.7 Sonnet
    'claude-opus-4': { input: 15.00, output: 75.00 },
    'claude-haiku-4': { input: 0.80, output: 4.00 },
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku': { input: 0.80, output: 4.00 },
    'claude-3-opus': { input: 15.00, output: 75.00 },

    // Gemini (Free tier exists, but calculating paid rates for reference)
    'gemini-3-pro': { input: 3.50, output: 10.50 }, // Approx, align to 3.x tier
    'gemini-2.5-pro': { input: 2.00, output: 8.00 }, // Approx
    'gemini-2.5-flash': { input: 0.15, output: 0.60 }, // Approx, similar to 4o-mini class
    'gemini-2.5-flash-lite': { input: 0.08, output: 0.30 }, // Approx
    'gemini-2.0-flash-thinking-exp-01-21': { input: 0.20, output: 0.80 }, // Experimental; rough
    'gemini-2.0-flash': { input: 0.10, output: 0.40 }, // Estimated
    'gemini-1.5-pro': { input: 1.25, output: 5.00 }, // Under 128k context
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },

    // Perplexity
    'sonar': { input: 1.00, output: 1.00 }, // Simplification
    'sonar-pro': { input: 3.00, output: 15.00 }
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
};

// Mock Exchange Rates (Base USD)
// In a real app, we would fetch this from an API
const EXCHANGE_RATES: Record<Currency, number> = {
    'USD': 1.0,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 150.5,
    'CNY': 7.20,
    'CAD': 1.35,
    'AUD': 1.52
};

export const calculateCost = (
    model: string, 
    inputTokens: number, 
    outputTokens: number,
    targetCurrency: Currency = 'USD'
): string => {
    // Find matching pricing or default to zero (Local LLMs)
    const pricing = Object.entries(PRICING_MAP).find(([key]) => model.includes(key))?.[1];
    
    if (!pricing || !isFinite(pricing.input) || !isFinite(pricing.output)) return ""; // Free/unknown pricing

    const costUSD = (inputTokens / 1_000_000 * pricing.input) + (outputTokens / 1_000_000 * pricing.output);
    const rate = EXCHANGE_RATES[targetCurrency] || 1;
    const finalCost = costUSD * rate;
    const symbol = CURRENCY_SYMBOLS[targetCurrency];

    if (finalCost < 0.0001) return `< ${symbol}0.0001`;
    
    // High precision for small numbers
    return `${symbol}${finalCost.toFixed(4)}`;
};
