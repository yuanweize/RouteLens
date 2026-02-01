package storage

import (
	"time"
)

// SaveRecord persists a monitoring record
func (d *DB) SaveRecord(r *MonitorRecord) error {
	return d.conn.Create(r).Error
}

// GetHistory fetches records for a specific target within a time range.
// Optimization: We exclude TraceJson to reduce I/O for general charts.
func (d *DB) GetHistory(target string, start, end time.Time) ([]MonitorRecord, error) {
	var records []MonitorRecord

	err := d.conn.Model(&MonitorRecord{}).
		Select("id, created_at, target, latency_ms, packet_loss, speed_up, speed_down"). // Exclude TraceJson
		Where("target = ? AND created_at BETWEEN ? AND ?", target, start, end).
		Order("created_at asc").
		Find(&records).Error

	return records, err
}

// GetRecordDetail fetches the full record including TraceJson by ID
func (d *DB) GetRecordDetail(id uint) (*MonitorRecord, error) {
	var r MonitorRecord
	err := d.conn.First(&r, id).Error
	return &r, err
}
