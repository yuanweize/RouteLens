package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func TestHashAndComparePassword(t *testing.T) {
	pass := "SecureP@ssw0rd123!"
	hashed, err := HashPassword(pass)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	if !ComparePassword(hashed, pass) {
		t.Fatalf("expected password to match")
	}

	if ComparePassword(hashed, "WrongPassword") {
		t.Fatalf("expected password to not match wrong password")
	}
}

func TestGenerateTokenAndAuthMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	username := "admin_test"
	token, err := GenerateToken(username)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}
	if token == "" {
		t.Fatalf("expected non-empty token")
	}

	r := gin.New()
	r.Use(AuthMiddleware())
	r.GET("/protected", func(c *gin.Context) {
		user, _ := c.Get("username")
		c.JSON(http.StatusOK, gin.H{"user": user})
	})

	// Case 1: Valid Token
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Case 2: Missing Header
	reqNoHeader := httptest.NewRequest(http.MethodGet, "/protected", nil)
	wNoHeader := httptest.NewRecorder()
	r.ServeHTTP(wNoHeader, reqNoHeader)
	if wNoHeader.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 for missing header, got %d", wNoHeader.Code)
	}

	// Case 3: Invalid Format
	reqBadFormat := httptest.NewRequest(http.MethodGet, "/protected", nil)
	reqBadFormat.Header.Set("Authorization", "Basic "+token)
	wBadFormat := httptest.NewRecorder()
	r.ServeHTTP(wBadFormat, reqBadFormat)
	if wBadFormat.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 for bad format, got %d", wBadFormat.Code)
	}

	// Case 4: Invalid/Tampered Token
	reqTampered := httptest.NewRequest(http.MethodGet, "/protected", nil)
	reqTampered.Header.Set("Authorization", "Bearer "+token+"tampered")
	wTampered := httptest.NewRecorder()
	r.ServeHTTP(wTampered, reqTampered)
	if wTampered.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 for tampered token, got %d", wTampered.Code)
	}
}

func TestExpiredToken(t *testing.T) {
	// Generate an expired token
	expiredClaims := jwt.MapClaims{
		"sub": "admin",
		"exp": time.Now().Add(-1 * time.Hour).Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
	tokenStr, err := tok.SignedString(secretKey)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(AuthMiddleware())
	r.GET("/protected", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 for expired token, got %d", w.Code)
	}
}
