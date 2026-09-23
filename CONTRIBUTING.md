# Contributing to RouteLens

Thank you for your interest in contributing to RouteLens! We welcome bug reports, feature suggestions, documentation improvements, and code contributions.

## Development Setup

RouteLens is written in Go 1.24+ with a Vue/Vite frontend.

### Prerequisites
- Go 1.24 or later
- Node.js 20+ and npm (for web frontend assets)
- Docker (optional, for containerized testing)

### Local Build
```bash
# Clone the repository
git clone https://github.com/yuanweize/RouteLens.git
cd RouteLens

# Build backend
go build -o routelens ./cmd/routelens

# Build frontend (if modifying web interface)
cd web && npm install && npm run build && cd ..
```

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names like `feat/ssh-keepalive` or `fix/sqlite-timeout`.
2. **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `docs:`, `chore:`).
3. **Tests**: Ensure tests pass by running `go test ./...`.
4. **Code Quality**: Run `go fmt ./...` and `go vet ./...` before submitting.

## Community Standards

Please ensure discussions remain constructive, respectful, and focused on technical excellence.
