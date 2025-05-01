# Himinn 🌌 - Astronomical Weather Forecast

Himinn is a web-based tool that helps amateur astronomers and stargazers determine the best times for night sky observation. It provides detailed weather forecasts focusing on astronomical viewing conditions.

## ✨ Features

- Location search with global coverage
- Detailed hourly weather forecasts including:
  - Cloud cover (overall, low, mid, and high)
  - Precipitation probability
  - Wind speed and direction
  - Humidity and dew point
  - Temperature
- Astronomical night period calculation (astronomical dusk to dawn)
- Weather data caching to minimize API requests
- Mobile-friendly responsive design

## 🚀 Usage

1. Search for your location in the search bar
2. View the detailed hourly weather forecast
3. Check the astronomical night period (optimal time for stargazing)
4. Plan your observation based on cloud cover and other conditions

Weather data automatically refreshes every 10 minutes to keep forecasts current.

## 🔧 Technical Details

Himinn is built with vanilla JavaScript and uses:
- [Open-Meteo API](https://open-meteo.com/) for weather data
- [Photon API](https://photon.komoot.io/) for location search
- Local storage for caching
- Catppuccin color scheme for a pleasant dark interface

## 💻 Development

To run the project locally:

1. Clone the repository
2. Open `index.html` in your browser (no build step required)
3. For development, a simple HTTP server is recommended:
   ```
   npx servor
   ```

## 📄 License

Himinn is licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](https://www.gnu.org/licenses/agpl-3.0.en.html).

## 🙏 Acknowledgements

- [Open-Meteo](https://open-meteo.com/) for the free weather API
- [Photon](https://photon.komoot.io/) for the location search API
- [Catppuccin](https://github.com/catppuccin/catppuccin) for the color palette
