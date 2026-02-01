#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}==> Installing RouteLens...${NC}"

# 1. Build
echo -e "${GREEN}==> Building binary...${NC}"
go build -o routescope ./cmd/probe_test
# Note: In Phase 6, we will point this to cmd/server

# 2. User & Group
echo -e "${GREEN}==> Creating user 'routescope'...${NC}"
if ! id "routescope" &>/dev/null; then
    sudo useradd -r -s /bin/false routescope
fi

# 3. Install Binary
echo -e "${GREEN}==> Installing binary to /usr/local/bin...${NC}"
sudo mv routescope /usr/local/bin/
sudo chmod +x /usr/local/bin/routescope

# 4. Set Capabilities (Allow Ping/MTR without root)
echo -e "${GREEN}==> Setting network capabilities...${NC}"
sudo setcap cap_net_raw,cap_net_bind_service+ep /usr/local/bin/routescope

# 5. Config Directories
echo -e "${GREEN}==> Creating directories...${NC}"
sudo mkdir -p /etc/routescope
sudo mkdir -p /var/lib/routescope
sudo chown routescope:routescope /var/lib/routescope

# 6. Install Config
if [ ! -f /etc/routescope/env ]; then
    echo -e "${GREEN}==> Installing default config to /etc/routescope/env...${NC}"
    sudo cp deploy/env.example /etc/routescope/env
fi

# 7. Install Service
echo -e "${GREEN}==> Installing Systemd service...${NC}"
sudo cp deploy/routescope.service /etc/systemd/system/
sudo systemctl daemon-reload

# 8. Enable & Start
echo -e "${GREEN}==> Enabling and starting service...${NC}"
sudo systemctl enable routescope
sudo systemctl restart routescope

echo -e "${GREEN}==> Installation Complete!${NC}"
echo "Check status with: sudo systemctl status routescope"
