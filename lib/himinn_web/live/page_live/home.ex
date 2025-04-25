defmodule HiminnWeb.PageLive.Home do
  use HiminnWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, :results, [])}
  end

  @impl true
  def handle_event("change", %{"query" => ""}, socket) do
    {:noreply, assign(socket, :results, [])}
  end

  @impl true
  def handle_event("change", %{"query" => query}, socket) do
    # results = Places.search(query)
    results = []
    {:noreply, assign(socket, :results, results)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="border border-red-500">
      <div class="block max-w-xs flex-auto">
        <button
          type="button"
          class="hidden text-gray-500 bg-white hover:ring-gray-500 ring-gray-300 h-8 w-full items-center gap-2 rounded-md pl-2 pr-3 text-sm ring-1 transition lg:flex focus:[&:not(:focus-visible)]:outline-none"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="h-5 w-5 stroke-current">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
            >
            </path>
          </svg>
          Find something...
        </button>
      </div>
      <div class="mx-auto max-w-xl pb-2">
        <input name="city" placeholder="Search a place..." />
      </div>
    </div>
    """
  end
end
