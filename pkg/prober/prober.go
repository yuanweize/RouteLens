package prober

import (
	"fmt"
	"regexp"
	"strings"
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

// targetPattern validates hostnames and IP addresses
// Allows: domain names, IPv4, IPv6
var targetPattern = regexp.MustCompile(`^[a-zA-Z0-9]([a-zA-Z0-9\-\.]*[a-zA-Z0-9])?$|^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$`)

// ValidateTarget performs security validation on probe targets
// Returns error if the target contains potentially dangerous characters
func ValidateTarget(target string) error {
	if target == "" {
		return fmt.Errorf("target cannot be empty")
	}
	if len(target) > 253 {
		return fmt.Errorf("target too long (max 253 characters)")
	}
	// Block shell metacharacters to prevent command injection
	if strings.ContainsAny(target, ";|&$`\"'<>(){}[]\\!#*?~") {
		return fmt.Errorf("target contains invalid characters")
	}
	if !targetPattern.MatchString(target) {
		return fmt.Errorf("target format invalid: must be hostname or IP address")
	}
	return nil
}

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
