# Frontend Build Stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS web-builder

WORKDIR /web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
RUN npm run build

# Build Stage
FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS builder

ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Copy version file for embedding
COPY .github/.release-please-manifest.json ./cmd/server/version.json

# Copy built frontend assets
COPY --from=web-builder /web/dist ./web/dist

# Build with CGO disabled (pure Go sqlite)
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -ldflags="-s -w" -o routelens ./cmd/server

# Final Stage
FROM alpine:latest

WORKDIR /app

# Install Runtime Dependencies
# iputils (ping), mtr (traceroute), openssh-client (for speed test)
# setcap is needed to run ping/mtr without root (if we run as non-root user, but typically docker runs as root or we set caps)
RUN apk add --no-cache iputils mtr openssh-client libcap ca-certificates tzdata

# Create non-root user
RUN addgroup -S routelens && adduser -S routelens -G routelens

# Copy binary from builder
COPY --from=builder /app/routelens /usr/local/bin/routelens

# Set capabilities for raw socket (Ping/MTR)
RUN setcap cap_net_raw+ep /usr/local/bin/routelens

# Create data directory
RUN mkdir -p /data && chown -R routelens:routelens /data

# Switch to non-root user
USER routelens

# Expose API port
EXPOSE 8080

# Environment Defaults
ENV RS_DB_PATH=/data/routelens.db
ENV RS_HTTP_PORT=:8080

CMD ["/usr/local/bin/routelens"]
