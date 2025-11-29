import React, { useState } from 'react';
import { weatherService } from '../../services/weatherService';

interface WeatherTesterProps {
    isOpen: boolean;
    onClose: () => void;
    provider: 'openweather' | 'tomorrow' | 'visualcrossing' | 'openmeteo';
    apiKey: string;
    defaultLocation?: string;
}

export const WeatherTester: React.FC<WeatherTesterProps> = ({ isOpen, onClose, provider, apiKey, defaultLocation = 'Dublin,IE' }) => {
    const [location, setLocation] = useState(defaultLocation);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    if (!isOpen) return null;

    const runTest = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await weatherService.testApiConnection(provider, apiKey, location);
            setResult(res);
        } catch (error) {
            setResult({ success: false, error: 'Test failed unexpectedly' });
        } finally {
            setLoading(false);
        }
    };

    const getProviderName = (p: string) => {
        switch (p) {
            case 'openweather': return 'OpenWeatherMap';
            case 'tomorrow': return 'Tomorrow.io';
            case 'visualcrossing': return 'Visual Crossing';
            case 'openmeteo': return 'Open-Meteo';
            default: return p;
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center bg-gray-50 dark:bg-zinc-800">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <i className="fa-solid fa-microscope text-blue-500"></i>
                        Advanced API Tester: {getProviderName(provider)}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold mb-1 opacity-70">Test Location</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="flex-1 px-4 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="City, Country or Lat,Lon"
                                />
                                <button
                                    onClick={runTest}
                                    disabled={loading}
                                    className={`px-6 py-2 rounded font-bold text-white transition-all flex items-center gap-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/20'}`}
                                >
                                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-play"></i>}
                                    Run Test
                                </button>
                            </div>
                            <p className="text-xs opacity-50 mt-1">
                                {provider === 'tomorrow' ? 'Note: Tomorrow.io works best with Lat,Lon (e.g. 53.34,-6.26)' : 'Enter City, Country Code (e.g. London,UK)'}
                            </p>
                        </div>

                        {/* API Key Preview */}
                        <div>
                            <label className="block text-xs font-bold mb-1 opacity-70">Using API Key</label>
                            <div className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-700 truncate opacity-70">
                                {apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : '(No Key Provided)'}
                            </div>
                        </div>
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
