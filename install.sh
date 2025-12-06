#!/bin/bash
# PlexIQ v3 Installation Script
# Author: Rich Knowles (via Claude-Code)
# Safety: Validates environment before installation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  PlexIQ v3 - Installation Script${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_python() {
    print_info "Checking Python installation..."

    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        echo "Please install Python 3.8 or higher"
        exit 1
    fi

    python_version=$(python3 --version | cut -d' ' -f2)
    print_success "Python $python_version found"

    # Check version is >= 3.8
    if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
        print_error "Python 3.8 or higher is required"
        exit 1
    fi
}

create_venv() {
    print_info "Creating virtual environment..."

    if [ -d "venv" ]; then
        print_warning "Virtual environment already exists, skipping creation"
    else
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
}

activate_venv() {
    print_info "Activating virtual environment..."

    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        print_success "Virtual environment activated"
    else
        print_error "Could not find virtual environment activation script"
        exit 1
    fi
}

install_dependencies() {
    print_info "Installing Python dependencies..."

    if [ -f "requirements.txt" ]; then
        pip install --upgrade pip setuptools wheel
        pip install -r requirements.txt
        print_success "Dependencies installed"
    else
        print_error "requirements.txt not found"
        exit 1
    fi
}

install_plexiq() {
    print_info "Installing PlexIQ..."

    pip install -e .
    print_success "PlexIQ installed in development mode"
}

create_directories() {
    print_info "Creating data directories..."

    mkdir -p data/backups
    mkdir -p data/logs
    mkdir -p data/cache

    print_success "Data directories created"
}

setup_config() {
    print_info "Setting up configuration..."

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
            print_warning "Please edit .env and configure your Plex settings"
        else
            print_error ".env.example not found"
        fi
    else
        print_warning ".env already exists, skipping"
    fi
}

run_tests() {
    print_info "Running installation tests..."

    # Test import
    if python3 -c "import plexiq; print(f'PlexIQ v{plexiq.__version__} imported successfully')"; then
        print_success "PlexIQ module imports correctly"
    else
        print_error "Failed to import PlexIQ module"
        exit 1
    fi

    # Test CLI
    if plexiq --version &> /dev/null; then
        print_success "CLI command available"
    else
        print_error "CLI command not available"
        exit 1
    fi
}

print_next_steps() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Configure your environment:"
    echo "   ${YELLOW}nano .env${NC}"
    echo "   (Set PLEX_URL and PLEX_TOKEN)"
    echo ""
    echo "2. Validate configuration:"
    echo "   ${YELLOW}plexiq config --validate${NC}"
    echo ""
    echo "3. Collect metadata from a library:"
    echo "   ${YELLOW}plexiq collect Movies --enrich${NC}"
    echo ""
    echo "4. Analyze items:"
    echo "   ${YELLOW}plexiq analyze Movies --show-recommended${NC}"
    echo ""
    echo "5. Perform dry-run deletion:"
    echo "   ${YELLOW}plexiq delete Movies --dry-run${NC}"
    echo ""
    echo "6. Launch GUI:"
    echo "   ${YELLOW}plexiq gui${NC}"
    echo ""
    echo "For help:"
    echo "   ${YELLOW}plexiq --help${NC}"
    echo ""
    echo -e "${BLUE}Safety Reminder:${NC}"
    echo "  • All operations default to dry-run mode"
    echo "  • Use --execute flag for actual deletion (with caution)"
    echo "  • Backups are created automatically"
    echo ""
}

# Main installation flow
main() {
    print_header
    echo ""

    check_python
    create_venv
    activate_venv
    install_dependencies
    install_plexiq
    create_directories
    setup_config
    run_tests

    print_next_steps
}

# Run main function
main
