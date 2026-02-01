package storage

import (
	"time"
)

// MonitorRecord represents a single monitoring data point (snapshot)
type MonitorRecord struct {
	ID        uint      `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"index;not null"` // Time-series index
	Target    string    `gorm:"index;type:varchar(64);not null"`

	// Ping Metrics (Always present)
	LatencyMs  float64 `gorm:"not null"` // Average RTT in milliseconds
	PacketLoss float64 `gorm:"not null"` // Loss Percentage (0.0 - 100.0)

	// Traceroute Data (JSON Blob)
	// We store this as a raw JSON bytes/string to avoid N+1 queries and write amplification.
	// This contains the sequence of hops with IP, Geo, Latency info.
	TraceJson []byte `gorm:"type:text"`

	// Speed Test Metrics (Sparse data - often 0 if not run)
	SpeedUp   float64 `gorm:"default:0"` // Mbps
	SpeedDown float64 `gorm:"default:0"` // Mbps
}
