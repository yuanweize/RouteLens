# RouteLens (RouteScope)

[![Go Report Card](https://goreportcard.com/badge/github.com/yuanweize/RouteLens)](https://goreportcard.com/report/github.com/yuanweize/RouteLens)
[![Build Status](https://img.shields.io/github/actions/workflow/status/yuanweize/RouteLens/release.yml?branch=main)](https://github.com/yuanweize/RouteLens/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[🇺🇸 English](README.md)

**RouteLens** 是一个基于 Go 语言构建的现代化网络链路观测平台。它就像一张网络的“X光片”，帮助你精准透视从本地宽带到目标服务器的完整链路。

RouteLens 能够全天候、高频率地监测延迟、丢包率和带宽，帮你回答：*“我的网速慢，究竟是因为本地运营商（ISP）拉胯、国际出口拥堵（如 CN2/9929 炸了），还是目标机房的问题？”*

## 🌟 核心功能

*   **🔍 实时路由追踪 (MTR)**: 基于 Go 原生 Raw Socket 实现的逐跳分析，自动高亮显示丢包节点。
        *   *原生实现:* 无需安装 `mtr` 命令行工具，开箱即用。
*   **🌍 GeoIP 地理可视化**: 自动解析每一跳 IP 的国家、城市与运营商 (ISP) 信息。
*   **🛡️ 静默测速 (Stealth Mode)**: 利用 **SSH 旁路机制**进行高频带宽监测。
        *   **零侵入**: 无需在服务端安装 Agent，仅需 SSH 账号。
        *   **防探测**: 流量特征与普通 SSH 完全一致，避免触发运营商 QoS 或 GFW 阻断。
*   **📊 现代化仪表盘**: 基于 **React** + **Arco Design** + **Apache ECharts** 构建，提供世界地图连线与动态流量波形图。
*   **💾 高性能时序存储**: 内置 SQLite + WAL 模式，单文件存储百万级监控记录。

## 🛠️ 技术架构

```mermaid
graph TD
    User[用户 / 管理员] -->|Web 界面| FE[React 前端]
    FE -->|API 请求| BE[Go 后端服务]
    
    subgraph Core ["探测引擎 (Probe Engine)"]
        ICMP[ICMP 在线监测]
        MTR[MTR 路由追踪]
        SSH[SSH 带宽测速]
    end
    
    BE -->|任务调度| Core
    
    ICMP -->|Raw Socket| Network
    MTR -->|Raw Socket| Network
    SSH -->|加密隧道| RemoteServer[目标 VPS]
    
    Core -->|结果 (Channel)| Writer[异步写入]
    Writer -->|批量入库| DB[(SQLite 数据库)]
    DB -->|JSON 数据| FE
```

## 🚀 部署方案分析

RouteLens 的核心价值在于监控 **“从你家/公司到目标服务器”** 的质量，因此部署位置至关重要。

| 平台 | 推荐指数 | 深度分析 |
| :--- | :--- | :--- |
| **本地设备** (Mac/Linux/树莓派) | ✅ **最佳** | 能够真实反映你的网络环境。支持完整的 ICMP/MTR 功能。 |
| **本地 Docker** | ✅ **推荐** | 部署方便。需要开启 `cap_add=NET_RAW` 权限以支持 Ping。 |
| **Render / Railway / Fly.io** | ⚠️ **仅限反向监控** | 此时监控的是“云厂商机房”到目标的质量，而非你家的网络。适用于反向监控（回程质量）。 |
| **Vercel / Netlify** | ❌ **不可用** | 这些是静态/Serverless 平台，不支持后台守护进程和 Raw Socket 发包。 |

### 方式 1: 一键脚本 (推荐 Debian/Ubuntu)

```bash
git clone https://github.com/yuanweize/RouteLens.git
cd RouteLens
chmod +x scripts/install.sh
./scripts/install.sh
```

### 方式 2: Docker 部署

```bash
docker build -t routelens .
docker run -d \
  --name routelens \
  --cap-add=NET_RAW \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  -e RS_TARGETS="8.8.8.8,1.1.1.1" \
  routelens
```

## ⚙️ 配置说明

| 环境变量 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `RS_HTTP_PORT` | API 监听端口 | `8080` |
| `RS_DB_PATH` | 数据库路径 | `/data/routelens.db` |
| `RS_SSH_USER` | 测速用 SSH 用户 | `root` |
| `RS_SPEED_WINDOW` | 允许测速的时间窗口 (如 `02:00-08:00`)，留空则全天允许 | *(空)* |

## License

MIT
