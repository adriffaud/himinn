PROJECT_NAME := himinn
MAIN_PACKAGE := cmd/himinn

GOCMD := go
GOBUILD := $(GOCMD) build
GORUN := $(GOCMD) run
GOTEST := $(GOCMD) test
GOMOD := $(GOCMD) mod
GOVET := $(GOCMD) vet
GOFMT := $(GOCMD) fmt
GOLINT := golangci-lint
AIR := air

BUILD_DIR := build
BINARY_NAME := $(PROJECT_NAME)
BINARY_PATH := $(BUILD_DIR)/$(BINARY_NAME)

.PHONY: all build run test clean fmt lint vet tidy help

all: clean test lint build

build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_PATH) ./$(MAIN_PACKAGE)
	@echo "Build complete: $(BINARY_PATH)"

run:
	$(GORUN) ./$(MAIN_PACKAGE)

test:
	$(GOTEST) -v ./...

clean:
	@echo "Cleaning build directory..."
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete"

fmt:
	$(GOFMT) ./...

lint:
	@which golangci-lint > /dev/null || (echo "Installing golangci-lint..." && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	$(GOLINT) run ./...

vet:
	$(GOVET) ./...

tidy:
	$(GOMOD) tidy

watch:
	@which air > /dev/null || (echo "Installing air..." && go install github.com/air-verse/air@latest)
	$(AIR)

help:
	@echo "Available targets:"
	@echo "  all         - Clean, test, lint, and build the application"
	@echo "  build       - Build the application for Linux"
	@echo "  run         - Run the application"
	@echo "  test        - Run tests"
	@echo "  clean       - Clean build artifacts"
	@echo "  fmt         - Format code"
	@echo "  lint        - Run linter"
	@echo "  vet         - Run Go vet"
	@echo "  tidy        - Tidy go.mod"
	@echo "  help        - Display this help message"
