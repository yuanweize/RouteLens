```
██████╗  ██████╗ ██╗   ██╗████████╗███████╗██╗     ███████╗███╗   ██╗███████╗
██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██║     ██╔════╝████╗  ██║██╔════╝
██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██║     █████╗  ██╔██╗ ██║███████╗
██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██║     ██╔══╝  ██║╚██╗██║╚════██║
██████╔╝╚██████╔╝╚██████╔╝   ██║   ███████╗███████╗███████╗██║ ╚████║███████║
╚═════╝  ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝
```

[🇨🇳 中文文档](README_CN.md)

# 🛰️ RouteLens

[![Go Report Card](https://goreportcard.com/badge/github.com/yuanweize/RouteLens)](https://goreportcard.com/report/github.com/yuanweize/RouteLens)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/github/v/release/yuanweize/RouteLens?label=Release)](https://github.com/yuanweize/RouteLens/releases)
[![Docker Image](https://img.shields.io/docker/v/ghcr.io/yuanweize/routelens?label=GHCR%20Image&logo=github)](https://github.com/yuanweize/RouteLens/pkgs/container/routelens)

---

## Introduction

RouteLens is a modern, agentless network observability platform that traces paths, measures latency/loss/bandwidth, and visualizes routes end-to-end.

## ✨ Features

- 🌍 **Auto GeoIP Injection**: GeoIP is downloaded automatically from the P3TERX mirror and injected into hop data.
- ⚡ **True Latency Mode**: MTR last-hop analysis ensures accurate target latency and loss.
- 🎨 **Modern UI**: Ant Design v5 with a dark mode algorithm.
- 📊 **Historical Metrics**: Time-series trend charts for latency, loss, and speed.
- 📦 **Single Binary**: One-file deployment with systemd support.
- 🔄 **In-App Updates**: One-click update from Settings → About & Updates (AdGuard Home style).

## 🛠 Architecture

```mermaid
flowchart LR
  A["Scheduler"] --> B["MTR (JSON)"]
  B --> C["Analyzer (Last Hop)"]
  C --> D["SQLite"]
  E["Bootstrapper"] --> F["GeoIP Downloader (P3TERX)"]
  G["Gin API"] --> H["React App (AntD v5)"]
```

## 🚀 Quick Start

### Binary Install (Recommended)

```bash
wget https://github.com/yuanweize/RouteLens/releases/latest/download/routelens_linux
chmod +x routelens_linux
./routelens_linux service install --port 8080
```

Open `http://localhost:8080` → `/setup` to initialize admin. GeoIP will be downloaded automatically on first run.

### Docker Compose

```yaml
version: '3.8'
services:
  routelens:
    image: ghcr.io/yuanweize/routelens:latest
    container_name: routelens
    cap_add:
      - NET_RAW
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    restart: unless-stopped
```

## ⚙️ Configuration

| Env | Description | Default |
| --- | --- | --- |
| RS_PORT | HTTP port (alias) | 8080 |
| RS_HTTP_PORT | HTTP bind address | :8080 |
| RS_DB_PATH | SQLite path | ./data/routelens.db |
| RS_JWT_SECRET | JWT secret | auto-generated |
| RS_GEOIP_PATH | GeoIP dir | ./data/geoip |
| RS_GEOIP_CITY_DB | GeoIP City DB | empty |
| RS_GEOIP_ISP_DB | GeoIP ISP DB | empty |
| RS_PROBE_INTERVAL | Probe interval (seconds) | 30 |

## 📂 Directory Structure

```
.
├── cmd/          # Entrypoints
├── internal/     # API, monitor, auth
├── pkg/          # Prober, storage, geoip
└── web/          # React frontend (Vite)
```

## 🔄 In-App Updates

RouteLens supports one-click updates directly from the web UI, similar to AdGuard Home.

**Requirements:**
- The running process must have **write permission** to its own binary file
- For systemd deployments, ensure the service user owns the binary

**Usage:**
1. Go to **Settings** → **About & Updates** tab
2. Click **Check for Updates**
3. If an update is available, click **Install Update**
4. The service will automatically restart with the new version

> **Note:** If using systemd, the service will exit after update and systemd will restart it automatically.

## License

MIT. See [LICENSE](LICENSE).
