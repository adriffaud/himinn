package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"driffaud.fr/himinn/internal/server"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv, err := server.New(server.Config{
		Port:         port,
		TemplatePath: "templates/index.html",
		Logger:       logger,
	})
	if err != nil {
		logger.Error("failed to create server", "error", err)
		os.Exit(1)
	}

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("starting server", "port", port)
		serverErrors <- srv.Start()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		if err != nil {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	case sig := <-shutdown:
		logger.Info("shutdown signal received", "signal", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			logger.Error("server shutdown failed", "error", err)
			os.Exit(1)
		}

		logger.Info("server gracefully stopped")
	}
}
