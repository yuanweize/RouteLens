# How to Monitor Packet Loss and Jitter Between VPS Servers

## The Challenge: Cross-Border & Multi-Cloud Network Degeneration

When operating distributed nodes across multiple cloud providers (such as Hetzner in Germany, Oracle Cloud in Tokyo, AWS us-east-1, and local homelabs), network performance degrades intermittently due to:

- Trans-oceanic cable congestion
- Carrier-level peering saturation during peak hours
- Dynamic QoS throttling and MTU mismatches
- Silent packet drops on intermediate Autonomous System (AS) borders

Standard ICMP ping tools only provide a single aggregate percentage (e.g., `5% packet loss`), failing to identify **where** the degradation is occurring.

---

## The Three-Segment Telemetry Model

RouteLens solves this by segmenting every network path into three distinct operational domains:

```text
[Source VPS]
      │
      ▼  Segment 1: Local Access Hop (Node NIC -> Datacenter Gateway)
[Edge Gateway]
      │
      ▼  Segment 2: Backbone / Transit Hops (Tier-1 Telco Peering & International Subsea Links)
[Target Gateway]
      │
      ▼  Segment 3: Target DC Ingress (Destination Host Stack & Hypervisor Bridge)
[Destination Host]
```

### Why This Breakdown Matters:
1. **Local Access Issues**: If loss spikes at hop 1-2, the problem is local hypervisor over-subscription or bad virtual NIC drivers.
2. **Backbone Congestion**: If latency and loss jump sharply across specific Autonomous System boundaries (e.g., Telia, Cogent, NTT), carrier transit routing is saturated.
3. **Target Ingress Bottlenecks**: If latency remains flat across transit but loss accumulates only at the final destination, the target node's software firewall (`iptables`, `nftables`) or conntrack table is saturated.

---

## Automated Continuous Probing with RouteLens

RouteLens executes periodic, lightweight telemetry cycles without requiring heavy agent daemons on target hosts.

### Step 1: Define Telemetry Targets

In your RouteLens instance (`web/` UI or `routelens.db` config):

```yaml
targets:
  - id: vps-frankfurt-to-tokyo
    source: node-fra-01
    destination: 140.238.xx.xx
    interval_seconds: 30
    probes:
      - type: icmp_fast
        count: 10
        timeout_ms: 1000
      - type: tcp_syn
        port: 443
```

### Step 2: Interpreting Jitter and Loss Metrics

RouteLens automatically calculates:
- **Packet Loss Rate (%)**: Ratio of unacknowledged packets to total sent.
- **Statistical Jitter ($J$)**: Mean deviation of successive round-trip delays:
  $$J = \frac{1}{N-1} \sum_{i=1}^{N-1} |RTT_{i+1} - RTT_i|$$
- **Route Stability Index**: Detection of BGP route flapping based on intermediate IP hop variations.

---

## Actionable Mitigation Playbook

| Observed Pattern | Probable Cause | Recommended Action |
|---|---|---|
| Sudden 100% loss for 10-30s | BGP route convergence / link flap | Configure multi-path BGP or WireGuard fallback tunnel |
| High jitter during 18:00-22:00 local time | ISP consumer transit saturation | Route non-critical traffic through secondary peering |
| Increasing loss with stable RTT | Target host buffer exhaustion | Tune Linux kernel `net.core.rmem_max` and `net.ipv4.tcp_rmem` |
