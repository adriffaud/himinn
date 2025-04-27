defmodule Himinn.Places do
  require Logger

  @photon_base "https://photon.komoot.io/api"
  @tags ~w(place:city place:town place:village)a

  def search(query) do
    query
    |> URI.encode()
    |> build_url()
    |> Req.get()
    |> parse_response()
  end

  defp build_url(query) do
    tags = Enum.map_join(@tags, "&", fn tag -> "osm_tag=#{tag}" end)
    "#{@photon_base}?q=#{query}&lang=fr&#{tags}"
  end

  defp parse_response({:error, err}) do
    Logger.error("error while searching for place: #{inspect(err)}")
    []
  end

  defp parse_response({:ok, resp}) do
    Logger.debug("✅ Response: #{inspect(resp.body)}")

    resp.body
    |> Map.get("features")
    |> Enum.map(&map_feature/1)
  end

  defp map_feature(feature) do
    %{
      "properties" => %{"name" => name, "osm_id" => id},
      "geometry" => %{"coordinates" => [lon, lat]}
    } = feature

    slug = Enum.join([to_string(id), Slug.slugify(name)], "-")

    %{id: id, slug: slug, name: name, lat: lat, lon: lon}
  end
end
