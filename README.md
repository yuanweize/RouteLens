# RouteScope

[![Go Report Card](https://goreportcard.com/badge/github.com/yuanweize/RouteScope)](https://goreportcard.com/report/github.com/yuanweize/RouteScope)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**RouteScope** 是一个现代化的网络链路观测平台，专为监测从本地到远程服务器（如跨境 VPS）的链路质量而设计。它能够精确定位丢包节点，分析延迟波动，并安全地评估传输性能，帮助用户规避网络拥堵和流量审查。

**RouteScope** is a modern network link observation platform designed to monitor link quality from local environments to remote servers. It precisely pinpoints packet loss nodes, analyzes latency fluctuations, and safely evaluates transmission performance.

## 🌟 Core Features (核心功能)

*   **🔍 Precision Route Tracking (精准路由追踪)**:
    *   类似 MTR 的可视乎跳数分析。
    *   集成 GeoIP，自动识别并高亮显示每一跳的国家、城市、ISP 信息。
    *   Visual hop-by-hop analysis similar to MTR with GeoIP integration.
*   **🛡️ Non-intrusive Monitoring (非侵入式监测)**:
    *   **无需在服务端安装 Agent**。
    *   利用 SSH/ICMP/TCP 协议进行被动探测。
    *   **No Agent required on the server side**. Uses SSH/ICMP/TCP for passive probing.
*   **📊 Stealth Speed Test (隐蔽测速)**:
    *   模拟真实业务流量（SSH/SFTP），避免被识别为攻击。
    *   支持“高频小包”模式，长期记录链路吞吐趋势。
    *   Simulates real business traffic to avoid detection.
*   **📈 Data Visualization (可视化看板)**:
    *   基于 Web 的现代化仪表盘 (Recharts/ECharts)。
    *   世界地图连线展示，多节点状态一目了然。
*   **💾 Lightweight Storage (轻量存储)**:
    *   内置 SQLite 数据库，无需额外部署复杂的数据库服务。
    *   Built-in SQLite support, zero maintenance required.

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yuanweize/RouteScope.git
cd RouteScope

# Run directly
go run main.go
```

## 🛠️ Architecture

*   **Backend**: Go (Golang)
*   **Frontend**: React / Vite
*   **Database**: SQLite with WAL mode
*   **Protocols**: ICMP, TCP, SSH (SFTP subsystem)

## License

MIT
