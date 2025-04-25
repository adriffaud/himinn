defmodule HiminnWeb.PageController do
  use HiminnWeb, :controller

  def home(conn, _params) do
    render(conn, :home, %{query: ""})
  end
end
