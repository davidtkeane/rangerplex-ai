import React from 'react';

interface RainNotificationProps {
    hoursUntilRain: number;
    location: string;
    precipitation: number; // mm of rain expected
    onViewWeather: () => void;
    onDismiss: () => void;
    theme: 'light' | 'dark' | 'tron';
}

const RainNotification: React.FC<RainNotificationProps> = ({
    hoursUntilRain,
    location,
    precipitation,
    onViewWeather,
    onDismiss,
    theme
}) => {
    const isTron = theme === 'tron';

    const getTimeMessage = () => {
        if (hoursUntilRain < 1) {
            const minutes = Math.round(hoursUntilRain * 60);
            return `in ${minutes} minutes`;
        }
        if (hoursUntilRain === 1) {
            return 'in 1 hour';
        }
        return `in ${Math.round(hoursUntilRain)} hours`;
    };

    const getRainIntensity = () => {
        if (precipitation > 10) return 'Heavy rain';
        if (precipitation > 5) return 'Moderate rain';
        if (precipitation > 2) return 'Light rain';
        return 'Drizzle';
    };

    return (
        <div className={`fixed bottom-20 right-4 z-[10000] max-w-sm w-full p-4 rounded-lg shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${isTron
                ? 'bg-black/80 border-tron-cyan text-tron-cyan shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                : 'bg-white/90 dark:bg-zinc-900/90 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white'
            }`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${isTron ? 'bg-tron-cyan/20 text-tron-cyan' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                    <i className="fa-solid fa-cloud-rain text-xl"></i>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg leading-tight mb-1">☔ Rain Expected!</h3>
                    <p className="text-xs opacity-80 mb-2">
                        <i className="fa-solid fa-location-dot mr-1"></i>
                        {location}
                    </p>
                    <div className="space-y-1 mb-4">
                        <p className="text-sm opacity-90">
                            <i className="fa-solid fa-clock mr-2"></i>
                            <span className="font-bold">{getRainIntensity()}</span> {getTimeMessage()}
                        </p>
                        <p className="text-sm opacity-90">
                            <i className="fa-solid fa-droplet mr-2"></i>
                            Expected: <span className="font-bold">{precipitation.toFixed(1)}mm</span>
                        </p>
                        {hoursUntilRain <= 3 && (
                            <p className="text-xs opacity-70 mt-2">
                                <i className="fa-solid fa-umbrella mr-1"></i>
                                Don't forget your brolly! 🇮🇪
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onViewWeather}
                            className={`flex-1 py-2 px-3 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all ${isTron
                                    ? 'bg-tron-cyan text-black hover:bg-white hover:shadow-[0_0_15px_rgba(0,243,255,0.6)]'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                                }`}
                        >
                            <i className="fa-solid fa-cloud-sun"></i>
                            View Weather
                        </button>
                        <button
                            onClick={onDismiss}
                            className={`px-3 rounded font-bold text-sm transition-colors ${isTron
                                    ? 'border border-tron-cyan/30 hover:bg-tron-cyan/10'
                                    : 'bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700'
                                }`}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
    );
};

export default RainNotification;
