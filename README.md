# Himinn - Astronomy Weather Forecast 🌌 🔭

Himinn is a Phoenix LiveView application that provides astronomy-related weather forecasts to help stargazers and astronomers plan their observations. ✨

## ✨ Features

- 🔍 Location search using the Photon API (based on OpenStreetMap data)
- ☁️ Detailed weather forecasts from OpenMeteo API
- 🌠 Focus on relevant parameters for astronomical observation:
  - ☁️ Cloud cover (low, mid, high)
  - 🌡️ Temperature and humidity
  - 🌧️ Precipitation probability
  - 💨 Wind speed and direction
  - 💧 Dew point (important for telescope use)
- 🌅 Daily sunrise/sunset times
- 📆 7-day forecast to plan observations ahead

## 🚀 Installation

### Prerequisites

- 💎 Elixir 1.14 or higher
- 🏗️ Erlang/OTP 25 or higher

### Setup

1. Clone the repository
```bash
git clone https://code.driffaud.fr/adriffaud/himinn.git
cd himinn
```

2. Install dependencies
```bash
mix deps.get
mix setup
```

3. Start the Phoenix server
```bash
mix phx.server
```

The application will be available at [`localhost:4000`](http://localhost:4000). 🌐

## 👨‍💻 Development

### Project Structure

- `lib/himinn/forecast.ex` - Module for interacting with the OpenMeteo API
- `lib/himinn/places.ex` - Module for location search using Photon API
- `lib/himinn_web/live/page_live/home.ex` - Main LiveView component

### Adding Features

The application uses Phoenix LiveView for real-time updates without JavaScript. To extend the app:

1. Modify the `Forecast` module to fetch additional data from OpenMeteo
2. Update the LiveView rendering in `home.ex` to display the new data
3. Add new routes in `router.ex` if needed

## 📚 Dependencies

- [Phoenix Framework](https://www.phoenixframework.org/)
- [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html)
- [Req](https://hexdocs.pm/req/) - HTTP client for API requests
- [Slugify](https://hexdocs.pm/slugify/) - For URL-friendly location names
- [TailwindCSS](https://tailwindcss.com/) - For styling

## 🌐 APIs Used

- [OpenMeteo](https://open-meteo.com/) - Free weather forecast API
- [Photon](https://photon.komoot.io/) - OpenStreetMap-based geocoding API

## 📝 License

This project is licensed under the AGPL License - see the LICENSE file for details. ⚖️

## 🙏 Acknowledgements

- OpenMeteo for providing free weather forecast data
- Photon and OpenStreetMap for location data
- The Phoenix Framework team
