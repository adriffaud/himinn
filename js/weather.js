import constants from "./constants.js";

const {
  OPEN_METEO_API_BASE_URL,
  CACHE_KEY,
  CACHE_EXPIRATION_MS,
  CACHE_TIMESTAMP_KEY,
} = constants;

export async function getWeatherData(location) {
  const cachedData = localStorage.getItem(CACHE_KEY);

  if (cachedData) {
    const weatherCache = JSON.parse(cachedData);
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const currentTimeMs = new Date().getTime();

    if (currentTimeMs - cacheTimestamp < CACHE_EXPIRATION_MS) {
      console.log("Using cached weather data");
      return weatherCache;
    }
  }

  console.log("Fetching fresh weather data");
  const weatherParams = new URLSearchParams({
    latitude: location.lat,
    longitude: location.lon,
    current:
      "temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation_probability,dew_point_2m",
    hourly:
      "precipitation_probability,dew_point_2m,temperature_2m,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_direction_10m",
    daily: "sunrise,sunset",
    timezone: "auto",
    forecast_days: 7,
    models: "best_match",
  });

  try {
    const response = await fetch(
      `${OPEN_METEO_API_BASE_URL}?${weatherParams.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const weatherData = await response.json();

    if (!weatherData?.daily?.sunset) {
      throw new Error("Invalid weather data format");
    }

    localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime());
    localStorage.setItem(CACHE_KEY, JSON.stringify(weatherData));
    return weatherData;
  } catch (error) {
    console.error("Error loading weather data:", error);
    throw error;
  }
}

export function calculateExtremeCloudCover(nightForecast) {
  if (nightForecast.length === 0) {
    return 0;
  }

  return 0;
}
