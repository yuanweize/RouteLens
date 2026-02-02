package api

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yuanweize/RouteLens/pkg/logging"
)

// RateLimiter implements a simple in-memory rate limiter based on IP address
// Uses a sliding window approach with automatic cleanup
type RateLimiter struct {
	mu       sync.RWMutex
	attempts map[string][]time.Time
	limit    int           // Max attempts
	window   time.Duration // Time window
}

// NewRateLimiter creates a new rate limiter
// limit: maximum number of attempts allowed
// window: time window for the limit (e.g., 1 minute)
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		attempts: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
	// Start background cleanup goroutine
	go rl.cleanup()
	return rl
}

// Allow checks if a request from the given IP should be allowed
// Returns true if within rate limit, false if exceeded
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	// Get existing attempts and filter to only those within the window
	attempts := rl.attempts[ip]
	var validAttempts []time.Time
	for _, t := range attempts {
		if t.After(windowStart) {
			validAttempts = append(validAttempts, t)
		}
	}

	// Check if limit exceeded
	if len(validAttempts) >= rl.limit {
		rl.attempts[ip] = validAttempts // Update with cleaned list
		return false
	}

	// Add current attempt
	validAttempts = append(validAttempts, now)
	rl.attempts[ip] = validAttempts
	return true
}

// cleanup runs periodically to remove old entries and prevent memory leaks
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		windowStart := now.Add(-rl.window)

		for ip, attempts := range rl.attempts {
			var validAttempts []time.Time
			for _, t := range attempts {
				if t.After(windowStart) {
					validAttempts = append(validAttempts, t)
				}
			}
			if len(validAttempts) == 0 {
				delete(rl.attempts, ip)
			} else {
				rl.attempts[ip] = validAttempts
			}
		}
		rl.mu.Unlock()
	}
}

// LoginRateLimitMiddleware returns a Gin middleware that rate limits login attempts
// Limit: 5 attempts per IP per minute
func LoginRateLimitMiddleware(limiter *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		if !limiter.Allow(ip) {
			logging.Warn("security", "Rate limit exceeded for IP: %s", ip)
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many login attempts. Please try again later.",
				"retry_after": "60 seconds",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
