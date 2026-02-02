package prober

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"time"
)

type IperfProber struct {
	Target string
	Port   int
}

func NewIperfProber(target string, port int) *IperfProber {
	if port == 0 {
		port = 5201
	}
	return &IperfProber{Target: target, Port: port}
}

func (p *IperfProber) Run() (*SpeedResult, error) {
	// SECURITY: Validate target before passing to exec.Command
	if err := ValidateTarget(p.Target); err != nil {
		return nil, fmt.Errorf("invalid target: %w", err)
	}

	// Validate port range
	if p.Port < 1 || p.Port > 65535 {
		return nil, fmt.Errorf("invalid port: must be between 1 and 65535")
	}

	// SECURITY: Using argument separation (not shell string concatenation)
	// Execute: iperf3 -c <target> -p <port> -J -t 5
	// -J is for JSON output
	cmd := exec.Command("iperf3", "-c", p.Target, "-p", fmt.Sprintf("%d", p.Port), "-J", "-t", "5")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("iperf3 execution failed: %w", err)
	}

	var data struct {
		End struct {
			SumReceived struct {
				BitsPerSecond float64 `json:"bits_per_second"`
			} `json:"sum_received"`
			SumSent struct {
				BitsPerSecond float64 `json:"bits_per_second"`
			} `json:"sum_sent"`
		} `json:"end"`
	}

	if err := json.Unmarshal(output, &data); err != nil {
		return nil, fmt.Errorf("failed to parse iperf3 output: %w", err)
	}

	return &SpeedResult{
		DownloadSpeed: data.End.SumReceived.BitsPerSecond / 1000000,
		UploadSpeed:   data.End.SumSent.BitsPerSecond / 1000000,
		Timestamp:     time.Now(),
	}, nil
}
