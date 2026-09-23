# Diagnosing Multi-Hop Network Latency and Route Flapping

## Anatomy of Multi-Hop Latency

Total round-trip time (RTT) observed between any two internet hosts is governed by four primary components:

$$\text{RTT} = 2 \times (t_{\text{prop}} + t_{\text{trans}} + t_{\text{proc}} + t_{\text{queue}})$$

1. **Propagation Delay ($t_{\text{prop}}$)**: Physical constraint of light traveling through fiber optic cables (~5 microseconds per kilometer). Inelastic.
2. **Transmission Delay ($t_{\text{trans}}$)**: Time required to push data packets onto the physical link ($L / R$).
3. **Processing Delay ($t_{\text{proc}}$)**: Time router chips take to inspect packet headers and resolve routing tables.
4. **Queueing Delay ($t_{\text{queue}}$)**: Time packets wait in router memory buffers during traffic bursts. Highly dynamic.

When latency spikes unexpectedly, it is almost exclusively caused by **queueing delay** at an overloaded transit router or **asymmetric rerouting** via sub-optimal BGP paths.

---

## Pitfalls of Traditional Traceroute

Network engineers frequently misdiagnose paths when relying solely on basic `traceroute` or `mtr`:

- **ICMP Rate-Limiting**: Core backbone routers (e.g., Juniper, Cisco carrier-grade platforms) prioritize transit forwarding over generating ICMP Time Exceeded (Type 11) messages. An intermediate hop showing 20% packet loss does **not** indicate a broken link if subsequent hops show 0% loss.
- **MPLS Label Switched Paths**: Traffic inside tier-1 transit providers often travels across invisible MPLS tunnels where intermediate hops do not decrement IP TTL.
- **Asymmetric Routing**: Packets frequently return along a completely different geographical route than the outbound path. High latency reported at hop 7 may actually be caused by a congested return hop.

---

## RouteLens Multi-Hop Diagnostic Workflow

RouteLens enhances hop-by-hop analysis with structured classification:

### 1. ASN and Geo-IP Mapping
Every intermediate hop is enriched with:
- Autonomous System Number (ASN)
- Carrier Organization Name (e.g., AS1299 Arelion, AS3356 Lumen, AS6939 Hurricane Electric)
- Physical Landing City and Peering Exchange Point (IXP)

### 2. Delta Latency Computation ($\Delta RTT$)
Instead of raw cumulative milliseconds, RouteLens tracks the incremental cost per hop:

$$\Delta RTT_n = RTT_n - RTT_{n-1}$$

A large positive $\Delta RTT$ isolates the exact peering boundary where delay is introduced.

```text
Hop 1 (Local GW)       : 1.2 ms  (Δ +1.2 ms)
Hop 2 (ISP Aggregation): 3.8 ms  (Δ +2.6 ms)
Hop 3 (Frankfurt IXP)  : 14.5 ms (Δ +10.7 ms)
Hop 4 (Subsea Cable)   : 82.1 ms (Δ +67.6 ms) <--- Physical propagation step
Hop 5 (NY Edge Router) : 84.0 ms (Δ +1.9 ms)
Hop 6 (Target DC GW)   : 142.3 ms (Δ +58.3 ms) <--- Congested link / Queueing spike!
Hop 7 (Destination)    : 143.1 ms (Δ +0.8 ms)
```

In the trace above, Hop 4 represents expected physical transatlantic transit, whereas Hop 6 reveals acute datacenter ingress congestion.
