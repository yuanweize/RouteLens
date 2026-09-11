package prober

import (
	"fmt"
	"io"
	"net/http"
	"time"
)

type HTTPSpeedTester struct {
	URL string
}

func NewHTTPSpeedTester(url string) *HTTPSpeedTester {
	return &HTTPSpeedTester{URL: url}
}

func (h *HTTPSpeedTester) Run() (*SpeedResult, error) {
	start := time.Now()

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	req, err := http.NewRequest("GET", h.URL, nil)
	if err != nil {
		return nil, fmt.Errorf("invalid http url: %w", err)
	}
	req.Header.Set("User-Agent", "RouteLens-SpeedTester")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http get failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http returned status: %s", resp.Status)
	}

	// Read body to measure speed (limit to max 50MB to prevent DoS/infinite streams)
	maxBytes := int64(50 * 1024 * 1024)
	limitedReader := io.LimitReader(resp.Body, maxBytes)
	n, err := io.Copy(io.Discard, limitedReader)
	if err != nil {
		return nil, fmt.Errorf("failed to read body: %w", err)
	}

	duration := time.Since(start)
	if duration == 0 {
		duration = time.Millisecond
	}

	// Calculate speed in Mbps
	// n is bytes, n*8 is bits, duration.Seconds() gives bps
	// bps / 1,000,000 = Mbps
	speedMbps := (float64(n) * 8) / (duration.Seconds() * 1000000)

	return &SpeedResult{
		DownloadSpeed: speedMbps,
		UploadSpeed:   0, // HTTP download doesn't measure upload speed easily
		Timestamp:     time.Now(),
	}, nil
}
