defmodule Himinn.Repo do
  use Ecto.Repo,
    otp_app: :himinn,
    adapter: Ecto.Adapters.SQLite3
end
