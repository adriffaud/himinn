defmodule HiminnWeb.PageLive.Home do
  use HiminnWeb, :live_view

  alias Himinn.Places

  require Logger

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, :results, [])}
  end

  @impl true
  def handle_event("change", %{"query" => ""}, socket) do
    Logger.debug("🗑️ Resetting results")
    {:noreply, assign(socket, :results, [])}
  end

  @impl true
  def handle_event("change", %{"query" => query}, socket) do
    Logger.debug("❓Searched for: #{query}")
    results = Places.search(query)
    {:noreply, assign(socket, :results, results)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="p-4">
      <form action="" novalidate="" role="search" phx-change="change" class="m-auto max-w-xl">
        <div class="group relative flex h-12">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            class="pointer-events-none absolute left-3 top-0 h-full w-5 stroke-slate-50"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
            >
            </path>
          </svg>

          <input
            id="search-input"
            name="query"
            class="flex-auto rounded-lg appearance-none bg-transparent pl-10 focus:outline-none border-slate-600 focus:border-slate-400 focus:ring-0 focus:shadow-none focus:w-full focus:flex-none sm:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden pr-4"
            style={
              @results != [] &&
                "border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom: none"
            }
            aria-autocomplete="both"
            aria-controls="searchbox__results_list"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            enterkeyhint="search"
            spellcheck="false"
            placeholder="Find a place..."
            type="search"
            value=""
            tabindex="0"
            phx-debounce="500"
          />
        </div>

        <ul
          :if={@results != []}
          class="divide-y divide-slate-400 overflow-y-auto rounded-b-lg border border-slate-400 text-sm leading-6"
          id="searchbox__results_list"
          role="listbox"
        >
          <%= for place <- @results do %>
            <li id={"#{place.id}"}>
              <.link
                navigate={~p"/places/#{place.slug}"}
                class="block p-4 hover:bg-slate-800 focus:outline-none focus:bg-slate-100 focus:text-sky-800"
              >
                {place.name}
              </.link>
            </li>
          <% end %>
        </ul>
      </form>
    </div>
    """
  end
end
