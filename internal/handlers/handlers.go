package handlers

import (
	"log/slog"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"text/template"

	"driffaud.fr/himinn/internal/api"
	"driffaud.fr/himinn/internal/models"
)

type Handlers struct {
	tmpl      *template.Template
	photonAPI *api.PhotonClient
	logger    *slog.Logger
}

func New(templatePath string, logger *slog.Logger) (*Handlers, error) {
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		return nil, err
	}

	return &Handlers{
		tmpl:      tmpl,
		photonAPI: api.NewPhotonClient(),
		logger:    logger,
	}, nil
}

func (h *Handlers) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/", h.handleIndex)
	mux.HandleFunc("/search", h.handleSearch)
	mux.HandleFunc("/place/", h.handlePlace)
}

func (h *Handlers) handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		data := models.PageData{}
		if err := h.tmpl.Execute(w, data); err != nil {
			h.logger.Error("error while executing template", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	placeName, err := url.PathUnescape(r.URL.Path[1:])
	if err != nil {
		http.Error(w, "Invalid place name", http.StatusBadRequest)
		return
	}
	places, err := h.photonAPI.Search(placeName)
	if err != nil {
		h.logger.Error("error searching place details", "error", err, "placeName", placeName)
		http.Error(w, "Error retrieving place details", http.StatusInternalServerError)
		return
	}

	var place models.Place
	found := false
	for _, p := range places {
		if p.Name == placeName {
			place = p
			found = true
			break
		}
	}

	if !found {
		http.Error(w, "Place not found", http.StatusNotFound)
		return
	}

	data := models.PageData{
		Results: []models.Place{place},
	}

	if err := h.tmpl.Execute(w, data); err != nil {
		h.logger.Error("error while executing template", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *Handlers) handleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseForm(); err != nil {
		h.logger.Error("error parsing form", "error", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	query := r.FormValue("query")
	if query == "" {
		data := models.PageData{
			Error: "Please enter a search query",
		}

		h.tmpl.Execute(w, data)
		return
	}

	places, err := h.photonAPI.Search(query)
	if err != nil {
		h.logger.Error("error searching places", "error", err, "query", query)
		data := models.PageData{
			Query: query,
			Error: "Error searching for places: " + err.Error(),
		}

		h.tmpl.Execute(w, data)
		return
	}

	if len(places) == 1 {
		placeName := places[0].CreateURLSlug()
		url := "/place/" + placeName
		http.Redirect(w, r, url, http.StatusSeeOther)
		return
	}

	data := models.PageData{
		Query:   query,
		Results: places,
	}

	if len(places) == 0 {
		data.Error = "No places found matching your search"
	}

	h.tmpl.Execute(w, data)
}

func (h *Handlers) handlePlace(w http.ResponseWriter, r *http.Request) {
	placeSlug := strings.TrimPrefix(r.URL.Path, "/place/")
	if placeSlug == "" {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	placeName := placeSlug
	var targetLat, targetLon float64

	if parts := strings.Split(placeSlug, "@"); len(parts) == 2 {
		placeName = parts[0]

		coords := strings.Split(parts[1], ",")
		if len(coords) == 2 {
			var err1, err2 error
			targetLat, err1 = strconv.ParseFloat(coords[0], 64)
			targetLon, err2 = strconv.ParseFloat(coords[1], 64)
			if err1 != nil || err2 != nil {
				targetLat, targetLon = 0, 0
			}
		}
	}

	decodedName, err := url.QueryUnescape(placeName)
	if err != nil {
		http.Error(w, "Invalid place name", http.StatusBadRequest)
		return
	}

	places, err := h.photonAPI.Search(decodedName)
	if err != nil {
		h.logger.Error("error searching place details", "error", err, "placeName", placeName)
		http.Error(w, "Error retrieving place details", http.StatusInternalServerError)
		return
	}

	var place models.Place
	found := false

	for _, p := range places {
		if strings.EqualFold(p.Name, decodedName) {
			if (targetLat != 0 && targetLon != 0 &&
				math.Abs(p.Lat-targetLat) < 0.01 && math.Abs(p.Lon-targetLon) < 0.01) ||
				(targetLat == 0 && targetLon == 0) {
				place = p
				found = true
				break
			}
		}
	}

	if !found && len(places) > 0 {
		place = places[0]
		found = true
	}

	if !found {
		http.Error(w, "Place not found", http.StatusNotFound)
		return
	}

	data := models.PageData{
		Results: []models.Place{place},
	}

	if err := h.tmpl.Execute(w, data); err != nil {
		h.logger.Error("error while executing template", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
