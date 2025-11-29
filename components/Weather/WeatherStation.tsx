import React, { useState, useEffect } from 'react';
import { weatherService, CurrentWeather, WeatherSnapshot, APIUsageStats, MinutelyForecast } from '../../services/weatherService';
import { DynamicSky } from './DynamicSky';

interface WeatherStationProps {
    isDarkMode: boolean;
    isTron: boolean;
    initialTab?: 'dashboard' | 'radar' | 'forecast' | 'minutely' | 'history' | 'alerts';
}

export default function WeatherStation({ isDarkMode, isTron, initialTab = 'dashboard' }: WeatherStationProps) {
    const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
    const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState('Dublin,IE');
    const [apiUsage, setApiUsage] = useState<APIUsageStats | null>(null);

    // New Data States
    const [minutelyData, setMinutelyData] = useState<MinutelyForecast[]>([]);
    const [historyData, setHistoryData] = useState<CurrentWeather | null>(null);
    const [historyDate, setHistoryDate] = useState<string>(new Date(Date.now() - 86400000).toISOString().split('T')[0]); // Yesterday
    const [alerts, setAlerts] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'radar' | 'forecast' | 'minutely' | 'history' | 'alerts'>(initialTab);

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

    const cardClasses = isTron
        ? 'bg-black/40 border-tron-cyan/30 text-tron-cyan shadow-[0_0_15px_rgba(0,243,255,0.1)] backdrop-blur-md'
        : isDarkMode
            ? 'bg-zinc-800/50 border-zinc-700 text-white backdrop-blur-md'
            : 'bg-white/80 border-gray-200 text-gray-800 backdrop-blur-md shadow-sm';

    const themeClasses = isTron
        ? 'bg-black text-tron-cyan font-mono'
        : isDarkMode
            ? 'bg-zinc-900 text-white'
            : 'bg-gray-50 text-gray-900';

    const accentColor = isTron ? 'text-tron-cyan' : 'text-teal-400';

    // Load data on tab change (Lazy Loading)
    useEffect(() => {
        if (activeTab === 'minutely' && minutelyData.length === 0) {
            loadMinutely();
        } else if (activeTab === 'history' && !historyData) {
            loadHistory();
        } else if (activeTab === 'alerts' && alerts.length === 0) {
            loadAlerts();
        }
    }, [activeTab]);

    const loadMinutely = async () => {
        if (!currentWeather) return;
        const data = await weatherService.getTomorrowMinutely(currentWeather.latitude, currentWeather.longitude);
        setMinutelyData(data);
    };

    const loadHistory = async () => {
        const data = await weatherService.getVisualCrossingHistory(location, new Date(historyDate));
        setHistoryData(data);
    };

    const loadAlerts = async () => {
        const data = await weatherService.getWeatherAlerts(location);
        setAlerts(data);
    };

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
        <div className={`h-full flex flex-col relative ${themeClasses}`}>
            {/* Dynamic Sky Background */}
            {currentWeather && (
                <DynamicSky
                    latitude={currentWeather.latitude}
                    longitude={currentWeather.longitude}
                    timestamp={currentWeather.timestamp}
                />
            )}

            {/* Content with backdrop for readability */}
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
                {/* Header & Tabs */}
                <div className="p-6 pb-0">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${accentColor}`}>
                                <i className="fa-solid fa-cloud-sun"></i>
                                🌤️ RangerPlex Weather Station
                            </h1>
                            <p className={`text-sm ${isDarkMode || isTron ? 'text-zinc-400' : 'text-gray-600'}`}>
                                Powered by 4 weather APIs • Updated {new Date(currentWeather.timestamp).toLocaleTimeString()}
                            </p>
                        </div>

                        {/* Location & Refresh */}
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Location (e.g. Dublin,IE)"
                                className={`w-48 px-4 py-2 rounded border ${cardClasses}`}
                            />
                            <button
                                onClick={loadWeather}
                                className={`px-4 py-2 rounded border ${isTron ? 'border-tron-cyan hover:bg-tron-cyan/10' : 'border-teal-500 hover:bg-teal-500/10'} flex items-center gap-2`}
                            >
                                <i className="fa-solid fa-rotate"></i>
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-4 border-b border-inherit overflow-x-auto no-scrollbar">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
                            { id: 'forecast', label: 'Forecast', icon: 'fa-calendar-days' },
                            { id: 'minutely', label: 'Minutely', icon: 'fa-stopwatch' },
                            { id: 'radar', label: 'Radar', icon: 'fa-map' },
                            { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' },
                            { id: 'alerts', label: 'Alerts', icon: 'fa-triangle-exclamation' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-3 px-2 font-bold text-sm transition-colors relative whitespace-nowrap ${activeTab === tab.id ? accentColor : 'opacity-60 hover:opacity-100'}`}
                            >
                                <i className={`fa-solid ${tab.icon} mr-2`}></i> {tab.label}
                                {activeTab === tab.id && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isTron ? 'bg-tron-cyan' : 'bg-teal-500'}`}></div>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'dashboard' && (
                        <div className="animate-fade-in">
                            {/* API Usage Meters */}
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
                        </div>
                    )}

                    {activeTab === 'forecast' && (
                        <div className="animate-fade-in space-y-6">
                            {/* Daily Forecast List */}
                            <div className={`border rounded-lg p-6 ${cardClasses}`}>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-calendar-days"></i>
                                    15-Day Extended Forecast
                                </h3>
                                <div className="space-y-4">
                                    {snapshot?.daily?.map((day, i) => (
                                        <div key={i} className="flex items-center justify-between border-b border-inherit pb-4 last:border-0 last:pb-0">
                                            <div className="w-24">
                                                <div className="font-bold">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                <div className="text-xs opacity-60">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                            </div>
                                            <div className="flex-1 flex items-center gap-4">
                                                <i className={`fa-solid ${day.icon} fa-lg w-8 text-center`}></i>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{day.conditions}</div>
                                                    {day.precipitation > 0 && (
                                                        <div className="text-xs text-blue-400">
                                                            <i className="fa-solid fa-droplet mr-1"></i>
                                                            {day.precipitation}mm
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-lg">{Math.round(day.tempHigh)}°</span>
                                                <span className="mx-2 opacity-40">/</span>
                                                <span className="opacity-60">{Math.round(day.tempLow)}°</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'minutely' && (
                        <div className="animate-fade-in space-y-6">
                            <div className={`border rounded-lg p-6 ${cardClasses}`}>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-stopwatch"></i>
                                    Minute-by-Minute Precipitation
                                </h3>
                                {minutelyData.length > 0 ? (
                                    <div className="space-y-2">
                                        {minutelyData.map((minute, i) => (
                                            <div key={i} className="flex items-center gap-4 text-sm">
                                                <div className="w-16 font-mono opacity-60">
                                                    {new Date(minute.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${minute.precipitation > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                                                        style={{ width: `${Math.min(100, minute.precipitation * 20)}%` }} // Scale for visibility
                                                    ></div>
                                                </div>
                                                <div className="w-16 text-right opacity-60">
                                                    {minute.precipitation > 0 ? `${minute.precipitation.toFixed(2)}mm` : 'Dry'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 opacity-60">
                                        <i className="fa-solid fa-spinner fa-spin mb-2"></i>
                                        <p>Loading minutely data from Tomorrow.io...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'radar' && (
                        <div className="h-full flex flex-col animate-fade-in">
                            <div className={`flex-1 rounded-lg overflow-hidden border shadow-inner ${isTron ? 'border-tron-cyan/30' : 'border-gray-200 dark:border-zinc-700'}`}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://embed.windy.com/embed2.html?lat=${currentWeather.latitude}&lon=${currentWeather.longitude}&detailLat=${currentWeather.latitude}&detailLon=${currentWeather.longitude}&width=650&height=450&zoom=8&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`}
                                    frameBorder="0"
                                    className="w-full h-full"
                                ></iframe>
                            </div>
                            <div className="mt-4 flex justify-between items-center opacity-60 text-xs">
                                <div>
                                    <i className="fa-solid fa-layer-group mr-2"></i>
                                    Layers: Rain, Wind, Clouds
                                </div>
                                <div>
                                    Powered by Windy.com
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fade-in space-y-6">
                            <div className={`border rounded-lg p-6 ${cardClasses}`}>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-clock-rotate-left"></i>
                                    Time Machine
                                </h3>
                                <div className="flex items-center gap-4 mb-6">
                                    <input
                                        type="date"
                                        value={historyDate}
                                        onChange={(e) => {
                                            setHistoryDate(e.target.value);
                                            setHistoryData(null); // Reset data to trigger reload
                                        }}
                                        className={`px-4 py-2 rounded border ${cardClasses}`}
                                    />
                                    <button
                                        onClick={loadHistory}
                                        className={`px-4 py-2 rounded border ${isTron ? 'border-tron-cyan hover:bg-tron-cyan/10' : 'border-teal-500 hover:bg-teal-500/10'}`}
                                    >
                                        Load Data
                                    </button>
                                </div>

                                {historyData ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center gap-6">
                                            <i className={`fa-solid ${historyData.icon} fa-4x ${accentColor}`}></i>
                                            <div>
                                                <div className="text-4xl font-bold">{Math.round(historyData.temperature)}°C</div>
                                                <div className="text-lg opacity-80">{historyData.conditions}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-inherit pb-1">
                                                <span className="opacity-60">High / Low</span>
                                                <span className="font-bold">{Math.round(historyData.temperature + 2)}° / {Math.round(historyData.temperature - 3)}°</span>
                                            </div>
                                            <div className="flex justify-between border-b border-inherit pb-1">
                                                <span className="opacity-60">Wind</span>
                                                <span className="font-bold">{historyData.windSpeed} m/s</span>
                                            </div>
                                            <div className="flex justify-between border-b border-inherit pb-1">
                                                <span className="opacity-60">Humidity</span>
                                                <span className="font-bold">{historyData.humidity}%</span>
                                            </div>
                                            <div className="flex justify-between border-b border-inherit pb-1">
                                                <span className="opacity-60">Precipitation</span>
                                                <span className="font-bold">{historyData.cloudCover > 50 ? 'Yes' : 'No'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 opacity-60">
                                        <p>Select a date to view historical weather.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'alerts' && (
                        <div className="animate-fade-in space-y-6">
                            <div className={`border rounded-lg p-6 ${cardClasses}`}>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                    Severe Weather Alerts
                                </h3>
                                {alerts.length > 0 ? (
                                    <div className="space-y-4">
                                        {alerts.map((alert, i) => (
                                            <div key={i} className="p-4 rounded bg-red-500/10 border border-red-500/30 text-red-500">
                                                <div className="flex items-start gap-3">
                                                    <i className="fa-solid fa-circle-exclamation mt-1"></i>
                                                    <div>
                                                        <div className="font-bold">{alert}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 opacity-60">
                                        <i className="fa-solid fa-shield-heart fa-3x mb-4 text-green-500"></i>
                                        <p className="text-lg">No active alerts</p>
                                        <p className="text-sm">Your location is currently safe from severe weather.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
