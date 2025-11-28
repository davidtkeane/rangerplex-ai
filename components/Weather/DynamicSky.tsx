import React, { useMemo } from 'react';

interface DynamicSkyProps {
    latitude: number;
    longitude: number;
    timestamp?: number;
}

export function DynamicSky({ latitude, longitude, timestamp = Date.now() }: DynamicSkyProps) {
    const skyData = useMemo(() => {
        const date = new Date(timestamp);

        // Calculate Julian Day
        const getJulianDay = (d: Date): number => {
            const a = Math.floor((14 - (d.getMonth() + 1)) / 12);
            const y = d.getFullYear() + 4800 - a;
            const m = (d.getMonth() + 1) + 12 * a - 3;
            return d.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        };

        const jd = getJulianDay(date);
        const n = jd - 2451545.0;

        // Calculate solar position
        const L = (280.460 + 0.9856474 * n) % 360; // Mean longitude
        const g = (357.528 + 0.9856003 * n) % 360; // Mean anomaly
        const lambda = L + 1.915 * Math.sin(g * Math.PI / 180) + 0.020 * Math.sin(2 * g * Math.PI / 180); // Ecliptic longitude

        const epsilon = 23.439 - 0.0000004 * n; // Obliquity

        // Right ascension and declination
        const alpha = Math.atan2(Math.cos(epsilon * Math.PI / 180) * Math.sin(lambda * Math.PI / 180), Math.cos(lambda * Math.PI / 180)) * 180 / Math.PI;
        const delta = Math.asin(Math.sin(epsilon * Math.PI / 180) * Math.sin(lambda * Math.PI / 180)) * 180 / Math.PI;

        // Local sidereal time
        const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
        const LST = (100.46 + 0.985647 * n + longitude + 15 * hours) % 360;

        // Hour angle
        const H = (LST - alpha + 360) % 360;

        // Altitude and azimuth
        const lat_rad = latitude * Math.PI / 180;
        const H_rad = H * Math.PI / 180;
        const delta_rad = delta * Math.PI / 180;

        const altitude = Math.asin(Math.sin(lat_rad) * Math.sin(delta_rad) + Math.cos(lat_rad) * Math.cos(delta_rad) * Math.cos(H_rad)) * 180 / Math.PI;
        const azimuth = (Math.atan2(Math.sin(H_rad), Math.cos(H_rad) * Math.sin(lat_rad) - Math.tan(delta_rad) * Math.cos(lat_rad)) * 180 / Math.PI + 180) % 360;

        // Calculate approximate sunrise/sunset
        const sunset_hour_angle = Math.acos(-Math.tan(lat_rad) * Math.tan(delta_rad));
        const sunrise_hour = 12 - sunset_hour_angle * 12 / Math.PI;
        const sunset_hour = 12 + sunset_hour_angle * 12 / Math.PI;

        const current_hour = date.getHours() + date.getMinutes() / 60;

        // Determine time of day
        let timeOfDay: 'night' | 'dawn' | 'day' | 'dusk';
        if (current_hour < sunrise_hour - 1) {
            timeOfDay = 'night';
        } else if (current_hour < sunrise_hour + 1) {
            timeOfDay = 'dawn';
        } else if (current_hour < sunset_hour - 1) {
            timeOfDay = 'day';
        } else if (current_hour < sunset_hour + 1) {
            timeOfDay = 'dusk';
        } else {
            timeOfDay = 'night';
        }

        // Calculate moon phase (simplified)
        const moonPhase = ((n % 29.53) / 29.53); // 0 = new moon, 0.5 = full moon

        // Calculate moon position (simplified - moon follows similar path to sun but ~12 hours offset)
        const moonAltitude = altitude < 0 ? Math.abs(altitude) : -altitude; // Opposite of sun roughly
        const moonAzimuth = (azimuth + 180) % 360;

        return {
            sunAltitude: altitude,
            sunAzimuth: azimuth,
            moonAltitude,
            moonAzimuth,
            moonPhase,
            timeOfDay,
            isDaytime: altitude > 0,
            sunriseHour: sunrise_hour,
            sunsetHour: sunset_hour
        };
    }, [latitude, longitude, timestamp]);

    // Convert altitude/azimuth to screen position
    const getSunPosition = () => {
        const { sunAltitude, sunAzimuth } = skyData;

        // Map altitude (-90 to 90) to vertical position (100% to 0%)
        // When altitude is 90 (zenith), sun should be at top (0%)
        // When altitude is 0 (horizon), sun should be at 80% (not bottom, as we want it on horizon)
        // When altitude is -90, sun is below horizon
        const verticalPercent = Math.max(0, Math.min(100, 80 - (sunAltitude * 0.8)));

        // Map azimuth (0 to 360) to horizontal position (0% to 100%)
        // 0° = North, 90° = East, 180° = South, 270° = West
        const horizontalPercent = (sunAzimuth / 360) * 100;

        return { left: `${horizontalPercent}%`, top: `${verticalPercent}%` };
    };

    const getMoonPosition = () => {
        const { moonAltitude, moonAzimuth } = skyData;
        const verticalPercent = Math.max(0, Math.min(100, 80 - (moonAltitude * 0.8)));
        const horizontalPercent = (moonAzimuth / 360) * 100;
        return { left: `${horizontalPercent}%`, top: `${verticalPercent}%` };
    };

    // Sky gradient based on time of day
    const getSkyGradient = () => {
        const { timeOfDay } = skyData;

        switch (timeOfDay) {
            case 'night':
                return 'linear-gradient(to bottom, #0a0e27 0%, #1a1a3e 50%, #2a1a4a 100%)';
            case 'dawn':
                return 'linear-gradient(to bottom, #1e3a5f 0%, #ff6b35 30%, #ffd93d 60%, #87ceeb 100%)';
            case 'day':
                return 'linear-gradient(to bottom, #4a90e2 0%, #87ceeb 50%, #b0d4f1 100%)';
            case 'dusk':
                return 'linear-gradient(to bottom, #2c3e50 0%, #e74c3c 30%, #f39c12 60%, #3498db 100%)';
            default:
                return 'linear-gradient(to bottom, #87ceeb 0%, #b0d4f1 100%)';
        }
    };

    const renderStars = () => {
        if (skyData.isDaytime) return null;

        // Generate random stars
        const stars = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 70, // Only in upper 70% of sky
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.7 + 0.3,
            delay: Math.random() * 3
        }));

        return stars.map(star => (
            <div
                key={star.id}
                className="absolute rounded-full bg-white animate-pulse"
                style={{
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    opacity: star.opacity,
                    animationDelay: `${star.delay}s`,
                    animationDuration: '3s'
                }}
            />
        ));
    };

    const getMoonEmoji = () => {
        const { moonPhase } = skyData;
        if (moonPhase < 0.05) return '🌑'; // New moon
        if (moonPhase < 0.22) return '🌒'; // Waxing crescent
        if (moonPhase < 0.28) return '🌓'; // First quarter
        if (moonPhase < 0.45) return '🌔'; // Waxing gibbous
        if (moonPhase < 0.55) return '🌕'; // Full moon
        if (moonPhase < 0.72) return '🌖'; // Waning gibbous
        if (moonPhase < 0.78) return '🌗'; // Last quarter
        if (moonPhase < 0.95) return '🌘'; // Waning crescent
        return '🌑'; // New moon
    };

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: getSkyGradient() }}>
            {/* Stars (night only) */}
            {renderStars()}

            {/* Sun (daytime only) */}
            {skyData.isDaytime && skyData.sunAltitude > -6 && (
                <div
                    className="absolute transition-all duration-1000"
                    style={getSunPosition()}
                >
                    <div className="relative">
                        {/* Sun glow */}
                        <div
                            className="absolute animate-pulse"
                            style={{
                                width: '120px',
                                height: '120px',
                                background: 'radial-gradient(circle, rgba(255,220,100,0.6) 0%, rgba(255,200,50,0.3) 40%, transparent 70%)',
                                transform: 'translate(-50%, -50%)',
                                filter: 'blur(20px)'
                            }}
                        />
                        {/* Sun core */}
                        <div
                            className="absolute"
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, #fff9e6 0%, #ffeb3b 50%, #ffa726 100%)',
                                transform: 'translate(-50%, -50%)',
                                boxShadow: '0 0 40px rgba(255,235,59,0.8), 0 0 80px rgba(255,235,59,0.4)'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Moon (nighttime only) */}
            {!skyData.isDaytime && skyData.moonAltitude > 0 && (
                <div
                    className="absolute transition-all duration-1000 text-6xl"
                    style={getMoonPosition()}
                >
                    <div style={{
                        transform: 'translate(-50%, -50%)',
                        filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))'
                    }}>
                        {getMoonEmoji()}
                    </div>
                </div>
            )}

            {/* Clouds (always) */}
            <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute opacity-30"
                        style={{
                            left: `${i * 25 - 10}%`,
                            top: `${20 + i * 15}%`,
                            animation: `float ${30 + i * 10}s linear infinite`,
                            animationDelay: `${i * 5}s`
                        }}
                    >
                        <svg width="200" height="80" viewBox="0 0 200 80" fill="none">
                            <ellipse cx="50" cy="40" rx="40" ry="25" fill="white" fillOpacity="0.6" />
                            <ellipse cx="90" cy="35" rx="50" ry="30" fill="white" fillOpacity="0.6" />
                            <ellipse cx="140" cy="40" rx="45" ry="25" fill="white" fillOpacity="0.6" />
                        </svg>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(calc(100vw + 200px)); }
                }
            `}</style>
        </div>
    );
}
