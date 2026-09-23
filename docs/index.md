---
title: RouteLens Documentation — High-Performance Network Telemetry & Multi-Hop Diagnostics
description: Go-powered agentless network observability platform for pinpointing latency, jitter, and packet loss across local access, transit backbones, and datacenter ingress.
canonical: https://deepwiki.com/yuanweize/RouteLens/
---

# RouteLens Documentation

> **Go-Powered Network Lens for Pinpointing Latency, Jitter, and Packet Loss** — Agentless, non-intrusive multi-hop network telemetry for distributed servers, homelabs, and cloud infrastructure.

---

## 📚 Technical Guides & Deep Dives

1. **[Monitoring Packet Loss & Jitter Between VPS Servers](guides/monitor-vps-packet-loss.md)**  
   Understanding cross-border degradation, three-segment telemetry breakdown (Local vs Backbone vs DC Ingress), and actionable mitigation playbooks.

2. **[Diagnosing Multi-Hop Network Latency and Route Flapping](guides/diagnose-network-latency-multi-hop.md)**  
   Bypassing ICMP rate-limiting illusions, calculating hop-by-hop delta latency ($\Delta RTT$), and mapping carrier Autonomous Systems (ASNs).

3. **[Agentless Remote Network Monitoring via Secure Telemetry](guides/agentless-remote-network-monitoring.md)**  
   Eliminating fragile daemon installations using restricted SSH subsystems, read-only metric collection, and Go-native concurrency.

---

## ⚡ Architecture

RouteLens separates telemetry collection from presentation:
- **Backend**: Go 1.24, Gin, GORM, SQLite, native Go SSH and raw socket engines.
- **Frontend**: React 18, Vite, Ant Design 5, ECharts for responsive time-series visualization.
- **Deployment**: Single self-contained binary, Docker container (GHCR), or systemd service.

---

## 🚀 Quick Start (Docker)

```bash
docker run -d \
  --name routelens \
  --restart unless-stopped \
  -p 8080:8080 \
  -v routelens_data:/app/data \
  ghcr.io/yuanweize/routelens:latest
```

Open `http://localhost:8080` to access the RouteLens Web UI.

---

## 📄 License & Maintainer

Maintained by **Weize Yuan** ([@yuanweize](https://github.com/yuanweize)).  
Licensed under the [MIT License](https://github.com/yuanweize/RouteLens/blob/master/LICENSE).
