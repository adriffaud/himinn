package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"driffaud.fr/himinn/internal/handlers"
)

type Config struct {
	Port         string
	TemplatePath string
	Logger       *slog.Logger
}

type Server struct {
	server          *http.Server
	logger          *slog.Logger
	ShutdownTimeout time.Duration
}

func New(cfg Config) (*Server, error) {
	handlers, err := handlers.New(cfg.TemplatePath, cfg.Logger)
	if err != nil {
		return nil, err
	}

	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           mux,
		ReadTimeout:       5 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       120 * time.Second,
		ReadHeaderTimeout: 2 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	return &Server{
		server:          srv,
		logger:          cfg.Logger,
		ShutdownTimeout: 10 * time.Second,
	}, nil
}

func (s *Server) Start() error {
	err := s.server.ListenAndServe()
	if errors.Is(err, http.ErrServerClosed) {
		return nil
	}
	return err
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}
