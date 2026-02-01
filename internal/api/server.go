package api

import (
	"io/fs"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yuanweize/RouteLens/internal/auth"
	"github.com/yuanweize/RouteLens/internal/monitor"
	"github.com/yuanweize/RouteLens/pkg/storage"
)

type Server struct {
	router  *gin.Engine
	db      *storage.DB
	monitor *monitor.Service
	distFS  fs.FS
}

func NewServer(db *storage.DB, mon *monitor.Service, distFS fs.FS) *Server {
	r := gin.Default()
	s := &Server{
		router:  r,
		db:      db,
		monitor: mon,
		distFS:  distFS,
	}
	s.setupRoutes()
	return s
}

func (s *Server) Run(addr string) error {
	return s.router.Run(addr)
}

func (s *Server) setupRoutes() {
	// CORS (Dev mode mostly, but kept for safety if run separately)
	s.router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Static Assets (Phase 8)
	if s.distFS != nil {
		dist, _ := fs.Sub(s.distFS, "dist")

		// Serve static files from /assets
		// Vite builds put all assets in /assets, so we map /assets to dist/assets
		assetsFS, _ := fs.Sub(dist, "assets")
		s.router.StaticFS("/assets", http.FS(assetsFS))

		// SPA Fallback: All other non-API routes serve index.html
		s.router.NoRoute(func(c *gin.Context) {
			path := c.Request.URL.Path
			if strings.HasPrefix(path, "/api") {
				c.JSON(http.StatusNotFound, gin.H{"error": "API route not found"})
				return
			}
			// Serve index.html for everything else (SPA routes)
			c.FileFromFS("index.html", http.FS(dist))
		})
	}

	// Public API
	s.router.POST("/login", s.handleLogin)

	// Protected API
	api := s.router.Group("/api/v1")
	api.Use(auth.AuthMiddleware())
	{
		api.GET("/status", s.handleStatus)
		api.GET("/history", s.handleHistory)
		api.POST("/probe", s.handleProbe)
	}
}

// -- Handlers --

func (s *Server) handleLogin(c *gin.Context) {
	var req struct {
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	if !auth.ValidatePassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	token, err := auth.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func (s *Server) handleStatus(c *gin.Context) {
	// TODO: Get real real-time status from Monitor Service cache
	// For now, return a mock
	c.JSON(http.StatusOK, gin.H{
		"targets": []gin.H{
			{
				"ip":           "8.8.8.8",
				"latency":      15.5,
				"loss":         0,
				"last_updated": time.Now(),
			},
		},
	})
}

func (s *Server) handleHistory(c *gin.Context) {
	s.handleStatus(c) // Use same mock for now
}

func (s *Server) handleProbe(c *gin.Context) {
	c.JSON(http.StatusAccepted, gin.H{"message": "Probe triggered"})
}
