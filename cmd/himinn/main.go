package main

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

type PageData struct {
	Query   string
	Results []Place
	Error   string
}

type Place struct {
	Name        string
	Description string
	Lat         float64
	Lon         float64
}

type PhotonResponse struct {
	Features []struct {
		Properties struct {
			Name    string `json:"name"`
			City    string `json:"city"`
			State   string `json:"state"`
			Country string `json:"country"`
		} `json:"properties"`
		Geometry struct {
			Coordinates []float64 `json:"coordinates"`
		} `json:"geometry"`
	} `json:"features"`
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	tmpl, err := template.ParseFiles(filepath.Join("templates", "index.html"))
	if err != nil {
		logger.Error("error while parsing template", "error", err)
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			data := PageData{}
			err = tmpl.Execute(w, data)
			if err != nil {
				logger.Error("error while executing template", "error", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
			return
		}

		placeName, err := url.PathUnescape(r.URL.Path[1:])
		if err != nil {
			http.Error(w, "Invalid place name", http.StatusBadRequest)
			return
		}
		places, err := searchPlaces(placeName)
		if err != nil {
			logger.Error("error searching place details", "error", err, "placeName", placeName)
			http.Error(w, "Error retrieving place details", http.StatusInternalServerError)
			return
		}

		var place Place
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

		data := PageData{
			Results: []Place{place},
		}

		err = tmpl.Execute(w, data)
		if err != nil {
			logger.Error("error while executing template", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	})

	mux.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		err := r.ParseForm()
		if err != nil {
			logger.Error("error parsing form", "error", err)
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}

		query := r.FormValue("query")
		if query == "" {
			data := PageData{
				Error: "Please enter a search query",
			}

			tmpl.Execute(w, data)
			return
		}

		places, err := searchPlaces(query)
		if err != nil {
			logger.Error("error searching places", "error", err, "query", query)
			data := PageData{
				Query: query,
				Error: "Error searching for places: " + err.Error(),
			}

			tmpl.Execute(w, data)
			return
		}

		if len(places) == 1 {
			safeName := url.PathEscape(strings.ToLower(places[0].Name))
			http.Redirect(w, r, "/"+safeName, http.StatusSeeOther)
			return
		}

		data := PageData{
			Query:   query,
			Results: places,
		}

		if len(places) == 0 {
			data.Error = "No places found matching your search"
		}

		tmpl.Execute(w, data)
	})

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadTimeout:       5 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       120 * time.Second,
		ReadHeaderTimeout: 2 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	serverErrors := make(chan error, 1)

	go func() {
		logger.Info("starting server", "port", port)
		serverErrors <- srv.ListenAndServe()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		if err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	case sig := <-shutdown:
		logger.Info("shutdown signal received", "signal", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			logger.Error("server shutdown failed", "error", err)

			if err := srv.Close(); err != nil {
				logger.Error("server close failed", "error", err)
			}
			os.Exit(1)
		}

		logger.Info("server gracefully stopped")
	}
}

func searchPlaces(query string) ([]Place, error) {
	apiURL := fmt.Sprintf(
		"https://photon.komoot.io/api/?q=%s&limit=10&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village",
		url.QueryEscape(query),
	)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned non-OK status: %s", resp.Status)
	}

	var photonResp PhotonResponse
	if err := json.NewDecoder(resp.Body).Decode(&photonResp); err != nil {
		return nil, err
	}

	places := make([]Place, 0, len(photonResp.Features))
	for _, feature := range photonResp.Features {
		props := feature.Properties
		var descParts []string

		if props.City != "" {
			descParts = append(descParts, props.City)
		}
		if props.State != "" {
			descParts = append(descParts, props.State)
		}
		if props.Country != "" {
			descParts = append(descParts, props.Country)
		}

		desc := strings.Join(descParts, ", ")

		var lat, lon float64
		if len(feature.Geometry.Coordinates) >= 2 {
			lon = feature.Geometry.Coordinates[0]
			lat = feature.Geometry.Coordinates[1]
		}

		name := props.Name
		if name == "" {
			name = "Unnamed location"
		}

		places = append(places, Place{
			Name:        name,
			Description: desc,
			Lat:         lat,
			Lon:         lon,
		})
	}

	return places, nil
}
