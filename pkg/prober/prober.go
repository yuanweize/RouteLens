package prober

import (
	"time"
)

// MetricType defines the type of network metric
type MetricType string

const (
	MetricLatency    MetricType = "latency"
	MetricPacketLoss MetricType = "packet_loss"
	MetricBandwidth  MetricType = "bandwidth"
	MetricTraceroute MetricType = "traceroute"
)

// SpeedResult holds the result of a bandwidth test
type SpeedResult struct {
	UploadSpeed   float64 // Mbps
	DownloadSpeed float64 // Mbps
	Latency       time.Duration
	Timestamp     time.Time
}

// PingResult holds the result of an ICMP ping series
type PingResult struct {
	PacketsSent int
	PacketsRecv int
	MinRtt      time.Duration
	MaxRtt      time.Duration
	AvgRtt      time.Duration
	LossRate    float64 // Percentage 0.0 - 100.0
	Timestamp   time.Time
}

// HopInfo represents a single hop in a traceroute
type HopInfo struct {
	Hop     int
	IP      string
	Latency time.Duration
	City    string
	Country string
	ISP     string
	Loss    float64
}

// TraceResult holds the result of a traceroute
type TraceResult struct {
	Target    string
	Hops      []HopInfo
	Timestamp time.Time
}
