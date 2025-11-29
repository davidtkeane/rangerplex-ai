import { fetchWeatherApi } from 'openmeteo'; // Just for type safety if needed, though we use fetch mostly

export interface TestResult {
    success: boolean;
    status: number;
    latency: number;
    data: any;
    error?: string;
}

class ApiTestingService {

    // ==========================================
    // LLM Providers (OpenAI, Anthropic, etc.)
    // ==========================================
    async testLLM(
        provider: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'groq' | 'openrouter' | 'huggingface',
        apiKey: string,
        model: string = '',
        prompt: string = 'Hello, are you operational?'
    ): Promise<TestResult> {
        const start = Date.now();
        let url = '';
        let headers: any = { 'Content-Type': 'application/json' };
        let body: any = {};

        try {
            switch (provider) {
                case 'openai':
                    url = 'https://api.openai.com/v1/chat/completions';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = {
                        model: model || 'gpt-4.1',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 10
                    };
                    break;

                case 'anthropic':
                    // Use local proxy to avoid CORS
                    url = 'http://localhost:3010/v1/messages';
                    headers['x-api-key'] = apiKey;
                    headers['anthropic-version'] = '2023-06-01';
                    body = {
                        model: model || 'claude-3-haiku-20240307',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 10
                    };
                    break;

                case 'gemini':
                    const m = model || 'gemini-2.5-flash';
                    url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
                    body = {
                        contents: [{ parts: [{ text: prompt }] }]
                    };
                    break;

                case 'deepseek':
                    url = 'https://api.deepseek.com/chat/completions';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = {
                        model: model || 'deepseek-chat',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 10
                    };
                    break;

                case 'groq':
                    url = 'https://api.groq.com/openai/v1/chat/completions';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = {
                        model: model || 'llama-3.1-8b-instant',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 10
                    };
                    break;

                case 'openrouter':
                    url = 'https://openrouter.ai/api/v1/chat/completions';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = {
                        model: model || 'openai/gpt-4.1',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 10
                    };
                    break;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            const latency = Date.now() - start;
            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = { text: await response.text() };
            }

            return {
                success: response.ok,
                status: response.status,
                latency,
                data
            };

        } catch (error: any) {
            return {
                success: false,
                status: 0,
                latency: Date.now() - start,
                data: null,
                error: error.message || 'Network Error (CORS or Offline)'
            };
        }
    }

    // ==========================================
    // Local LLMs (Ollama, LM Studio)
    // ==========================================
    async testLocalLLM(
        type: 'ollama' | 'lmstudio',
        baseUrl: string
    ): Promise<TestResult> {
        const start = Date.now();
        let url = '';

        try {
            // Normalize URL
            let cleanUrl = baseUrl.replace(/\/$/, '');

            if (type === 'ollama') {
                url = `${cleanUrl}/api/tags`; // List models
            } else {
                url = `${cleanUrl}/v1/models`; // LM Studio (OpenAI compatible)
            }

            const response = await fetch(url);
            const latency = Date.now() - start;
            const data = await response.json();

            return {
                success: response.ok,
                status: response.status,
                latency,
                data
            };

        } catch (error: any) {
            return {
                success: false,
                status: 0,
                latency: Date.now() - start,
                data: null,
                error: error.message || 'Connection Refused'
            };
        }
    }

    // ==========================================
    // Search Providers
    // ==========================================
    async testSearch(
        provider: 'google' | 'bing' | 'tavily',
        apiKey: string,
        query: string = 'RangerPlex AI'
    ): Promise<TestResult> {
        const start = Date.now();
        let url = '';
        let headers: any = {};

        try {
            if (provider === 'google') {
                // Requires Search Engine ID (CX) which is usually passed in settings too...
                // For this simple test service, we might need to assume the user knows the format or we just test the API key validity if possible.
                // Google Custom Search requires key + cx. 
                // If we only have key, we can't fully test without CX. 
                // We'll assume the user might have put CX in a separate field, but here we only have one key arg.
                // Let's return a specific message for Google if we can't test fully.
                return {
                    success: false,
                    status: 0,
                    latency: 0,
                    data: { message: "Google Search requires both API Key and Search Engine ID (CX). Please use the main chat to test." },
                    error: "Configuration incomplete for simple test"
                };
            }
            else if (provider === 'bing') {
                url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`;
                headers['Ocp-Apim-Subscription-Key'] = apiKey;
            }
            else if (provider === 'tavily') {
                url = 'https://api.tavily.com/search';
                headers['Content-Type'] = 'application/json';
                const body = {
                    api_key: apiKey,
                    query: query,
                    search_depth: "basic"
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });

                const latency = Date.now() - start;
                const data = await response.json();
                return {
                    success: response.ok,
                    status: response.status,
                    latency,
                    data
                };
            }

            if (url) {
                const response = await fetch(url, { headers });
                const latency = Date.now() - start;
                const data = await response.json();
                return {
                    success: response.ok,
                    status: response.status,
                    latency,
                    data
                };
            }

            return { success: false, status: 0, latency: 0, data: null, error: 'Unknown Provider' };

        } catch (error: any) {
            return {
                success: false,
                status: 0,
                latency: Date.now() - start,
                data: null,
                error: error.message
            };
        }
    }
}

export const apiTestingService = new ApiTestingService();
