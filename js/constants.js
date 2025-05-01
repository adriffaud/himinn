// APIs base URLs
const PHOTON_API_BASE_URL = "https://photon.komoot.io/api";
const OPEN_METEO_API_BASE_URL = "https://api.open-meteo.com/v1/forecast";

// Cache constants
const CACHE_TIMESTAMP_KEY = "weather_timestamp";
const CACHE_KEY = "weather";
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// Weather data refresh interval
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Astro constants
const ASTRONOMICAL_DUSK_OFFSET_MS = 2 * 60 * 60 * 1000; // 2 hours
const ASTRONOMICAL_DAWN_OFFSET_MS = -2 * 60 * 60 * 1000; // -2 hours

export default {
  PHOTON_API_BASE_URL,
  OPEN_METEO_API_BASE_URL,
  CACHE_TIMESTAMP_KEY,
  CACHE_KEY,
  CACHE_EXPIRATION_MS,
  REFRESH_INTERVAL_MS,
  ASTRONOMICAL_DAWN_OFFSET_MS,
  ASTRONOMICAL_DUSK_OFFSET_MS,
};
