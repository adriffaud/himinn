import constants from "./constants.js";
import {
  calculateAstronomicalNightPeriod,
  calculateAverageSeeingIndex,
} from "./astro.js";

const {
  OPEN_METEO_API_BASE_URL,
  CACHE_KEY,
  CACHE_EXPIRATION_MS,
  CACHE_TIMESTAMP_KEY,
} = constants;

/**
 * Fetches weather data for a specific location
 *
 * @param {Object} location - Object containing location coordinates
 * @param {number} location.lat - Latitude of the location
 * @param {number} location.lon - Longitude of the location
 * @returns {Promise<Object>} - Promise resolving to weather data from the API
 * @throws {Error} - Throws if API request fails or returns invalid data
 */
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

function convertToHourlyForecast(weatherData) {
  return weatherData.hourly.time.map((time, index) => ({
    dateTime: new Date(time),
    hour: new Date(time).getHours(),
    clouds: weatherData.hourly.cloud_cover[index],
    clouds_low: weatherData.hourly.cloud_cover_low[index],
    clouds_mid: weatherData.hourly.cloud_cover_mid[index],
    clouds_high: weatherData.hourly.cloud_cover_high[index],
    temperature: weatherData.hourly.temperature_2m[index],
    windSpeed: weatherData.hourly.wind_speed_10m[index],
    windDirection: weatherData.hourly.wind_direction_10m[index],
    humidity: weatherData.hourly.relative_humidity_2m[index],
    dewPoint: weatherData.hourly.dew_point_2m[index],
    precipitation: weatherData.hourly.precipitation_probability[index],
  }));
}

function calculateWindDirectionAverage(forecasts) {
  const windDirection = forecasts
    .map((forecast) => forecast.windDirection)
    .filter((value) => value !== null);

  const x = windDirection.reduce(
    (acc, direction) => acc + Math.cos((direction * Math.PI) / 180),
    0,
  );
  const y = windDirection.reduce(
    (acc, direction) => acc + Math.sin((direction * Math.PI) / 180),
    0,
  );

  const averageDirection = Math.atan2(y, x) * (180 / Math.PI);
  const roundedDirection = Math.round(averageDirection + 360) % 360;

  if (roundedDirection === null || isNaN(roundedDirection)) {
    return "N/A";
  }

  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const directionIndex = Math.floor((roundedDirection + 22.5) / 45) % 8;
  return directions[directionIndex];
}

function getExtremeCloudCover(nightForecast) {
  return Math.max(...nightForecast.map((forecast) => forecast.clouds));
}

function getMaxPrecipitationProbability(nightForecast) {
  return Math.max(...nightForecast.map((forecast) => forecast.precipitation));
}

function getFilteredHourlyForecast(hourlyForecast) {
  return hourlyForecast
    .filter(
      (forecast) =>
        forecast.dateTime >= new Date() ||
        forecast.dateTime.getHours() === new Date().getHours(),
    )
    .slice(0, 24);
}

function filterNightForecast(
  hourlyForecast,
  eveningSunsetTime,
  morningSunriseTime,
) {
  return hourlyForecast.filter(
    ({ dateTime }) =>
      dateTime >= eveningSunsetTime && dateTime <= morningSunriseTime,
  );
}

function calculateNightlyAverage(forecast, key) {
  const validValues = forecast.filter((item) => item[key] !== null);
  if (validValues.length === 0) return null;

  const sum = validValues.reduce((acc, item) => acc + item[key], 0);
  return Math.floor(Math.round(sum / validValues.length) * 10) / 10;
}

/**
 * Processes raw weather data into structured forecast information
 *
 * @param {Object} weatherData - Raw weather data from the API
 * @returns {Object} - Processed weather data containing hourly forecast and night data
 * @returns {Array} - returns.hourlyForecast - Array of hourly weather forecasts
 * @returns {Object} - returns.nightData - Object containing aggregated night conditions
 * @returns {number} - returns.nightData.extremeCloudCover - Maximum cloud cover during night
 * @returns {number} - returns.nightData.nightTemperature - Average night temperature
 * @returns {number} - returns.nightData.nightHumidity - Average night humidity
 * @returns {number} - returns.nightData.nightWindSpeed - Average wind speed during night
 * @returns {string} - returns.nightData.windDirection - Dominant wind direction during night
 * @returns {number} - returns.nightData.nightDewPoint - Average dew point during night
 * @returns {number} - returns.nightData.maxPrecipitationProbability - Maximum precipitation chance
 * @returns {number} - returns.nightData.seeingIndex - Astronomical seeing conditions index
 * @returns {Date} - returns.nightData.eveningSunsetTime - Time of sunset
 * @returns {Date} - returns.nightData.morningSunriseTime - Time of next sunrise
 */
export function processWeatherData(weatherData) {
  const hourlyForecast = convertToHourlyForecast(weatherData);

  const { eveningSunsetTime, morningSunriseTime } =
    calculateAstronomicalNightPeriod(weatherData);

  const nightForecast = filterNightForecast(
    hourlyForecast,
    eveningSunsetTime,
    morningSunriseTime,
  );

  const extremeCloudCover = getExtremeCloudCover(nightForecast);
  const nightTemperature = calculateNightlyAverage(
    nightForecast,
    "temperature",
  );
  const nightHumidity = calculateNightlyAverage(nightForecast, "humidity");
  const nightWindSpeed = calculateNightlyAverage(nightForecast, "windSpeed");
  const windDirection = calculateWindDirectionAverage(nightForecast);
  const nightDewPoint = calculateNightlyAverage(nightForecast, "dewPoint");
  const maxPrecipitationProbability =
    getMaxPrecipitationProbability(nightForecast);
  const seeingIndex = calculateAverageSeeingIndex(nightForecast);
  const filteredHourlyForecast = getFilteredHourlyForecast(hourlyForecast);

  return {
    hourlyForecast: filteredHourlyForecast,
    nightData: {
      extremeCloudCover,
      nightTemperature,
      nightHumidity,
      nightWindSpeed,
      windDirection,
      nightDewPoint,
      maxPrecipitationProbability,
      seeingIndex,
      eveningSunsetTime,
      morningSunriseTime,
    },
  };
}
