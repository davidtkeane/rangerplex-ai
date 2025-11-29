import React, { useState } from 'react';

interface RainNotificationProps {
    hoursUntilRain: number;
    location: string;
    precipitation: number; // mm of rain expected
    onViewWeather: () => void;
    onDismiss: () => void; // Standard dismiss (closes UI but doesn't change settings)
    onSnooze: (until: number) => void; // Snooze until timestamp
    onDisable: () => void; // Disable notifications completely
    theme: 'light' | 'dark' | 'tron';
}

const RainNotification: React.FC<RainNotificationProps> = ({
    hoursUntilRain,
    location,
    precipitation,
    onViewWeather,
    onDismiss,
    onSnooze,
    onDisable,
    theme
}) => {
    const [showOptions, setShowOptions] = useState(false);
    const [customTime, setCustomTime] = useState('');
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

    const handleCustomSnooze = () => {
        if (!customTime) return;
        const [hours, minutes] = customTime.split(':').map(Number);
        const now = new Date();
        const snoozeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

        // If time is in the past, assume tomorrow
        if (snoozeDate.getTime() < now.getTime()) {
            snoozeDate.setDate(snoozeDate.getDate() + 1);
        }

        onSnooze(snoozeDate.getTime());
    };

    return (
        <div className={`fixed bottom-20 right-4 z-[10000] max-w-sm w-full p-4 rounded-lg shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${isTron
            ? 'bg-black/90 border-tron-cyan text-tron-cyan shadow-[0_0_20px_rgba(0,243,255,0.3)]'
            : 'bg-white/95 dark:bg-zinc-900/95 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white'
            }`}>

            {!showOptions ? (
                // MAIN VIEW
                <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-full shrink-0 ${isTron ? 'bg-tron-cyan/20 text-tron-cyan animate-pulse' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                        <i className="fa-solid fa-cloud-showers-heavy text-2xl"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg leading-tight mb-1">Rain Incoming!</h3>
                            <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity p-1">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <p className="text-xs opacity-80 mb-3 truncate">
                            <i className="fa-solid fa-location-dot mr-1"></i> {location}
                        </p>

                        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                            <div className={`p-2 rounded ${isTron ? 'bg-tron-cyan/10' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                                <div className="text-xs opacity-70">Intensity</div>
                                <div className="font-bold truncate">{getRainIntensity()}</div>
                            </div>
                            <div className={`p-2 rounded ${isTron ? 'bg-tron-cyan/10' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                                <div className="text-xs opacity-70">ETA</div>
                                <div className="font-bold truncate">{getTimeMessage()}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onViewWeather}
                                className={`w-full py-2 px-3 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all ${isTron
                                    ? 'bg-tron-cyan text-black hover:bg-white hover:shadow-[0_0_15px_rgba(0,243,255,0.6)]'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                                    }`}
                            >
                                <i className="fa-solid fa-map"></i> Radar
                            </button>
                            <button
                                onClick={() => setShowOptions(true)}
                                className={`w-full py-2 px-3 rounded font-bold text-xs transition-colors flex items-center justify-center gap-2 ${isTron
                                    ? 'border border-tron-cyan/30 hover:bg-tron-cyan/10'
                                    : 'bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                <i className="fa-solid fa-bell-slash"></i> Dismiss...
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // OPTIONS VIEW
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-3 border-b border-inherit pb-2">
                        <h4 className="font-bold text-sm">Dismissal Options</h4>
                        <button onClick={() => setShowOptions(false)} className="text-xs opacity-60 hover:opacity-100">Cancel</button>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={onDisable}
                            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors ${isTron
                                ? 'hover:bg-red-900/30 text-red-400'
                                : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'}`}
                        >
                            <i className="fa-solid fa-ban w-5 text-center"></i>
                            <div>
                                <div className="font-bold">Stop Notifications</div>
                                <div className="text-[10px] opacity-70">Disable rain alerts permanently</div>
                            </div>
                        </button>

                        <button
                            onClick={() => onSnooze(Date.now() + 3600000)}
                            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors ${isTron
                                ? 'hover:bg-tron-cyan/10'
                                : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                        >
                            <i className="fa-solid fa-hourglass-half w-5 text-center"></i>
                            <div>
                                <div className="font-bold">Snooze for 1 Hour</div>
                                <div className="text-[10px] opacity-70">Remind me later</div>
                            </div>
                        </button>

                        <div className={`p-3 rounded ${isTron ? 'bg-tron-cyan/5' : 'bg-gray-50 dark:bg-zinc-800/50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fa-solid fa-clock w-5 text-center"></i>
                                <span className="text-sm font-bold">Remind me at...</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="time"
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    className={`flex-1 rounded px-2 py-1 text-sm outline-none border ${isTron
                                        ? 'bg-black border-tron-cyan/30 text-tron-cyan focus:border-tron-cyan'
                                        : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 focus:border-blue-500'}`}
                                />
                                <button
                                    onClick={handleCustomSnooze}
                                    disabled={!customTime}
                                    className={`px-3 py-1 rounded text-xs font-bold disabled:opacity-50 ${isTron
                                        ? 'bg-tron-cyan text-black hover:bg-white'
                                        : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                >
                                    Set
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RainNotification;
