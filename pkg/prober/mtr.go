package prober

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"time"
)

type MTRHop struct {
	Hop   int
	Host  string
	Loss  float64
	Last  float64
	Avg   float64
	Best  float64
	Worst float64
	ASN   string
}

type MTRResult struct {
	Target    string
	Hops      []MTRHop
	Timestamp time.Time
}

type mtrReport struct {
	Report struct {
		MTR struct {
			Dst string `json:"dst"`
		} `json:"mtr"`
		Hubs []struct {
			Count int     `json:"count"`
			Host  string  `json:"Host"`
			Loss  float64 `json:"Loss%"`
			Last  float64 `json:"Last"`
			Avg   float64 `json:"Avg"`
			Best  float64 `json:"Best"`
			Worst float64 `json:"Wrst"`
			ASN   string  `json:"ASN"`
		} `json:"hubs"`
	} `json:"report"`
}

type MTRRunner struct {
	Target string
	Count  int
}

func NewMTRRunner(target string) *MTRRunner {
	return &MTRRunner{Target: target, Count: 10}
}

func (r *MTRRunner) Run() (*MTRResult, error) {
	count := r.Count
	if count <= 0 {
		count = 10
	}

	cmd := exec.Command("mtr", "--json", "-c", fmt.Sprintf("%d", count), r.Target)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("mtr execution failed: %w", err)
	}

	var data mtrReport
	if err := json.Unmarshal(output, &data); err != nil {
		return nil, fmt.Errorf("parse mtr json failed: %w", err)
	}

	res := &MTRResult{
		Target:    data.Report.MTR.Dst,
		Timestamp: time.Now(),
	}

	for idx, hub := range data.Report.Hubs {
		hop := MTRHop{
			Hop:   idx + 1,
			Host:  hub.Host,
			Loss:  hub.Loss,
			Last:  hub.Last,
			Avg:   hub.Avg,
			Best:  hub.Best,
			Worst: hub.Worst,
			ASN:   hub.ASN,
		}
		res.Hops = append(res.Hops, hop)
	}

	if res.Target == "" {
		res.Target = r.Target
	}

	return res, nil
}
