import { debounce, formatTime, html } from "./utils.js";
import { getLocations } from "./location.js";
import { getWeatherData, processWeatherData } from "./weather.js";
import { calculateAstronomicalNightPeriod } from "./astro.js";
import constants from "./constants.js";

const { REFRESH_INTERVAL_MS, CACHE_TIMESTAMP_KEY } = constants;

const searchResultsContainer = document.getElementById("result");
const locationSearchInput = document.getElementById("place_search");
let refreshTimerId = null;

function startRefreshTimer(location) {
  if (refreshTimerId) {
    clearInterval(refreshTimerId);
  }

  refreshTimerId = setInterval(() => {
    console.log("Auto-refreshing weather data");
    displayLocationWeather(location);
  }, REFRESH_INTERVAL_MS);
}

function renderHourlyForecast(forecast) {
  return html`
    <tr>
      <td>${forecast.hour.toString()}h</td>
      <td>${forecast.clouds.toString()}%</td>
      <td>${forecast.precipitation.toString()}%</td>
      <td style="display:none">TODO</td>
      <td>${forecast.windSpeed}km/h</td>
      <td>${forecast.humidity}%</td>
      <td>${forecast.temperature}°C</td>
      <td>${forecast.dewPoint}°C</td>
    </tr>
  `;
}

async function displayLocationWeather(location) {
  const locationInfoElement = document.getElementById("place");
  locationInfoElement.innerHTML = `<h1>${location.name}</h1><p>Loading...</p>`;

  try {
    const weatherData = await getWeatherData(location);
    const { hourlyForecast, nightData } = processWeatherData(weatherData);

    const { eveningSunsetTime, morningSunriseTime } =
      calculateAstronomicalNightPeriod(weatherData);

    const hourlyTable = hourlyForecast.map(renderHourlyForecast).join("");
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    locationInfoElement.innerHTML = html`
      <h1>${location.name}</h1>
      <small>
        Last update: ${formatTime(new Date(parseInt(cacheTimestamp)))}
      </small>
      <div class="night-overview">
        <p>Cloud cover: ${nightData.extremeCloudCover.toString()}%</p>
        <div>
          <p>Seeing: ${nightData.seeingIndex.toString()}/5</p>
          <p>
            Wind: ${nightData.nightWindSpeed.toString()}km/h
            (${nightData.windDirection})
          </p>
          <p>Humidity: ${nightData.nightHumidity.toString()}%</p>
          <p>Temperature: ${nightData.nightTemperature.toString()}°C</p>
          <p>Dew point: ${nightData.nightDewPoint.toString()}°C</p>
          <p>
            Precipitation probability:
            ${nightData.maxPrecipitationProbability.toString()}%
          </p>
        </div>
      </div>
      <p>
        Night period: ${formatTime(eveningSunsetTime)} -
        ${formatTime(morningSunriseTime)}
      </p>
      <table class="hourly-forecast">
        <thead>
          <tr>
            <th>Hour</th>
            <th>Clouds</th>
            <th>Precipitations</th>
            <th style="display: none">Seeing</th>
            <th>Wind</th>
            <th>Humidity</th>
            <th>Temperature</th>
            <th>Dew point</th>
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

function selectLocation(location) {
  localStorage.setItem("selectedLocation", JSON.stringify(location));
  searchResultsContainer.textContent = "";
  displayLocationWeather(location);
}

async function handleLocationSearch(event) {
  if (event.target.value === "") {
    searchResultsContainer.textContent = "";
    return;
  }

  searchResultsContainer.textContent = "Loading...";
  const results = await getLocations(event.target.value);

  const locationListElement = document.createElement("ul");
  results.forEach((locationItem) => {
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
