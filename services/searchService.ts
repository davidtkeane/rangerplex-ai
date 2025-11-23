
import { GroundingSource } from "../types";

interface BraveSearchResponse {
    web: {
        results: {
            title: string;
            url: string;
            description: string;
        }[];
    }
}

export const searchWeb = async (query: string, apiKey: string, proxyUrl?: string, useDDG?: boolean): Promise<{ textContext: string, sources: GroundingSource[] }> => {
    
    // 1. Try Brave Search first if Key exists
    if (apiKey) {
        try {
            // Prefer proxy (to avoid browser CORS) if provided
            const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : undefined;
            const braveUrl = baseUrl
                ? `${baseUrl}/v1/brave?q=${encodeURIComponent(query)}&count=5`
                : `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;

            const response = await fetch(braveUrl, {
                headers: {
                    'Accept': 'application/json',
                    'X-Subscription-Token': apiKey
                }
            });

            if (!response.ok) throw new Error(`Brave Search Error: ${response.statusText}`);

            const data: BraveSearchResponse = await response.json();
            if (!data.web || !data.web.results) return { textContext: "", sources: [] };

            const sources: GroundingSource[] = data.web.results.map(r => ({ title: r.title, uri: r.url }));
            const textContext = data.web.results.map(r => `[Source: ${r.title}](${r.url})\nSnippet: ${r.description}`).join('\n\n');
            return { textContext, sources };
        } catch (error) {
            console.error("Brave Search failed:", error);
            // Fall through to DDG if enabled
        }
    }

    // 2. Fallback to DuckDuckGo (via Proxy) if enabled
    if (useDDG && proxyUrl) {
        try {
            // Remove trailing slash from proxyUrl if present
            const baseUrl = proxyUrl.replace(/\/$/, '');
            const response = await fetch(`${baseUrl}/v1/ddg?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("DDG Proxy Error");
            
            const data = await response.json();
            if (!data.results) return { textContext: "", sources: [] };

            const sources: GroundingSource[] = data.results.map((r: any) => ({ title: r.title, uri: r.link }));
            const textContext = data.results.map((r: any) => `[Source: ${r.title}](${r.link})\nSnippet: ${r.snippet}`).join('\n\n');
            return { textContext, sources };
        } catch (error) {
             console.error("DuckDuckGo Search failed:", error);
        }
    }

    return { textContext: "", sources: [] };
};
