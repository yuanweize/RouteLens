# RouteLens Makefile
# Version is read from .github/.release-please-manifest.json (single source of truth)

SHELL := /bin/bash
VERSION := $(shell cat .github/.release-please-manifest.json | grep -o '"\.": "[^"]*"' | cut -d'"' -f4)
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS := -s -w -X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE)

# Output directories
BUILD_DIR := build
BINARY_NAME := routelens

.PHONY: all build build-linux build-darwin build-windows clean test frontend version help

# Default target
all: frontend build

# Show current version
version:
	@echo "Version: $(VERSION)"
	@echo "Commit:  $(COMMIT)"
	@echo "Date:    $(DATE)"

# Build for current platform
build:
	@echo "Building $(BINARY_NAME) v$(VERSION) for current platform..."
	CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/server
	@echo "Built: $(BUILD_DIR)/$(BINARY_NAME)"

# Build for Linux amd64
build-linux:
	@echo "Building $(BINARY_NAME) v$(VERSION) for Linux amd64..."
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY_NAME)_linux ./cmd/server
	@echo "Built: $(BUILD_DIR)/$(BINARY_NAME)_linux"

# Build for Linux arm64
build-linux-arm64:
	@echo "Building $(BINARY_NAME) v$(VERSION) for Linux arm64..."
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY_NAME)_linux_arm64 ./cmd/server
	@echo "Built: $(BUILD_DIR)/$(BINARY_NAME)_linux_arm64"

# Build for macOS
build-darwin:
	@echo "Building $(BINARY_NAME) v$(VERSION) for macOS..."
	GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY_NAME)_darwin ./cmd/server
	@echo "Built: $(BUILD_DIR)/$(BINARY_NAME)_darwin"

# Build for Windows
build-windows:
	@echo "Building $(BINARY_NAME) v$(VERSION) for Windows..."
	GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY_NAME).exe ./cmd/server
	@echo "Built: $(BUILD_DIR)/$(BINARY_NAME).exe"

# Build all platforms
build-all: build-linux build-linux-arm64 build-darwin build-windows
	@echo "All platforms built successfully!"

# Build frontend
frontend:
	@echo "Building frontend..."
	cd web && npm install && npm run build
	@echo "Frontend built successfully!"

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)/*
	rm -rf web/dist

# Deploy to server (requires SSH key and server IP)
deploy: build-linux
	@if [ -z "$(SERVER)" ]; then echo "Usage: make deploy SERVER=user@host"; exit 1; fi
	@echo "Deploying to $(SERVER)..."
	scp $(BUILD_DIR)/$(BINARY_NAME)_linux $(SERVER):/tmp/routelens_new
	ssh $(SERVER) "systemctl stop routelens && cp /tmp/routelens_new /opt/routelens/routelens && chmod +x /opt/routelens/routelens && systemctl start routelens"
	@echo "Deployed successfully!"

# Help
help:
	@echo "RouteLens Build System"
	@echo ""
	@echo "Version management:"
	@echo "  - Edit .github/.release-please-manifest.json to change version"
	@echo "  - Current version: $(VERSION)"
	@echo ""
	@echo "Targets:"
	@echo "  make version      - Show current version info"
	@echo "  make build        - Build for current platform"
	@echo "  make build-linux  - Build for Linux amd64"
	@echo "  make build-darwin - Build for macOS"
	@echo "  make build-windows- Build for Windows"
	@echo "  make build-all    - Build for all platforms"
	@echo "  make frontend     - Build frontend only"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make deploy SERVER=user@host - Deploy to server"
	@echo "  make help         - Show this help"
