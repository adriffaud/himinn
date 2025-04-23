package models

import (
	"fmt"
	"net/url"
	"strings"
)

type Place struct {
	Name        string
	Description string
	Lat         float64
	Lon         float64
}

func (p Place) CreateURLSlug() string {
	nameSlug := strings.ToLower(p.Name)
	nameSlug = strings.ReplaceAll(nameSlug, " ", "-")
	nameSlug = url.QueryEscape(nameSlug)
	return nameSlug
}

func (p Place) CreateUniqueURLSlug() string {
	baseSlug := p.CreateURLSlug()
	coordSuffix := fmt.Sprintf("@%.4f,%.4f", p.Lat, p.Lon)
	return baseSlug + coordSuffix
}

type PageData struct {
	Query   string
	Results []Place
	Error   string
}
