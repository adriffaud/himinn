defmodule Himinn.Forecast do
  require Logger

  @open_meteo_base "https://api.open-meteo.com/v1/forecast"

  @spec get_forecast(float(), float()) :: {:ok, map()} | {:error, any()}
  def get_forecast(lat, lon) do
    Logger.debug("Getting forecast for #{lat}, #{lon}")

    params =
      [
        "latitude=#{lat}",
        "longitude=#{lon}",
        "current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation_probability,dew_point_2m",
        "hourly=precipitation_probability,dew_point_2m,temperature_2m,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_direction_10m",
        "daily=sunrise,sunset",
        "timezone=auto",
        "forecast_days=7",
        "models=best_match"
      ]
      |> Enum.join("&")

    "#{@open_meteo_base}?#{params}"
    |> Req.get()
    |> parse_response()
  end

  defp parse_response({:error, err}) do
    Logger.error("error while retrieving forecast: #{inspect(err)}")
    []
  end

  defp parse_response({:ok, resp}) do
    resp.body
  end
end
