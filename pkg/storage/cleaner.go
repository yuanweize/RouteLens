package storage

import (
	"log"
	"time"
)

// PruneOldData deletes records older than the specified retention days
func (d *DB) PruneOldData(retentionDays int) error {
	cutoff := time.Now().AddDate(0, 0, -retentionDays)

	result := d.conn.Where("created_at < ?", cutoff).Delete(&MonitorRecord{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected > 0 {
		log.Printf("Pruned %d old records (older than %s)", result.RowsAffected, cutoff.Format("2006-01-02"))
	}
	return nil
}
