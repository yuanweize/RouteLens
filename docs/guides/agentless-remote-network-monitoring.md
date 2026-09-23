# Agentless Remote Network Monitoring via Secure Telemetry

## Why Agentless Architecture Matters

Traditional network observability suites require deploying, updating, and supervising heavyweight monitoring agents (e.g., Datadog, Zabbix Agent, Telegraf) across every managed server. In multi-tenant, cloud-diverse, or security-sensitive environments, this introduces significant friction:

1. **Security Attack Surface**: Running privileged background daemons with open management ports creates persistent vulnerabilities.
2. **Resource Overhead**: Small VPS instances (512MB - 1GB RAM) cannot afford 150MB+ memory consumption from continuous telemetry daemons.
3. **Upgrade Fragility**: Host OS upgrades (e.g., Debian 11 -> 12 or Ubuntu 22.04 -> 24.04) frequently break third-party kernel modules or monitoring packages.

---

## RouteLens Zero-Footprint Remote Probing

RouteLens utilizes standard, battle-tested protocols to execute non-intrusive network measurements from a central control plane:

```text
┌─────────────────┐       Standard SSH Tunnel       ┌─────────────────┐
│ RouteLens Core  │ ──────────────────────────────> │ Remote Host     │
│ (Go Backend)    │   Public-Key Auth (Restricted)  │ (Zero Daemons)  │
└─────────────────┘                                 └─────────────────┘
         │
         ├── Probes Raw Socket / Epoll
         ├── Collects Kernel Network Stats (/proc/net/dev)
         └── Disconnects Cleanly
```

---

## Security Hardening for Remote Measurement Keys

To achieve high-security telemetry without granting full root privileges:

### 1. Dedicated Unprivileged Telemetry User

On the target Linux node:
```bash
sudo useradd -m -s /bin/bash telemetry_probe
sudo passwd -l telemetry_probe  # Disable password authentication
```

### 2. Restricted `authorized_keys` Directives

Restrict the SSH key to specific command execution and disable port forwarding, PTY allocation, and agent forwarding:

```text
# ~/.ssh/authorized_keys on target node
command="/usr/bin/ip -s link && /bin/cat /proc/net/snmp",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... routelens-controller
```

### 3. Verification & Metrics Ingestion

RouteLens establishes secure SSH connections using Go's native `golang.org/x/crypto/ssh` client, executes telemetry probes, extracts metrics directly into SQLite / GORM storage, and renders real-time ECharts timelines in the web dashboard.
