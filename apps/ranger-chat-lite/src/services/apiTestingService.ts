
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
        provider: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'groq' | 'openrouter' | 'huggingface' | 'perplexity',
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
                    // Direct API call since we are in Electron/Client-side app (might need proxy if browser enforces CORS strictly, 
                    // but Electron usually allows cross-origin if configured or main process handles it. 
                    // For now assuming direct or through local proxy if available. 
                    // In Lite, we might prefer direct if possible, or use a user-provided proxy.)
                    url = 'https://api.anthropic.com/v1/messages';
                    headers['x-api-key'] = apiKey;
                    headers['anthropic-version'] = '2023-06-01';
                    headers['dangerously-allow-browser'] = 'true'; // Often needed for client-side Anthropic calls
                    body = {
                        model: model || 'claude-3-haiku-20240307',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 10
                    };
                    break;

                case 'gemini':
                    const m = model || 'gemini-1.5-flash';
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

                case 'perplexity':
                    url = 'https://api.perplexity.ai/chat/completions';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = {
                        model: model || 'sonar-reasoning-pro',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 50
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

            // Clone response before reading to avoid "body stream already read" error
            const responseText = await response.text();
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = { text: responseText };
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

    async chatLocalLLM(
        type: 'ollama' | 'lmstudio',
        baseUrl: string,
        model: string,
        prompt: string
    ): Promise<string> {
        // Normalize URL
        let cleanUrl = baseUrl.replace(/\/$/, '');
        let url = '';
        let body: any = {};

        if (type === 'ollama') {
            url = `${cleanUrl}/api/generate`;
            body = {
                model: model,
                prompt: prompt,
                stream: false
            };
        } else {
            // LM Studio (OpenAI compatible)
            url = `${cleanUrl}/v1/chat/completions`;
            body = {
                model: model,
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant.' },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                stream: false
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Model '${model}' not found. Check available models with /ai status.`);
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (type === 'ollama') {
                return data.response;
            } else {
                return data.choices[0]?.message?.content || 'No response';
            }
        } catch (error: any) {
            console.error('Local LLM Error:', error);
            return `Error: ${error.message}`;
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
