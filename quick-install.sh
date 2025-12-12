#!/bin/bash
# PlexIQ v3.2 - Quick Installer (One-Liner)
# Usage: curl -fsSL https://raw.githubusercontent.com/richknowles/PlexIQ/main/quick-install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_URL="https://github.com/richknowles/PlexIQ.git"
INSTALL_DIR="${HOME}/PlexIQ"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  PlexIQ v3.2 - Quick Installer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 is not installed${NC}"
    echo "Please install Python 3.8 or higher and try again"
    exit 1
fi

python_version=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓${NC} Python $python_version found"

# Check Python version >= 3.8
if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
    echo -e "${RED}✗ Python 3.8 or higher is required${NC}"
    exit 1
fi

# Check for git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git is not installed${NC}"
    echo "Please install git and try again"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git found"

# Clone or update repository
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠${NC} PlexIQ directory already exists at $INSTALL_DIR"
    echo -e "${BLUE}ℹ${NC} Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull
else
    echo -e "${BLUE}ℹ${NC} Cloning PlexIQ to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo -e "${GREEN}✓${NC} Repository ready"

# Run the full installation script
echo -e "${BLUE}ℹ${NC} Running installation script..."
echo ""
bash install.sh

# Add activation reminder
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Don't forget to activate the virtual environment!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Run these commands:"
echo -e "${GREEN}cd $INSTALL_DIR${NC}"
echo -e "${GREEN}source venv/bin/activate${NC}"
echo ""
echo "Then configure your Plex token:"
echo -e "${GREEN}plexiq setup --execute${NC}"
echo ""