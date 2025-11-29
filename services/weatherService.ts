// RangerPlex Weather Service - 4-API Integration 🌤️
// Combines OpenWeatherMap, Tomorrow.io, Visual Crossing, and Open-Meteo
// By AIRanger - Rangers lead the way! 🎖️

import { fetchWeatherApi } from 'openmeteo';
import { dbService } from './dbService';

// Weather data interfaces
export interface CurrentWeather {
    location: string;
    latitude: number;
    longitude: number;
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    cloudCover: number;
    visibility: number;
    uvIndex: number;
    conditions: string;
    icon: string;
    timestamp: number;
    source: 'openweather' | 'tomorrow' | 'visualcrossing' | 'openmeteo';
}

export interface MinutelyForecast {
    time: Date;
    temperature: number;
    precipitation: number;
    cloudCover: number;
}

export interface HourlyForecast {
    time: Date;
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    conditions: string;
    icon: string;
}

export interface DailyForecast {
    date: Date;
    tempHigh: number;
    tempLow: number;
    conditions: string;
    icon: string;
    precipitation: number;
    humidity: number;
    windSpeed: number;
}

export interface AirQuality {
    aqi: number;
    pm25: number;
    pm10: number;
    co: number;
    no2: number;
    o3: number;
    so2: number;
    quality: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
}

export interface WeatherSnapshot {
    id: string;
    timestamp: number;
    location: string;
    current: CurrentWeather;
    hourly?: HourlyForecast[];
    daily?: DailyForecast[];
    airQuality?: AirQuality;
    source: string;
}

export interface APIUsageStats {
    openweather: { calls: number; limit: number; resetTime: number };
    tomorrow: { calls: number; limit: number; resetTime: number };
    visualcrossing: { calls: number; limit: number; resetTime: number };
    openmeteo: { calls: number; limit: number; resetTime: number };
}

export interface RainAlert {
    willRain: boolean;
    hoursUntilRain: number;
    precipitation: number; // mm
    location: string;
    timeDetected: number;
}

class WeatherService {
    private openWeatherKey: string;
    private tomorrowKey: string;
    private visualCrossingKey: string;
    private usageStats: APIUsageStats;

    constructor() {
        // Load API keys from environment
        this.openWeatherKey = import.meta.env.OPENWEATHER_API_KEY || '';
        this.tomorrowKey = import.meta.env.TOMORROW_API_KEY || '';
        this.visualCrossingKey = import.meta.env.VISUAL_CROSSING_API_KEY || '';

        // Initialize usage stats
        this.usageStats = {
            openweather: { calls: 0, limit: 1000, resetTime: this.getNextMidnight() },
            tomorrow: { calls: 0, limit: 500, resetTime: this.getNextMidnight() },
            visualcrossing: { calls: 0, limit: 1000, resetTime: this.getNextMidnight() },
            openmeteo: { calls: 0, limit: 999999, resetTime: this.getNextMidnight() } // Unlimited!
        };

        this.loadUsageStats();
    }

