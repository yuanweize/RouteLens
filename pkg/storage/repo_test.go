package storage

import (
	"path/filepath"
	"testing"
	"time"
)

func setupTestDB(t *testing.T) (*DB, func()) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_routelens.db")

	db, err := NewDB(dbPath)
	if err != nil {
		t.Fatalf("failed to init test db: %v", err)
	}

	cleanup := func() {
		// Temporary directory will be cleaned up by t.TempDir()
	}
	return db, cleanup
}

func TestSystemSettings(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// 1. Default value fallback
	val := db.GetSetting("non_existent_key", "default_val")
	if val != "default_val" {
		t.Fatalf("expected 'default_val', got %s", val)
	}

	// 2. Set and Get
	err := db.SetSetting("ping_interval_seconds", "15")
	if err != nil {
		t.Fatalf("failed to set setting: %v", err)
	}
	val = db.GetSetting("ping_interval_seconds", "30")
	if val != "15" {
		t.Fatalf("expected '15', got %s", val)
	}

	// 3. Update existing setting
	err = db.SetSetting("ping_interval_seconds", "20")
	if err != nil {
		t.Fatalf("failed to update setting: %v", err)
	}
	val = db.GetSetting("ping_interval_seconds", "30")
	if val != "20" {
		t.Fatalf("expected '20', got %s", val)
	}
}

func TestTargetStatusAggregation(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	target := "1.1.1.1"

	// 1. Save a Ping probe record (latency=15.5ms, loss=0%, speed=0)
	pingTime := time.Now().Add(-2 * time.Minute)
	pingRecord := &MonitorRecord{
		CreatedAt:  pingTime,
		Target:     target,
		LatencyMs:  15.5,
		PacketLoss: 0.0,
		SpeedDown:  0,
		SpeedUp:    0,
	}
	if err := db.SaveRecord(pingRecord); err != nil {
		t.Fatalf("failed to save ping record: %v", err)
	}

	// Verify status with only ping record
	st := db.GetLatestStatus(target)
	if st.Latency != 15.5 || st.Loss != 0.0 || st.SpeedDown != 0 {
		t.Fatalf("unexpected status after ping: %+v", st)
	}

	// 2. Save a Speed probe record later (speed_down=250.0, speed_up=50.0, latency=0, loss=0)
	speedTime := time.Now().Add(-1 * time.Minute)
	speedRecord := &MonitorRecord{
		CreatedAt:  speedTime,
		Target:     target,
		LatencyMs:  0,
		PacketLoss: 0,
		SpeedDown:  250.0,
		SpeedUp:    50.0,
	}
	if err := db.SaveRecord(speedRecord); err != nil {
		t.Fatalf("failed to save speed record: %v", err)
	}

	// Verify merged status: should retain latency 15.5ms AND speed 250Mbps
	mergedSt := db.GetLatestStatus(target)
	if mergedSt.Latency != 15.5 {
		t.Fatalf("expected latency 15.5, got %f (was overwritten by speed record)", mergedSt.Latency)
	}
	if mergedSt.SpeedDown != 250.0 || mergedSt.SpeedUp != 50.0 {
		t.Fatalf("expected speed down 250 up 50, got down=%f up=%f", mergedSt.SpeedDown, mergedSt.SpeedUp)
	}
}

func TestTargetCRUD(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	tgt := &Target{
		Name:      "Cloudflare DNS",
		Address:   "1.1.1.1",
		ProbeType: "MODE_ICMP",
		Enabled:   true,
	}

	// Save
	if err := db.SaveTarget(tgt); err != nil {
		t.Fatalf("failed to save target: %v", err)
	}
	if tgt.ID == 0 {
		t.Fatalf("expected non-zero ID after save")
	}

	// List
	targets, err := db.GetTargets(false)
	if err != nil {
		t.Fatalf("failed to get targets: %v", err)
	}
	if len(targets) != 1 || targets[0].Address != "1.1.1.1" {
		t.Fatalf("expected 1 target with address 1.1.1.1, got: %+v", targets)
	}

	// Update error
	errMsg := "connection timeout"
	if err := db.UpdateTargetError(tgt.Address, errMsg); err != nil {
		t.Fatalf("failed to update target error: %v", err)
	}
	targets, _ = db.GetTargets(false)
	if targets[0].LastError != errMsg {
		t.Fatalf("expected error '%s', got '%s'", errMsg, targets[0].LastError)
	}

	// Delete
	if err := db.DeleteTarget(tgt.ID); err != nil {
		t.Fatalf("failed to delete target: %v", err)
	}
	targets, _ = db.GetTargets(false)
	if len(targets) != 0 {
		t.Fatalf("expected 0 targets after deletion")
	}
}

func TestCleanOldRecords(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Insert an old record (40 days ago) and a new record (1 day ago)
	oldRec := &MonitorRecord{
		CreatedAt: time.Now().Add(-40 * 24 * time.Hour),
		Target:    "8.8.8.8",
		LatencyMs: 20.0,
	}
	newRec := &MonitorRecord{
		CreatedAt: time.Now().Add(-1 * 24 * time.Hour),
		Target:    "8.8.8.8",
		LatencyMs: 18.0,
	}
	if err := db.SaveRecord(oldRec); err != nil {
		t.Fatalf("failed to save old record: %v", err)
	}
	if err := db.SaveRecord(newRec); err != nil {
		t.Fatalf("failed to save new record: %v", err)
	}

	// Clean records older than 30 days
	deleted, err := db.CleanOldRecords(30)
	if err != nil {
		t.Fatalf("failed to clean old records: %v", err)
	}
	if deleted != 1 {
		t.Fatalf("expected 1 record deleted, got %d", deleted)
	}

	// Verify only new record remains
	history, err := db.GetHistory("8.8.8.8", time.Now().Add(-50*24*time.Hour), time.Now())
	if err != nil {
		t.Fatalf("failed to get history: %v", err)
	}
	if len(history) != 1 {
		t.Fatalf("expected 1 history record, got %d", len(history))
	}
}
