import React, { useState } from 'react';
import { apiTestingService, TestResult } from '../../services/apiTestingService';

interface ApiTesterProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName: string;
    testType: 'llm' | 'search' | 'connection';
    apiKey?: string;
    baseUrl?: string;
    provider?: string; // e.g. 'openai', 'ollama'
    defaultModel?: string;
}

export const ApiTester: React.FC<ApiTesterProps> = ({
    isOpen,
    onClose,
    serviceName,
    testType,
    apiKey = '',
    baseUrl = '',
    provider = '',
    defaultModel = ''
}) => {
    const [input1, setInput1] = useState(testType === 'llm' ? (defaultModel || '') : (testType === 'search' ? 'RangerPlex AI' : baseUrl));
    const [input2, setInput2] = useState(testType === 'llm' ? 'Hello, are you operational?' : ''); // Prompt
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);

    if (!isOpen) return null;

    const runTest = async () => {
        setLoading(true);
        setResult(null);
        try {
            let res: TestResult;

            if (testType === 'llm') {
                // Input1 = Model, Input2 = Prompt
                res = await apiTestingService.testLLM(provider as any, apiKey, input1, input2);
            } else if (testType === 'search') {
                // Input1 = Query
                res = await apiTestingService.testSearch(provider as any, apiKey, input1);
            } else {
                // Connection (Local LLM)
                // Input1 = Base URL
                res = await apiTestingService.testLocalLLM(provider as any, input1);
            }

            setResult(res);
        } catch (error: any) {
            setResult({ success: false, status: 0, latency: 0, data: null, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const getLabels = () => {
        if (testType === 'llm') return { l1: 'Model Name (Optional)', l2: 'Test Prompt' };
        if (testType === 'search') return { l1: 'Search Query', l2: '' };
        return { l1: 'Base URL', l2: '' };
    };

    const labels = getLabels();

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center bg-gray-50 dark:bg-zinc-800">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <i className="fa-solid fa-microscope text-purple-500"></i>
                        Advanced Tester: {serviceName}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6 space-y-4">

                        {/* Input 1 */}
                        <div>
                            <label className="block text-xs font-bold mb-1 opacity-70">{labels.l1}</label>
                            <input
                                type="text"
                                value={input1}
                                onChange={(e) => setInput1(e.target.value)}
                                className="w-full px-4 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        {/* Input 2 (Prompt) - Only for LLM */}
                        {testType === 'llm' && (
                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70">{labels.l2}</label>
                                <textarea
                                    value={input2}
                                    onChange={(e) => setInput2(e.target.value)}
                                    className="w-full px-4 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                                />
                            </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex justify-end">
                            <button
                                onClick={runTest}
                                disabled={loading}
                                className={`px-6 py-2 rounded font-bold text-white transition-all flex items-center gap-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-500/20'}`}
                            >
                                {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-bolt"></i>}
                                Run Connection Test
                            </button>
                        </div>

                        {/* API Key Preview */}
                        {apiKey && (
                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70">Using API Key</label>
                                <div className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-700 truncate opacity-70">
                                    {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 4)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="animate-fade-in">
                            <div className={`p-4 rounded-lg mb-4 border ${result.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 font-bold">
                                        {result.success ? <i className="fa-solid fa-check-circle text-green-500"></i> : <i className="fa-solid fa-circle-exclamation text-red-500"></i>}
                                        <span>Status: {result.status} {result.success ? 'OK' : 'Error'}</span>
                                    </div>
                                    <div className="text-xs font-mono opacity-70">
                                        Latency: {result.latency}ms
                                    </div>
                                </div>
                                {result.error && (
                                    <div className="text-red-500 text-sm font-mono mt-2">
                                        Error: {result.error}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-1 opacity-70">Raw Response</label>
                                <div className="relative">
                                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[300px] border border-gray-700 shadow-inner">
                                        {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(JSON.stringify(result.data, null, 2))}
                                        className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                        title="Copy JSON"
                                    >
                                        <i className="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
