package monitor

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/yuanweize/RouteLens/pkg/prober"
	"github.com/yuanweize/RouteLens/pkg/storage"
)

type Service struct {
	db          *storage.DB
	targets     []string
	pingTicker  *time.Ticker
	speedTicker *time.Ticker
	stopChan    chan struct{}

	// Config
	sshHost string
	sshPort int
	sshUser string
	sshKey  string
}

func NewService(db *storage.DB) *Service {
	// Parse targets from Env
	targetsEnv := os.Getenv("RS_TARGETS")
	targets := []string{}
	if targetsEnv != "" {
		targets = strings.Split(targetsEnv, ",")
	}

	// SSH Config
	sshPort := 22
	if p, err := strconv.Atoi(os.Getenv("RS_SSH_PORT")); err == nil {
		sshPort = p
	}

	return &Service{
		db:       db,
		targets:  targets,
		stopChan: make(chan struct{}),
		sshPort:  sshPort,
		sshUser:  os.Getenv("RS_SSH_USER"),
		sshKey:   os.Getenv("RS_SSH_KEY_PATH"),
	}
}

func (s *Service) Start() {
	// Ping/Trace Frequency (e.g., every 30s)
	s.pingTicker = time.NewTicker(30 * time.Second)

	// Speed Frequency (e.g., every 1 hour)
	s.speedTicker = time.NewTicker(1 * time.Hour)

	go s.runLoop()
}

func (s *Service) Stop() {
	close(s.stopChan)
	if s.pingTicker != nil {
		s.pingTicker.Stop()
	}
	if s.speedTicker != nil {
		s.speedTicker.Stop()
	}
}

func (s *Service) runLoop() {
	log.Println("Monitor Service Started")
	for {
		select {
		case <-s.pingTicker.C:
			s.runPingTraceCycle()
		case <-s.speedTicker.C:
			s.runSpeedCycle()
		case <-s.stopChan:
			log.Println("Monitor Service Stopped")
			return
		}
	}
}

func (s *Service) runPingTraceCycle() {
	for _, target := range s.targets {
		// 1. Ping
		go func(t string) {
			pinger := prober.NewICMPPinger(t, 5)
			res, err := pinger.Run()
			if err != nil {
				log.Printf("Ping failed for %s: %v", t, err)
				return
			}

			// 2. Trace (only simple trace for now, or just save metrics)
			// Note: For now we save Ping stats first.
			// Full MTR is heavy, maybe run it less frequently?
			// Let's run Trace every time for now, assuming low target count.
			// 2. Trace
			traceRunner := prober.NewTracerouteRunner(t)
			traceRes, err := traceRunner.Run()

			// Serialize Trace
			var traceBytes []byte
			if err == nil {
				// TODO: Proper JSON marshaling later
				_ = traceRes // Keep struct for future use
				traceBytes = []byte("[]")
			}

			rec := &storage.MonitorRecord{
				Target:     t,
				CreatedAt:  time.Now(),
				LatencyMs:  float64(res.AvgRtt.Milliseconds()),
				PacketLoss: res.LossRate,
				TraceJson:  traceBytes,
			}
			s.db.SaveRecord(rec)
		}(target)
	}
}

func (s *Service) runSpeedCycle() {
	if !s.isInWindow() {
		log.Println("Skipping Speed Test: Not in allowed time window")
		return
	}

	if len(s.targets) > 0 {
		// Example: Test first target with SSH
		target := s.targets[0]

		// Use configured keys
		sshConfig := prober.SSHConfig{
			User:      s.sshUser,
			KeyPath:   s.sshKey, // path
			Host:      target,
			Port:      s.sshPort,
			TestBytes: 50 * 1024 * 1024, // 50MB
		}

		runner := prober.NewSSHSpeedTester(sshConfig)
		res, err := runner.Run()
		if err != nil {
			log.Printf("SSH Speed Test failed: %v", err)
			return
		}

		rec := &storage.MonitorRecord{
			Target:    target,
			CreatedAt: time.Now(),
			SpeedUp:   res.UploadSpeed,
			SpeedDown: res.DownloadSpeed,
		}
		s.db.SaveRecord(rec)
	}
}

// isInWindow checks if current time is within RS_SPEED_WINDOW (e.g., "02:00-08:00")
func (s *Service) isInWindow() bool {
	window := os.Getenv("RS_SPEED_WINDOW")
	if window == "" {
		return true // No restriction
	}

	parts := strings.Split(window, "-")
	if len(parts) != 2 {
		return true // Invalid format, fail open
	}

	now := time.Now()
	startTime, err1 := time.Parse("15:04", parts[0])
	endTime, err2 := time.Parse("15:04", parts[1])

	if err1 != nil || err2 != nil {
		return true
	}

	// Adjust to today's date
	start := time.Date(now.Year(), now.Month(), now.Day(), startTime.Hour(), startTime.Minute(), 0, 0, now.Location())
	end := time.Date(now.Year(), now.Month(), now.Day(), endTime.Hour(), endTime.Minute(), 0, 0, now.Location())

	// Handle cross-midnight (e.g. 23:00-06:00)
	if end.Before(start) {
		end = end.Add(24 * time.Hour)
		if now.Before(start) {
			start = start.Add(-24 * time.Hour)
			end = end.Add(-24 * time.Hour)
		}
	}

	return now.After(start) && now.Before(end)
}

// TriggerProbe is public for API use
func (s *Service) TriggerProbe(target string, runTrace bool, runSpeed bool) error {
	// Async execution
	go func() {
		// ... logic similar to cycle but single target
	}()
	return nil
}