    private getNextMidnight(): number {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    private async loadUsageStats(): Promise<void> {
        try {
            const stored = await dbService.getSetting('weather_api_usage');
            if (stored) {
                this.usageStats = stored;
                // Reset if past midnight
                const now = Date.now();
                if (now > this.usageStats.openweather.resetTime) {
                    this.resetDailyStats();
                }
            }
        } catch (error) {
            console.error('Failed to load API usage stats:', error);
        }
    }

    private async saveUsageStats(): Promise<void> {
        try {
            await dbService.saveSetting('weather_api_usage', this.usageStats);
        } catch (error) {
            console.error('Failed to save API usage stats:', error);
        }
    }

    private resetDailyStats(): void {
        const resetTime = this.getNextMidnight();
        this.usageStats = {
            openweather: { calls: 0, limit: 1000, resetTime },
            tomorrow: { calls: 0, limit: 500, resetTime },
            visualcrossing: { calls: 0, limit: 1000, resetTime },
            openmeteo: { calls: 0, limit: 999999, resetTime }
        };
        this.saveUsageStats();
    }

    private async trackAPICall(api: keyof APIUsageStats): Promise<void> {
        this.usageStats[api].calls++;
        await this.saveUsageStats();
    }

    async getAPIUsageStats(): Promise<APIUsageStats> {
        await this.loadUsageStats();
        return this.usageStats;
    }

    // ========================================
    // API #1: OpenWeatherMap
    // ========================================

    async getOpenWeatherCurrent(city: string = 'Dublin,IE'): Promise<CurrentWeather | null> {
        if (!this.openWeatherKey) {
            console.warn('OpenWeatherMap API key not configured');
            return null;
        }

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.openWeatherKey}&units=metric`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error('OpenWeatherMap error:', response.status);
                return null;
            }

            const data = await response.json();

            // Track API call
            await this.trackAPICall('openweather');

            return {
                location: data.name,
                latitude: data.coord.lat,
                longitude: data.coord.lon,
                temperature: data.main.temp,
                feelsLike: data.main.feels_like,
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                windSpeed: data.wind.speed,
                windDirection: data.wind.deg,
                windGust: data.wind.gust,
                cloudCover: data.clouds.all,
                visibility: data.visibility / 1000, // Convert to km
                uvIndex: 0, // Not included in basic API
                conditions: data.weather[0].description,
                icon: data.weather[0].icon,
                timestamp: Date.now(),
                source: 'openweather'
            };
        } catch (error) {
            console.error('OpenWeatherMap fetch error:', error);
            return null;
        }
    }

    async getOpenWeatherForecast(city: string = 'Dublin,IE'): Promise<HourlyForecast[]> {
        if (!this.openWeatherKey) return [];

        try {
            const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${this.openWeatherKey}&units=metric`;
            const response = await fetch(url);

            if (!response.ok) return [];

            const data = await response.json();

            // Track API call
            await this.trackAPICall('openweather');

            return data.list.slice(0, 24).map((item: any) => ({
                time: new Date(item.dt * 1000),
                temperature: item.main.temp,
                feelsLike: item.main.feels_like,
                humidity: item.main.humidity,
                precipitation: item.rain?.['3h'] || 0,
                windSpeed: item.wind.speed,
                conditions: item.weather[0].description,
                icon: item.weather[0].icon
            }));
        } catch (error) {
            console.error('OpenWeatherMap forecast error:', error);
            return [];
        }
    }

    async getOpenWeatherAirQuality(lat: number, lon: number): Promise<AirQuality | null> {
        if (!this.openWeatherKey) return null;

        try {
            const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${this.openWeatherKey}`;
            const response = await fetch(url);

            if (!response.ok) return null;

            const data = await response.json();
            const components = data.list[0].components;

            // Track API call
            await this.trackAPICall('openweather');

            const aqiMap = ['good', 'good', 'moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy'];

            return {
                aqi: data.list[0].main.aqi,
                pm25: components.pm2_5,
                pm10: components.pm10,
                co: components.co,
                no2: components.no2,
                o3: components.o3,
                so2: components.so2,
                quality: aqiMap[data.list[0].main.aqi - 1] as any
            };
        } catch (error) {
            console.error('OpenWeatherMap air quality error:', error);
            return null;
        }
    }

    // ========================================
    // API #2: Tomorrow.io (MINUTE-BY-MINUTE!)
    // ========================================

    async getTomorrowCurrent(lat: number = 53.3498, lon: number = -6.2603): Promise<CurrentWeather | null> {
        if (!this.tomorrowKey) {
            console.warn('Tomorrow.io API key not configured');
            return null;
        }

        try {
            const url = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${this.tomorrowKey}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error('Tomorrow.io error:', response.status);
                return null;
            }

            const data = await response.json();
            const values = data.data.values;

            // Track API call
            await this.trackAPICall('tomorrow');

            return {
                location: 'Dublin', // Tomorrow.io doesn't return location name
                latitude: lat,
                longitude: lon,
                temperature: values.temperature,
                feelsLike: values.temperatureApparent,
                humidity: values.humidity,
                pressure: values.pressureSeaLevel,
                windSpeed: values.windSpeed,
                windDirection: values.windDirection,
                windGust: values.windGust,
                cloudCover: values.cloudCover,
                visibility: values.visibility,
                uvIndex: values.uvIndex,
                conditions: this.getWeatherCondition(values.weatherCode),
                icon: this.getWeatherIcon(values.weatherCode),
                timestamp: Date.now(),
                source: 'tomorrow'
            };
        } catch (error) {
            console.error('Tomorrow.io fetch error:', error);
            return null;
        }
    }

    async getTomorrowMinutely(lat: number = 53.3498, lon: number = -6.2603): Promise<MinutelyForecast[]> {
        if (!this.tomorrowKey) return [];

        try {
            const url = `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${this.tomorrowKey}`;
            const response = await fetch(url);

            if (!response.ok) return [];

            const data = await response.json();
            const minutely = data.timelines?.minutely || [];

            // Track API call
            await this.trackAPICall('tomorrow');

            return minutely.slice(0, 60).map((item: any) => ({
                time: new Date(item.time),
                temperature: item.values.temperature,
                precipitation: item.values.precipitationIntensity,
                cloudCover: item.values.cloudCover
            }));
        } catch (error) {
            console.error('Tomorrow.io minutely error:', error);
            return [];
        }
    }

    // ========================================
    // API #3: Visual Crossing (50-YEAR HISTORY!)
    // ========================================

    async getVisualCrossingCurrent(location: string = 'Dublin,Ireland'): Promise<CurrentWeather | null> {
        if (!this.visualCrossingKey || this.visualCrossingKey === 'your_visual_crossing_key_here') {
            console.warn('Visual Crossing API key not configured');
            return null;
        }

        try {
            const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}/today?key=${this.visualCrossingKey}&unitGroup=metric&include=current`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error('Visual Crossing error:', response.status);
                return null;
            }

            const data = await response.json();
            const current = data.currentConditions;

            // Track API call
            await this.trackAPICall('visualcrossing');

            return {
                location: data.resolvedAddress,
                latitude: data.latitude,
                longitude: data.longitude,
                temperature: current.temp,
                feelsLike: current.feelslike,
                humidity: current.humidity,
                pressure: current.pressure,
                windSpeed: current.windspeed,
                windDirection: current.winddir,
                windGust: current.windgust,
                cloudCover: current.cloudcover,
                visibility: current.visibility,
                uvIndex: current.uvindex,
                conditions: current.conditions,
                icon: current.icon,
                timestamp: Date.now(),
                source: 'visualcrossing'
            };
        } catch (error) {
            console.error('Visual Crossing fetch error:', error);
            return null;
        }
    }

    async getVisualCrossingForecast(location: string = 'Dublin,Ireland', days: number = 7): Promise<DailyForecast[]> {
        if (!this.visualCrossingKey || this.visualCrossingKey === 'your_visual_crossing_key_here') return [];

        try {
            const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?key=${this.visualCrossingKey}&unitGroup=metric`;
            const response = await fetch(url);

            if (!response.ok) return [];

            const data = await response.json();

            // Track API call
            await this.trackAPICall('visualcrossing');

            return data.days.slice(0, days).map((day: any) => ({
                date: new Date(day.datetime),
                tempHigh: day.tempmax,
                tempLow: day.tempmin,
                conditions: day.conditions,
                icon: day.icon,
                precipitation: day.precip,
                humidity: day.humidity,
                windSpeed: day.windspeed
            }));
        } catch (error) {
            console.error('Visual Crossing forecast error:', error);
            return [];
        }
    }

    // ========================================
    // API #4: Open-Meteo (FREE UNLIMITED!)
    // ========================================

    async getOpenMeteoCurrent(lat: number = 53.3498, lon: number = -6.2603): Promise<CurrentWeather | null> {
        try {
            const params = {
                latitude: lat,
                longitude: lon,
                current: ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation', 'wind_speed_10m', 'wind_direction_10m']
            };
            const url = 'https://api.open-meteo.com/v1/forecast';
            const responses = await fetchWeatherApi(url, params);
            const response = responses[0];

            // Track API call
            await this.trackAPICall('openmeteo');

            const current = response.current()!;

            return {
                location: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
                latitude: lat,
                longitude: lon,
                temperature: current.variables(0)!.value(),
                feelsLike: current.variables(2)!.value(),
                humidity: current.variables(1)!.value(),
                pressure: 0, // Not available in free tier
                windSpeed: current.variables(4)!.value(),
                windDirection: current.variables(5)!.value(),
                cloudCover: 0, // Not in current params
                visibility: 0, // Not available
                uvIndex: 0, // Not in current params
                conditions: 'Open-Meteo Data',
                icon: '01d',
                timestamp: Date.now(),
                source: 'openmeteo'
            };
        } catch (error) {
            console.error('Open-Meteo fetch error:', error);
            return null;
        }
    }

    async getOpenMeteoHourly(lat: number = 53.3498, lon: number = -6.2603): Promise<HourlyForecast[]> {
        try {
            const params = {
                latitude: lat,
                longitude: lon,
                hourly: ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'precipitation', 'wind_speed_10m']
            };
            const url = 'https://api.open-meteo.com/v1/forecast';
            const responses = await fetchWeatherApi(url, params);
            const response = responses[0];

            // Track API call
            await this.trackAPICall('openmeteo');

            const hourly = response.hourly()!;
            const utcOffsetSeconds = response.utcOffsetSeconds();

            const times = Array.from(
                { length: Math.min(24, (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval()) },
                (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
            );

            const temp = hourly.variables(0)?.valuesArray() ?? [];
            const feelsLike = hourly.variables(1)?.valuesArray() ?? [];
            const humidity = hourly.variables(2)?.valuesArray() ?? [];
            const precip = hourly.variables(3)?.valuesArray() ?? [];
            const windSpeed = hourly.variables(4)?.valuesArray() ?? [];

            return times.map((time, i) => ({
                time,
                temperature: temp[i] ?? null,
                feelsLike: feelsLike[i] ?? null,
                humidity: humidity[i] ?? null,
                precipitation: precip[i] ?? null,
                windSpeed: windSpeed[i] ?? null,
                conditions: 'Open-Meteo',
                icon: '01d'
            }));
        } catch (error) {
            console.error('Open-Meteo hourly error:', error);
            return [];
        }
    }

    // ========================================
    // FUSION SERVICE (Best of All 4 APIs!)
    // ========================================

    async getCurrentWeather(location: string = 'Dublin,IE'): Promise<CurrentWeather | null> {
        // Try Tomorrow.io first (most detailed)
        let weather = await this.getTomorrowCurrent(53.3498, -6.2603);
        if (weather) return weather;

        // Fallback to OpenWeatherMap
        weather = await this.getOpenWeatherCurrent(location);
        if (weather) return weather;

        // Fallback to Visual Crossing
        weather = await this.getVisualCrossingCurrent('Dublin,Ireland');
        if (weather) return weather;

        // Last resort: Open-Meteo
        return await this.getOpenMeteoCurrent(53.3498, -6.2603);
    }

    async getCompleteWeatherSnapshot(location: string = 'Dublin,IE'): Promise<WeatherSnapshot> {
        const current = await this.getCurrentWeather(location);
        const hourly = await this.getOpenMeteoHourly();
        const daily = await this.getVisualCrossingForecast('Dublin,Ireland');
        const airQuality = current ? await this.getOpenWeatherAirQuality(current.latitude, current.longitude) : null;

        const snapshot: WeatherSnapshot = {
            id: `weather_${Date.now()}`,
            timestamp: Date.now(),
            location,
            current: current || this.getDefaultWeather(),
            hourly,
            daily,
            airQuality: airQuality || undefined,
            source: 'fusion-4api'
        };

        // Save to database
        await this.saveWeatherSnapshot(snapshot);

        return snapshot;
    }

    // ========================================
    // DATABASE OPERATIONS
    // ========================================

    async saveWeatherSnapshot(snapshot: WeatherSnapshot): Promise<void> {
        try {
            await dbService.saveWeatherSnapshot(snapshot);
        } catch (error) {
            console.error('Failed to save weather snapshot:', error);
        }
    }

    async getWeatherHistory(hours: number = 24): Promise<WeatherSnapshot[]> {
        try {
            return await dbService.getWeatherHistory(hours);
        } catch (error) {
            console.error('Failed to get weather history:', error);
            return [];
        }
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    private getWeatherCondition(code: number): string {
        const conditions: Record<number, string> = {
            1000: 'Clear',
            1100: 'Mostly Clear',
            1101: 'Partly Cloudy',
            1102: 'Mostly Cloudy',
            1001: 'Cloudy',
            2000: 'Fog',
            4000: 'Drizzle',
            4001: 'Rain',
            4200: 'Light Rain',
            4201: 'Heavy Rain',
            5000: 'Snow',
            5001: 'Flurries',
            5100: 'Light Snow',
            5101: 'Heavy Snow',
            6000: 'Freezing Drizzle',
            6001: 'Freezing Rain',
            7000: 'Ice Pellets',
            8000: 'Thunderstorm'
        };
        return conditions[code] || 'Unknown';
    }

    private getWeatherIcon(code: number): string {
        if (code === 1000) return '01d';
        if (code >= 1100 && code <= 1102) return '02d';
        if (code === 1001) return '03d';
        if (code === 2000) return '50d';
        if (code >= 4000 && code <= 4201) return '10d';
        if (code >= 5000 && code <= 5101) return '13d';
        if (code === 8000) return '11d';
        return '01d';
    }

    private getDefaultWeather(): CurrentWeather {
        return {
            location: 'Dublin',
            latitude: 53.3498,
            longitude: -6.2603,
            temperature: 15,
            feelsLike: 15,
            humidity: 70,
            pressure: 1013,
            windSpeed: 10,
            windDirection: 180,
            cloudCover: 50,
            visibility: 10,
            uvIndex: 0,
            conditions: 'No data',
            icon: '01d',
            timestamp: Date.now(),
            source: 'openweather'
        };
    }

    // ========================================
    // Rain Detection (for Irish Weather! ☔🇮🇪)
    // ========================================

    async checkForUpcomingRain(
        location: string,
        hoursAhead: number,
        lat: number = 53.3498,
        lon: number = -6.2603
    ): Promise<RainAlert> {
        try {
            // Use Open-Meteo for hourly forecast (FREE & UNLIMITED!)
            const hourly = await this.getOpenMeteoHourly(lat, lon);

            if (!hourly || hourly.length === 0) {
                return {
                    willRain: false,
                    hoursUntilRain: 0,
                    precipitation: 0,
                    location,
                    timeDetected: Date.now()
                };
            }

            // Check each hour within the specified time window
            const now = Date.now();
            let firstRainHour: HourlyForecast | null = null;
            let maxPrecipitation = 0;

            for (const forecast of hourly) {
                const forecastTime = new Date(forecast.time).getTime();
                const hoursFromNow = (forecastTime - now) / (1000 * 60 * 60);

                // Check if within our time window
                if (hoursFromNow > 0 && hoursFromNow <= hoursAhead) {
                    // Check if rain is expected (precipitation > 0.5mm is noticeable)
                    if (forecast.precipitation && forecast.precipitation > 0.5) {
                        if (!firstRainHour) {
                            firstRainHour = forecast;
                        }
                        maxPrecipitation = Math.max(maxPrecipitation, forecast.precipitation);
                    }
                }
            }

            if (firstRainHour) {
                const forecastTime = new Date(firstRainHour.time).getTime();
                const hoursUntilRain = (forecastTime - now) / (1000 * 60 * 60);

                return {
                    willRain: true,
                    hoursUntilRain,
                    precipitation: maxPrecipitation,
                    location,
                    timeDetected: now
                };
            }

            return {
                willRain: false,
                hoursUntilRain: 0,
                precipitation: 0,
                location,
                timeDetected: now
            };
        } catch (error) {
            console.error('Rain detection error:', error);
            return {
                willRain: false,
                hoursUntilRain: 0,
                precipitation: 0,
                location,
                timeDetected: Date.now()
            };
        }
    }

    // ========================================
    // HISTORICAL DATA (The "Historian")
    // ========================================

    async getVisualCrossingHistory(location: string = 'Dublin,Ireland', date: Date): Promise<CurrentWeather | null> {
        if (!this.visualCrossingKey || this.visualCrossingKey === 'your_visual_crossing_key_here') return null;

        try {
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}/${dateStr}/${dateStr}?key=${this.visualCrossingKey}&unitGroup=metric&include=days`;
            const response = await fetch(url);

            if (!response.ok) return null;

            const data = await response.json();
            const day = data.days[0];

            // Track API call
            await this.trackAPICall('visualcrossing');

            return {
                location: data.resolvedAddress,
                latitude: data.latitude,
                longitude: data.longitude,
                temperature: day.temp,
                feelsLike: day.feelslike,
                humidity: day.humidity,
                pressure: day.pressure,
                windSpeed: day.windspeed,
                windDirection: day.winddir,
                windGust: day.windgust,
                cloudCover: day.cloudcover,
                visibility: day.visibility,
                uvIndex: day.uvindex,
                conditions: day.conditions,
                icon: day.icon,
                timestamp: new Date(day.datetime).getTime(),
                source: 'visualcrossing'
            };
        } catch (error) {
            console.error('Visual Crossing history error:', error);
            return null;
        }
    }

    // ========================================
    // ALERTS (The "Guardian")
    // ========================================

    async getWeatherAlerts(location: string = 'Dublin,Ireland'): Promise<string[]> {
        if (!this.visualCrossingKey || this.visualCrossingKey === 'your_visual_crossing_key_here') return [];

        try {
            const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?key=${this.visualCrossingKey}&unitGroup=metric&include=alerts`;
            const response = await fetch(url);

            if (!response.ok) return [];

            const data = await response.json();

            // Track API call
            await this.trackAPICall('visualcrossing');

            if (data.alerts && data.alerts.length > 0) {
                return data.alerts.map((alert: any) => `${alert.event}: ${alert.headline}`);
            }
            return [];
        } catch (error) {
            console.error('Visual Crossing alerts error:', error);
            return [];
        }
    }
}

export const weatherService = new WeatherService();
