#!/bin/bash

################################################################################
# PlexIQ Deployment Script v1.0.0
# Deploys PlexIQ to LXC container or standalone server
################################################################################
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emoji
ROCKET="Rocket"
CHECK="Checkmark"
CROSS="Cross"

log_info() {
    echo -e "${BLUE}${ROCKET} $1${NC}"
}

log_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

log_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}Warning $1${NC}"
}

# Configuration
PLEX_URL="${PLEX_URL:-http://10.0.0.10:32400}"
PLEX_TOKEN="${PLEX_TOKEN:-GifXg9g3Ao4LcRbpCzwZ}"
OMDB_API_KEY="${OMDB_API_KEY:-27d1a548}"
TMDB_API_KEY="${TMDB_API_KEY:-a4af4f20738fafa880491ff093b98b58}"
INSTALL_DIR="/opt/plexiq"
BACKEND_PORT="5000"
FRONTEND_PORT="8080"

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║        PlexIQ Deployment Script v1.0.0                ║"
echo "║     AI-Powered Plex Media Management System           ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    log_error "This script should not be run as root"
    log_info "Run as regular user with sudo privileges"
    exit 1
fi

log_info "Starting PlexIQ deployment..."

# Update system
log_info "Updating system packages..."
sudo apt-get update -qq
log_success "System updated"

# Install Python 3 and pip
log_info "Installing Python dependencies..."
sudo apt-get install -y python3 python3-pip python3-venv
log_success "Python installed"

# Install Node.js (optional)
log_info "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
log_success "Node.js installed: $(node --version)"

# Create installation directory
log_info "Creating installation directory..."
sudo mkdir -p "${INSTALL_DIR}"
sudo chown -R "$USER:$USER" "${INSTALL_DIR}"
log_success "Installation directory created: ${INSTALL_DIR}"

# Copy files
log_info "Copying PlexIQ files..."
cp -r "$(dirname "$0")/backend" "${INSTALL_DIR}/"
cp -r "$(dirname "$0")/frontend" "${INSTALL_DIR}/"
log_success "Files copied"

# Setup Python virtual environment
log_info "Creating Python virtual environment..."
cd "${INSTALL_DIR}/backend"
python3 -m venv venv
source venv/bin/activate
log_success "Virtual environment created"

# Install Python dependencies
log_info "Installing Python packages..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
log_success "Python packages installed"

# Create environment file
log_info "Creating environment configuration..."
cat > "${INSTALL_DIR}/backend/.env" << EOF
# PlexIQ Configuration
PLEX_URL=${PLEX_URL}
PLEX_TOKEN=${PLEX_TOKEN}
OMDB_API_KEY=${OMDB_API_KEY}
TMDB_API_KEY=${TMDB_API_KEY}
EOF
chmod 600 "${INSTALL_DIR}/backend/.env"
log_success "Environment configured"

# Create systemd service for backend
log_info "Creating systemd service for PlexIQ backend..."
sudo tee /etc/systemd/system/plexiq-backend.service > /dev/null << EOF
[Unit]
Description=PlexIQ Backend API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=${INSTALL_DIR}/backend
Environment="PATH=${INSTALL_DIR}/backend/venv/bin"
EnvironmentFile=${INSTALL_DIR}/backend/.env
ExecStart=${INSTALL_DIR}/backend/venv/bin/python api.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable plexiq-backend.service
sudo systemctl start plexiq-backend.service
log_success "PlexIQ backend service created and started"

# Setup frontend service
log_info "Creating systemd service for PlexIQ frontend..."
sudo tee /etc/systemd/system/plexiq-frontend.service > /dev/null << EOF
[Unit]
Description=PlexIQ Frontend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=${INSTALL_DIR}/frontend
ExecStart=/usr/bin/python3 -m http.server ${FRONTEND_PORT}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable plexiq-frontend.service
sudo systemctl start plexiq-frontend.service
log_success "PlexIQ frontend service created and started"

# Wait for services
log_info "Waiting for services to initialize..."
sleep 5

# Check backend status
if systemctl is-active --quiet plexiq-backend.service; then
    log_success "Backend service is running"
else
    log_error "Backend service failed to start"
    sudo journalctl -u plexiq-backend.service -n 20
fi

# Check frontend status
if systemctl is-active --quiet plexiq-frontend.service; then
    log_success "Frontend service is running"
else
    log_error "Frontend service failed to start"
    sudo journalctl -u plexiq-frontend.service -n 20
fi

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║          PlexIQ Deployment Complete!                  ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
log_success "PlexIQ is now running!"
echo ""
echo "Access PlexIQ:"
echo " - Frontend: http://${LOCAL_IP}:${FRONTEND_PORT}"
echo " - Backend API: http://${LOCAL_IP}:${BACKEND_PORT}/api/health"
echo ""
echo "Service Management:"
echo " - Start:   sudo systemctl start plexiq-backend plexiq-frontend"
echo " - Stop:    sudo systemctl stop plexiq-backend plexiq-frontend"
echo " - Restart: sudo systemctl restart plexiq-backend plexiq-frontend"
echo " - Status:  sudo systemctl status plexiq-backend plexiq-frontend"
echo " - Logs:    sudo journalctl -u plexiq-backend -f"
echo ""
echo "Next Steps:"
echo " 1. Configure Caddy reverse proxy (optional)"
echo " 2. Open PlexIQ in your browser"
echo " 3. Click 'Start Analysis' to analyze your Plex library"
echo ""
echo "Built with mustard ONLY by Team Hotdog"
echo ""