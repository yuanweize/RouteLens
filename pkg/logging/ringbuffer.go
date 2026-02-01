package logging

import (
	"fmt"
	"sync"
	"time"
)

// LogLevel represents the severity of a log entry
type LogLevel string

const (
	LevelDebug LogLevel = "DEBUG"
	LevelInfo  LogLevel = "INFO"
	LevelWarn  LogLevel = "WARN"
	LevelError LogLevel = "ERROR"
)

// LogEntry represents a single log entry
type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     LogLevel  `json:"level"`
	Message   string    `json:"message"`
	Source    string    `json:"source,omitempty"`
}

// RingBuffer is a thread-safe circular buffer for log entries
type RingBuffer struct {
	mu      sync.RWMutex
	entries []LogEntry
	size    int
	head    int
	count   int
}

// NewRingBuffer creates a new ring buffer with the specified capacity
func NewRingBuffer(size int) *RingBuffer {
	return &RingBuffer{
		entries: make([]LogEntry, size),
		size:    size,
	}
}

// Add appends a new log entry to the buffer
func (rb *RingBuffer) Add(entry LogEntry) {
	rb.mu.Lock()
	defer rb.mu.Unlock()
	rb.entries[rb.head] = entry
	rb.head = (rb.head + 1) % rb.size
	if rb.count < rb.size {
		rb.count++
	}
}

// AddLog is a convenience method to add a log with level and message
func (rb *RingBuffer) AddLog(level LogLevel, source, format string, args ...interface{}) {
	rb.Add(LogEntry{
		Timestamp: time.Now(),
		Level:     level,
		Message:   fmt.Sprintf(format, args...),
		Source:    source,
	})
}

// Info logs an info message
func (rb *RingBuffer) Info(source, format string, args ...interface{}) {
	rb.AddLog(LevelInfo, source, format, args...)
}

// Warn logs a warning message
func (rb *RingBuffer) Warn(source, format string, args ...interface{}) {
	rb.AddLog(LevelWarn, source, format, args...)
}

// Error logs an error message
func (rb *RingBuffer) Error(source, format string, args ...interface{}) {
	rb.AddLog(LevelError, source, format, args...)
}

// Debug logs a debug message
func (rb *RingBuffer) Debug(source, format string, args ...interface{}) {
	rb.AddLog(LevelDebug, source, format, args...)
}

// GetAll returns all log entries in chronological order
func (rb *RingBuffer) GetAll() []LogEntry {
	rb.mu.RLock()
	defer rb.mu.RUnlock()
	result := make([]LogEntry, rb.count)
	if rb.count == 0 {
		return result
	}
	start := 0
	if rb.count == rb.size {
		start = rb.head
	}
	for i := 0; i < rb.count; i++ {
		idx := (start + i) % rb.size
		result[i] = rb.entries[idx]
	}
	return result
}

// GetLast returns the last n log entries
func (rb *RingBuffer) GetLast(n int) []LogEntry {
	all := rb.GetAll()
	if n >= len(all) {
		return all
	}
	return all[len(all)-n:]
}

// GetByLevel returns log entries filtered by level
func (rb *RingBuffer) GetByLevel(levels ...LogLevel) []LogEntry {
	all := rb.GetAll()
	levelSet := make(map[LogLevel]bool)
	for _, l := range levels {
		levelSet[l] = true
	}
	var result []LogEntry
	for _, entry := range all {
		if levelSet[entry.Level] {
			result = append(result, entry)
		}
	}
	return result
}

// Clear removes all entries from the buffer
func (rb *RingBuffer) Clear() {
	rb.mu.Lock()
	defer rb.mu.Unlock()
	rb.head = 0
	rb.count = 0
}

// Global logger instance
var globalLogger *RingBuffer

func init() {
	// Initialize with 1000 entry capacity
	globalLogger = NewRingBuffer(1000)
}

// GetGlobalLogger returns the global logger instance
func GetGlobalLogger() *RingBuffer {
	return globalLogger
}

// Convenience functions for global logger
func Info(source, format string, args ...interface{}) {
	globalLogger.Info(source, format, args...)
}

func Warn(source, format string, args ...interface{}) {
	globalLogger.Warn(source, format, args...)
}

func Error(source, format string, args ...interface{}) {
	globalLogger.Error(source, format, args...)
}

func Debug(source, format string, args ...interface{}) {
	globalLogger.Debug(source, format, args...)
}
