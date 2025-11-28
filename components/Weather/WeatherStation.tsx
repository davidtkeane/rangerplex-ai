import React, { useState, useEffect } from 'react';
import { weatherService, CurrentWeather, WeatherSnapshot, APIUsageStats } from '../../services/weatherService';
import { DynamicSky } from './DynamicSky';

interface WeatherStationProps {
    isDarkMode: boolean;
    isTron: boolean;
}

export default function WeatherStation({ isDarkMode, isTron }: WeatherStationProps) {
    const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
    const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState('Dublin,IE');
    const [apiUsage, setApiUsage] = useState<APIUsageStats | null>(null);

    useEffect(() => {
        loadWeather();
    }, []);

    const loadWeather = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get complete weather snapshot from all 4 APIs
            const weatherSnapshot = await weatherService.getCompleteWeatherSnapshot(location);
            setSnapshot(weatherSnapshot);
            setCurrentWeather(weatherSnapshot.current);

            // Get API usage stats
            const usage = await weatherService.getAPIUsageStats();
            setApiUsage(usage);

            setLoading(false);
        } catch (err) {
            console.error('Weather loading error:', err);
            setError('Failed to load weather data. Check API keys in Settings.');
            setLoading(false);
        }
    };

    const getWeatherIcon = (conditions: string): string => {
        const lower = conditions.toLowerCase();
        if (lower.includes('clear') || lower.includes('sunny')) return 'fa-sun';
        if (lower.includes('cloud')) return 'fa-cloud';
        if (lower.includes('rain')) return 'fa-cloud-rain';
        if (lower.includes('snow')) return 'fa-snowflake';
        if (lower.includes('storm') || lower.includes('thunder')) return 'fa-cloud-bolt';
        if (lower.includes('fog') || lower.includes('mist')) return 'fa-smog';
        return 'fa-cloud-sun';
    };

    const getTimeUntilReset = (resetTime: number): string => {
        const now = Date.now();
        const diff = resetTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const themeClasses = isTron
        ? 'border-tron-cyan text-tron-cyan'
        : isDarkMode
        ? 'border-zinc-700 text-white'
        : 'border-gray-200 text-gray-900';

    const cardClasses = isTron
        ? 'bg-black/70 border-tron-cyan/30 backdrop-blur-md'
        : isDarkMode
        ? 'bg-zinc-800/80 border-zinc-700 backdrop-blur-md'
        : 'bg-white/80 border-gray-200 backdrop-blur-md';

    const accentColor = isTron ? 'text-tron-cyan' : 'text-teal-400';

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-full ${themeClasses}`}>
                <div className="text-center">
                    <i className={`fa-solid fa-cloud-sun fa-3x ${accentColor} mb-4 animate-pulse`}></i>
                    <p className="text-lg">Loading Weather Data...</p>
                    <p className="text-sm opacity-60">Querying 4 weather APIs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center h-full ${themeClasses}`}>
                <div className="text-center max-w-md">
                    <i className="fa-solid fa-triangle-exclamation fa-3x text-red-500 mb-4"></i>
                    <p className="text-lg mb-2">Weather Station Error</p>
                    <p className="text-sm opacity-60 mb-4">{error}</p>
                    <button
                        onClick={loadWeather}
                        className={`px-4 py-2 rounded border ${isTron ? 'border-tron-cyan hover:bg-tron-cyan/10' : 'border-teal-500 hover:bg-teal-500/10'}`}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!currentWeather) {
        return (
            <div className={`flex items-center justify-center h-full ${themeClasses}`}>
                <p>No weather data available</p>
            </div>
        );
    }

    return (
        <div className={`h-full overflow-y-auto p-6 relative ${themeClasses}`}>
            {/* Dynamic Sky Background */}
            {currentWeather && (
                <DynamicSky
                    latitude={currentWeather.latitude}
                    longitude={currentWeather.longitude}
                    timestamp={currentWeather.timestamp}
                />
            )}

            {/* Content with backdrop for readability */}
            <div className="relative z-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${accentColor}`}>
                    <i className="fa-solid fa-cloud-sun"></i>
                    🌤️ RangerPlex Weather Station
                </h1>
                <p className={`text-sm ${isDarkMode || isTron ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Powered by 4 weather APIs • Updated {new Date(currentWeather.timestamp).toLocaleTimeString()}
                </p>
            </div>

            {/* API Usage Meters - SOOOOO COOL! */}
            {apiUsage && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-gauge-high"></i>
                        API Usage Meters
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* OpenWeatherMap Meter */}
                        <div className={`border rounded-lg p-4 ${cardClasses}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm">OpenWeatherMap</span>
                                <i className="fa-solid fa-sun opacity-60"></i>
                            </div>
                            <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>{apiUsage.openweather.calls} calls</span>
                                    <span>{apiUsage.openweather.limit} limit</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${apiUsage.openweather.calls / apiUsage.openweather.limit > 0.8 ? 'bg-red-500' : apiUsage.openweather.calls / apiUsage.openweather.limit > 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(100, (apiUsage.openweather.calls / apiUsage.openweather.limit) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs opacity-60">
                                Resets in {getTimeUntilReset(apiUsage.openweather.resetTime)}
                            </p>
                        </div>

                        {/* Tomorrow.io Meter */}
                        <div className={`border rounded-lg p-4 ${cardClasses}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm">Tomorrow.io</span>
                                <i className="fa-solid fa-clock opacity-60"></i>
                            </div>
                            <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>{apiUsage.tomorrow.calls} calls</span>
                                    <span>{apiUsage.tomorrow.limit} limit</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${apiUsage.tomorrow.calls / apiUsage.tomorrow.limit > 0.8 ? 'bg-red-500' : apiUsage.tomorrow.calls / apiUsage.tomorrow.limit > 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(100, (apiUsage.tomorrow.calls / apiUsage.tomorrow.limit) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs opacity-60">
                                Resets in {getTimeUntilReset(apiUsage.tomorrow.resetTime)}
                            </p>
                        </div>

                        {/* Visual Crossing Meter */}
                        <div className={`border rounded-lg p-4 ${cardClasses}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm">Visual Crossing</span>
                                <i className="fa-solid fa-chart-line opacity-60"></i>
                            </div>
                            <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>{apiUsage.visualcrossing.calls} calls</span>
                                    <span>{apiUsage.visualcrossing.limit} limit</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${apiUsage.visualcrossing.calls / apiUsage.visualcrossing.limit > 0.8 ? 'bg-red-500' : apiUsage.visualcrossing.calls / apiUsage.visualcrossing.limit > 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(100, (apiUsage.visualcrossing.calls / apiUsage.visualcrossing.limit) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs opacity-60">
                                Resets in {getTimeUntilReset(apiUsage.visualcrossing.resetTime)}
                            </p>
                        </div>

                        {/* Open-Meteo Meter (Unlimited!) */}
                        <div className={`border rounded-lg p-4 ${cardClasses} border-green-500/50`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm">Open-Meteo</span>
                                <i className="fa-solid fa-infinity text-green-500"></i>
                            </div>
                            <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>{apiUsage.openmeteo.calls} calls</span>
                                    <span className="text-green-500">UNLIMITED! 🎖️</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-gradient-to-r from-green-500 to-teal-500 w-full animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-xs opacity-60 text-green-500">
                                FREE FOREVER! ∞
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Location & Refresh */}
            <div className="mb-6 flex items-center gap-3">
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g. Dublin,IE)"
                    className={`flex-1 px-4 py-2 rounded border ${cardClasses}`}
                />
                <button
                    onClick={loadWeather}
                    className={`px-4 py-2 rounded border ${isTron ? 'border-tron-cyan hover:bg-tron-cyan/10' : 'border-teal-500 hover:bg-teal-500/10'} flex items-center gap-2`}
                >
                    <i className="fa-solid fa-rotate"></i>
                    Refresh
                </button>
            </div>

            {/* Current Conditions - Hero Card */}
            <div className={`border rounded-lg p-6 mb-6 ${cardClasses}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Temperature & Icon */}
                    <div className="flex items-center gap-6">
                        <i className={`fa-solid ${getWeatherIcon(currentWeather.conditions)} fa-5x ${accentColor}`}></i>
                        <div>
                            <div className="text-6xl font-bold">{Math.round(currentWeather.temperature)}°C</div>
                            <div className="text-xl opacity-80">{currentWeather.conditions}</div>
                            <div className="text-sm opacity-60">Feels like {Math.round(currentWeather.feelsLike)}°C</div>
                            <div className="text-xs opacity-50 mt-2">Source: {currentWeather.source.toUpperCase()}</div>
                        </div>
                    </div>

                    {/* Right: Location & Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-lg">
                            <i className="fa-solid fa-location-dot"></i>
                            <span>{currentWeather.location}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <i className="fa-solid fa-droplet mr-2 opacity-60"></i>
                                Humidity: <span className="font-bold">{currentWeather.humidity}%</span>
                            </div>
                            <div>
                                <i className="fa-solid fa-gauge mr-2 opacity-60"></i>
                                Pressure: <span className="font-bold">{currentWeather.pressure} hPa</span>
                            </div>
                            <div>
                                <i className="fa-solid fa-wind mr-2 opacity-60"></i>
                                Wind: <span className="font-bold">{currentWeather.windSpeed} m/s</span>
                            </div>
                            <div>
                                <i className="fa-solid fa-compass mr-2 opacity-60"></i>
                                Direction: <span className="font-bold">{currentWeather.windDirection}°</span>
                            </div>
                            {currentWeather.windGust && (
                                <div>
                                    <i className="fa-solid fa-burst mr-2 opacity-60"></i>
                                    Gusts: <span className="font-bold">{currentWeather.windGust} m/s</span>
                                </div>
                            )}
                            <div>
                                <i className="fa-solid fa-cloud mr-2 opacity-60"></i>
                                Clouds: <span className="font-bold">{currentWeather.cloudCover}%</span>
                            </div>
                            <div>
                                <i className="fa-solid fa-eye mr-2 opacity-60"></i>
                                Visibility: <span className="font-bold">{(currentWeather.visibility / 1000).toFixed(1)} km</span>
                            </div>
                            {currentWeather.uvIndex !== undefined && currentWeather.uvIndex > 0 && (
                                <div>
                                    <i className="fa-solid fa-sun mr-2 opacity-60"></i>
                                    UV Index: <span className="font-bold">{currentWeather.uvIndex}</span>
                                </div>
                            )}
                        </div>
                        {/* Coordinates */}
                        <div className="text-xs opacity-50 mt-2">
                            📍 {currentWeather.latitude.toFixed(4)}°N, {currentWeather.longitude.toFixed(4)}°E
                        </div>
                    </div>
                </div>
            </div>

            {/* Forecast & Air Quality Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Hourly Forecast Count */}
                {snapshot?.hourly && snapshot.hourly.length > 0 && (
                    <div className={`border rounded-lg p-4 ${cardClasses}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold">Hourly Forecast</h3>
                            <i className="fa-solid fa-clock opacity-60"></i>
                        </div>
                        <p className="text-2xl font-bold">{snapshot.hourly.length} hours</p>
                        <p className="text-xs opacity-60 mb-2">Available forecast data</p>
                        {/* Show next 3 hours preview */}
                        <div className="space-y-1 mt-3">
                            {snapshot.hourly.slice(0, 3).map((hour, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span>{new Date(hour.time).getHours()}:00</span>
                                    <span className="font-bold">{Math.round(hour.temperature)}°C</span>
                                    <span className="opacity-60">{hour.humidity}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Daily Forecast Count */}
                {snapshot?.daily && snapshot.daily.length > 0 && (
                    <div className={`border rounded-lg p-4 ${cardClasses}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold">Daily Forecast</h3>
                            <i className="fa-solid fa-calendar-days opacity-60"></i>
                        </div>
                        <p className="text-2xl font-bold">{snapshot.daily.length} days</p>
                        <p className="text-xs opacity-60 mb-2">Extended forecast data</p>
                        {/* Show next 3 days preview */}
                        <div className="space-y-1 mt-3">
                            {snapshot.daily.slice(0, 3).map((day, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="font-bold">{Math.round(day.tempHigh)}° / {Math.round(day.tempLow)}°</span>
                                    <span className="opacity-60">{day.conditions.substring(0, 10)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Air Quality */}
                {snapshot?.airQuality && (
                    <div className={`border rounded-lg p-4 ${cardClasses}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold">Air Quality</h3>
                            <i className="fa-solid fa-lungs opacity-60"></i>
                        </div>
                        <p className="text-2xl font-bold">AQI {snapshot.airQuality.aqi}</p>
                        <p className="text-xs opacity-60 mb-2 capitalize">{snapshot.airQuality.quality.replace('_', ' ')}</p>
                        {/* Pollutants breakdown */}
                        <div className="space-y-1 mt-3 text-xs">
                            <div className="flex justify-between">
                                <span>PM2.5:</span>
                                <span className="font-bold">{snapshot.airQuality.pm25.toFixed(1)} μg/m³</span>
                            </div>
                            <div className="flex justify-between">
                                <span>PM10:</span>
                                <span className="font-bold">{snapshot.airQuality.pm10.toFixed(1)} μg/m³</span>
                            </div>
                            <div className="flex justify-between">
                                <span>O₃:</span>
                                <span className="font-bold">{snapshot.airQuality.o3.toFixed(1)} μg/m³</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Data Source Badge */}
            <div className={`border rounded-lg p-4 mb-4 ${cardClasses}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold mb-1">Weather Data Sources</h3>
                        <p className="text-sm opacity-60">
                            Fusion of 4 APIs: OpenWeatherMap, Tomorrow.io, Visual Crossing, Open-Meteo
                        </p>
                    </div>
                    <div className={`px-3 py-1 rounded border text-sm ${isTron ? 'border-tron-cyan bg-tron-cyan/10' : 'border-teal-500 bg-teal-500/10'}`}>
                        {snapshot?.source || 'fusion-4api'}
                    </div>
                </div>
            </div>

            {/* Future Features Placeholder */}
            <div className={`border rounded-lg p-4 ${cardClasses} opacity-50`}>
                <h3 className="font-bold mb-2">🚧 Coming Soon:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Temperature charts & graphs</div>
                    <div>• 7-day forecast cards</div>
                    <div>• Minute-by-minute precipitation</div>
                    <div>• Weather maps (OpenWeather tiles)</div>
                    <div>• ASCII weather display (wttr.in)</div>
                    <div>• Historical weather data (50 years!)</div>
                    <div>• Weather alerts & warnings</div>
                    <div>• Blockchain weather reports! 🎖️</div>
                </div>
            </div>
            </div>
        </div>
    );
}
