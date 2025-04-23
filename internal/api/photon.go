package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"driffaud.fr/himinn/internal/models"
)

const baseURL = "https://photon.komoot.io/api/"

type PhotonClient struct {
	client *http.Client
}

type photonResponse struct {
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

func NewPhotonClient() *PhotonClient {
	return &PhotonClient{
		client: &http.Client{Timeout: 5 * time.Second},
	}
}

func (pc *PhotonClient) Search(query string) ([]models.Place, error) {
	apiUrl := fmt.Sprintf(
		"%s?q=%s&limit=10&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village",
		baseURL,
		url.QueryEscape(query),
	)

	resp, err := pc.client.Get(apiUrl)
	if err != nil {
		return nil, fmt.Errorf("failed to request Photon API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Photon API returned non-OK status: %s", resp.Status)
	}

	var photonResp photonResponse
	if err := json.NewDecoder(resp.Body).Decode(&photonResp); err != nil {
		return nil, fmt.Errorf("failed to decode Photon API response: %w", err)
	}

	places := make([]models.Place, 0, len(photonResp.Features))
	for _, feature := range photonResp.Features {
		props := feature.Properties
		name := props.Name
		if name == "" {
			name = "Unnamed location"
		}

		place := models.Place{
			Name:        name,
			Description: buildDescription(props.City, props.State, props.Country),
			Lat:         0,
			Lon:         0,
		}

		if len(feature.Geometry.Coordinates) >= 2 {
			place.Lon = feature.Geometry.Coordinates[0]
			place.Lat = feature.Geometry.Coordinates[1]
		}

		places = append(places, place)
	}

	return places, nil
}

func buildDescription(city, state, country string) string {
	var descParts []string

	if city != "" {
		descParts = append(descParts, city)
	}
	if state != "" {
		descParts = append(descParts, state)
	}
	if country != "" {
		descParts = append(descParts, country)
	}

	return strings.Join(descParts, ", ")
}
