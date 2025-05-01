const PHOTON_API_BASE_URL = "https://photon.komoot.io/api";
const OPEN_METEO_API_BASE_URL = "https://api.open-meteo.com/v1/forecast";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Cache constants
const CACHE_TIMESTAMP_KEY = "weather_timestamp";
const CACHE_KEY = "weather";
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

const searchResultsContainer = document.getElementById("result");
const locationSearchInput = document.getElementById("place_search");
let refreshTimerId = null;

function debounce(funcToDebounce, delayMs) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      funcToDebounce.apply(this, args);
    }, delayMs);
  };
}

function formatTimeHHMM(dateTime) {
  return `${dateTime.getHours()}h${dateTime.getMinutes().toString().padStart(2, "0")}`;
}

function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || "");
  }, "");
}

function startRefreshTimer(location) {
  if (refreshTimerId) {
    clearInterval(refreshTimerId);
  }

  refreshTimerId = setInterval(() => {
    console.log("Auto-refreshing weather data");
    displayLocationWeather(location);
  }, REFRESH_INTERVAL_MS);
}

function selectLocation(location) {
  localStorage.setItem("selectedLocation", JSON.stringify(location));
  searchResultsContainer.textContent = "";
  displayLocationWeather(location);
}

function getWeatherTimestamp() {
  return localStorage.getItem(CACHE_TIMESTAMP_KEY);
}

async function getWeatherData(location) {
  const cachedData = localStorage.getItem(CACHE_KEY);

  if (cachedData) {
    const weatherCache = JSON.parse(cachedData);
    const currentTimeMs = new Date().getTime();

    if (currentTimeMs - getWeatherTimestamp() < CACHE_EXPIRATION_MS) {
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

function renderHourlyForecast(forecast) {
  return html`
    <tr>
      <td>${forecast.hour.toString()}h</td>
      <td>${forecast.clouds.toString()}%</td>
      <td>${forecast.precipitation.toString()}%</td>
      <td
        style="background-color: var(--ctp-red); color: var(--ctp-crust); font-weight: bold;"
      >
        TODO
      </td>
      <td>${forecast.windSpeed}km/h</td>
      <td>${forecast.humidty}%</td>
      <td>${forecast.temperature}°C</td>
      <td>${forecast.dewPoint}°C</td>
    </tr>
  `;
}

function calculateAstronomicalNightPeriod(weatherData) {
  const currentDateTime = new Date();

  // Calculate astronomical dusk (18 degrees below horizon after sunset)
  // For astronomical purposes, dusk is ~2 hours after sunset
  let eveningSunsetTime = new Date(weatherData.daily.sunset[0]);
  const ASTRONOMICAL_DUSK_OFFSET_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  eveningSunsetTime = new Date(
    eveningSunsetTime.getTime() + ASTRONOMICAL_DUSK_OFFSET_MS,
  );

  // Calculate astronomical dawn (18 degrees below horizon before sunrise)
  // For astronomical purposes, dawn is ~2 hours before sunrise
  let morningSunriseTime = new Date(weatherData.daily.sunrise[1]);
  const ASTRONOMICAL_DAWN_OFFSET_MS = -2 * 60 * 60 * 1000; // -2 hours in milliseconds
  morningSunriseTime = new Date(
    morningSunriseTime.getTime() + ASTRONOMICAL_DAWN_OFFSET_MS,
  );

  // If we're currently in the astronomical night period, use today's sunset and tomorrow's sunrise
  if (
    currentDateTime > eveningSunsetTime &&
    currentDateTime < morningSunriseTime
  ) {
    // Keep the times as calculated - we're in the astronomical night
    console.log("Currently in astronomical night");
  } else if (currentDateTime > morningSunriseTime) {
    // If we're past dawn, use tonight's sunset and tomorrow's sunrise
    eveningSunsetTime = new Date(weatherData.daily.sunset[0]);
    eveningSunsetTime = new Date(
      eveningSunsetTime.getTime() + ASTRONOMICAL_DUSK_OFFSET_MS,
    );

    // Use tomorrow's sunrise if available, otherwise keep today's
    if (weatherData.daily.sunrise.length > 1) {
      morningSunriseTime = new Date(weatherData.daily.sunrise[1]);
      morningSunriseTime = new Date(
        morningSunriseTime.getTime() + ASTRONOMICAL_DAWN_OFFSET_MS,
      );
    }
  }

  return { eveningSunsetTime, morningSunriseTime };
}

function calculateExtremeCloudCover(nightForecast) {
  if (nightForecast.length === 0) {
    return 0;
  }

  return 0;
}

async function displayLocationWeather(location) {
  const locationInfoElement = document.getElementById("place");
  locationInfoElement.innerHTML = `<h1>${location.name}</h1><p>Loading...</p>`;

  try {
    const weatherData = await getWeatherData(location);

    const hourlyForecast = weatherData.hourly.time.map((time, index) => ({
      dateTime: new Date(time),
      hour: new Date(time).getHours(),
      clouds: weatherData.hourly.cloud_cover[index],
      clouds_low: weatherData.hourly.cloud_cover_low[index],
      clouds_mid: weatherData.hourly.cloud_cover_mid[index],
      clouds_high: weatherData.hourly.cloud_cover_high[index],
      temperature: weatherData.hourly.temperature_2m[index],
      windSpeed: weatherData.hourly.wind_speed_10m[index],
      windDirection: weatherData.hourly.wind_direction_10m[index],
      humidty: weatherData.hourly.relative_humidity_2m[index],
      dewPoint: weatherData.hourly.dew_point_2m[index],
      precipitation: weatherData.hourly.precipitation_probability[index],
    }));

    const { eveningSunsetTime, morningSunriseTime } =
      calculateAstronomicalNightPeriod(weatherData);

    const nightForecast = hourlyForecast.filter(
      ({ dateTime }) =>
        dateTime >= eveningSunsetTime && dateTime <= morningSunriseTime,
    );

    const extremeCloudCover = calculateExtremeCloudCover(nightForecast);
    console.log({ nightForecast, extremeCloudCover });

    const hourlyTable = hourlyForecast
      .filter((forecast) => forecast.dateTime >= new Date())
      .slice(0, 24)
      .map(renderHourlyForecast)
      .join("");

    locationInfoElement.innerHTML = html`
      <h1>${location.name}</h1>
      <p>
        Dernière mise à jour :
        ${formatTimeHHMM(new Date(parseInt(getWeatherTimestamp()))) ||
        new Date(getWeatherTimestamp())}
      </p>
      <p>
        Nuit astro : ${formatTimeHHMM(eveningSunsetTime)} -
        ${formatTimeHHMM(morningSunriseTime)}
      </p>
      <div class="night-overview"></div>
      <table class="hourly-forecast">
        <thead>
          <tr>
            <th>Heure</th>
            <th>Nuages</th>
            <th>Précipitations</th>
            <th>Seeing</th>
            <th>Vent</th>
            <th>Humidité</th>
            <th>Température</th>
            <th>Point de rosée</th>
          </tr>
        </thead>
        <tbody>
          ${hourlyTable}
        </tbody>
      </table>
    `;
  } catch (error) {
    locationInfoElement.innerHTML = `<h1>${location.name}</h1><p>Error loading weather data: ${error.message}</p>`;
    console.error("Error loading weather data:", error);
  }
}

async function handleLocationSearch(event) {
  if (event.target.value === "") {
    searchResultsContainer.textContent = "";
    return;
  }

  searchResultsContainer.textContent = "Loading...";

  const params = new URLSearchParams({
    q: event.target.value,
    lang: "fr",
    limit: 10,
  });
  params.append("osm_tag", "place:city");
  params.append("osm_tag", "place:town");
  params.append("osm_tag", "place:village");

  const response = await fetch(`${PHOTON_API_BASE_URL}?${params.toString()}`);
  const searchResults = await response.json();

  const locationListElement = document.createElement("ul");
  searchResults.features
    .map((locationResult) => {
      const name = locationResult.properties.name;
      const countrycode = locationResult.properties.countrycode;
      const lat = locationResult.geometry.coordinates[1];
      const lon = locationResult.geometry.coordinates[0];

      return { name, countrycode, lat, lon };
    })
    .sort((a, b) => a.countrycode.localeCompare(b.countrycode))
    .forEach((locationItem) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = `${locationItem.name} (${locationItem.countrycode})`;

      link.addEventListener("click", (e) => {
        e.preventDefault();
        selectLocation(locationItem);
      });

      li.appendChild(link);
      locationListElement.appendChild(li);
    });

  searchResultsContainer.innerHTML = "";
  searchResultsContainer.appendChild(locationListElement);
}

locationSearchInput.addEventListener(
  "input",
  debounce(handleLocationSearch, 300),
);

document.addEventListener("DOMContentLoaded", () => {
  const storedLocation = localStorage.getItem("selectedLocation");
  if (storedLocation) {
    const savedLocation = JSON.parse(storedLocation);
    displayLocationWeather(savedLocation);
    startRefreshTimer(savedLocation);
  }
});

window.addEventListener("beforeunload", () => {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
  }
});
