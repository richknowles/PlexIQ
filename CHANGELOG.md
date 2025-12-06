# Changelog

All notable changes to PlexIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-12-06

### Added - v3 Complete Rebuild
- **Safety-First Architecture**: Dry-run mode by default for all destructive operations
- **CLI Engine**: Complete command-line interface with Click framework
  - `collect`: Metadata collection with enrichment
  - `analyze`: Multi-factor scoring and analysis
  - `delete`: Safe deletion with dry-run defaults
  - `backup`: Backup management and restoration
  - `config`: Configuration viewing and validation
  - `gui`: GUI launcher
- **GUI Interface**: Full PyQt6-based graphical interface
  - Mustard-colored progress bars (#F4A940)
  - Real-time analysis with background threading
  - Context-aware right-click menus (<100ms response)
  - Interactive tables with sorting and filtering
  - Safety confirmation dialogs
- **Metadata Collection**: Multi-source aggregation
  - Plex server integration via PlexAPI
  - TMDb enrichment for ratings and metadata
  - OMDb integration for IMDb ratings and Rotten Tomatoes
  - Rate-limiting and error handling
- **Intelligent Scoring**: Weighted multi-factor analysis
  - Play count analysis (30% weight)
  - External ratings (25% weight)
  - File size optimization (20% weight)
  - Age/staleness detection (15% weight)
  - Quality metrics (10% weight)
  - Customizable weights via configuration
- **Safety Features**:
  - Automatic backups before all operations
  - Never delete content rated ≥8.0/10
  - Detailed rationale for every score
  - Audit trail logging
  - Checksum validation for backups
- **Configuration System**:
  - Environment-based configuration (.env)
  - Validation and testing utilities
  - Directory auto-creation
  - Secret management
- **Logging System**:
  - Rich console output with formatting
  - File-based logging with rotation
  - Configurable log levels
  - Automatic cleanup based on retention policy
- **Backup Manager**:
  - Timestamped backups with metadata
  - SHA-256 checksum validation
  - Retention policy enforcement
  - Export and restore capabilities
- **Testing Suite**:
  - Pytest-based unit tests
  - Coverage reporting
  - Configuration tests
  - Analyzer tests
- **Documentation**:
  - Comprehensive README with quick start
  - Detailed usage guide
  - API documentation
  - Example workflows and scripts
  - Installation guide

### UI/UX Rules Implemented
1. **Safety First**: Dry-run defaults, explicit confirmations, protection rules
2. **CLI/GUI Parity**: 1:1 feature mapping between interfaces
3. **Clarity & Feedback**: Progress bars, status messages, detailed logging
4. **Consistency & Predictability**: Uniform patterns and interactions
5. **Aesthetic & Delight**: Polished visuals, smooth animations, mustard progress bars

### Technical Details
- **Python 3.8+** support
- **Dependencies**:
  - PlexAPI for Plex integration
  - Rich for terminal formatting
  - Click for CLI framework
  - PyQt6 for GUI
  - TMDbSimple for TMDb API
  - Requests for HTTP operations
  - Python-dotenv for configuration
- **Architecture**:
  - Modular design with separation of concerns
  - Singleton pattern for config and logger
  - Background threading for GUI operations
  - Command registry for CLI/GUI parity

### Installation
- Automated installation script (`install.sh`)
- Virtual environment setup
- Dependency management
- Configuration templating
- Directory structure creation

### Security
- Token and API key protection
- No hardcoded credentials
- Secure configuration management
- Audit trail for all operations
- Backup integrity validation

---

## [3.1.0] - 2025-12-06

### Added - Guided Token Installer
- **Interactive Setup Wizard**: Multi-step GUI wizard for token configuration
  - Welcome screen with feature overview
  - Method selection (browser-based or manual)
  - Browser-based token capture using PyQt WebEngine
  - Manual token entry with detailed instructions
  - Server URL configuration
  - Live token validation with feedback
  - Success confirmation with next steps
- **CLI Setup Command**: `plexiq setup` for terminal-based configuration
  - Interactive prompts with rich formatting
  - Browser launch for Plex login
  - Token validation before saving
  - Dry-run mode by default (use --execute to save)
  - Force reinstall option (--force)
  - Validate-only mode (--validate-only)
- **Automatic Startup Checks**: Both CLI and GUI check for valid token on launch
  - Graceful prompts if token missing
  - Automatic setup wizard trigger in GUI
  - Clear instructions for CLI users
- **Secure Token Storage**: Enhanced security for token management
  - Stored in `~/.plexiq/config.json`
  - Restrictive file permissions (600 - owner read/write only)
  - Directory permissions (700 - owner only)
  - SHA-256 validation support
- **Browser Widget**: Embedded web browser for seamless authentication
  - Cookie monitoring for automatic token capture
  - URL parsing for token extraction
  - Fallback to system browser if PyQtWebEngine unavailable
  - Manual token entry option
- **Token Validation**: Lightweight API validation before storage
  - Validates against plex.tv API
  - Retrieves user information (username, email)
  - Fallback to local server validation
  - Clear error messages for invalid tokens
- **GUI Integration**: Token configuration accessible from Tools menu
  - "Configure Token..." menu item
  - Reconfigure token at any time
  - Automatic library refresh after token change
- **CLI Integration**: Seamless token check on all commands
  - Skips validation for setup command
  - Clear error messages with setup instructions
  - Supports both .env and ~/.plexiq/config.json

### Enhanced
- **Configuration System**: Updated to support optional token requirement
  - New `require_token` parameter in Config class
  - `has_valid_token()` method for checking token presence
  - Backward compatible with existing .env files
- **GUI About Dialog**: Updated to reflect v3.1 features
- **CLI Help Text**: Updated with setup command and examples
- **README**: Updated with v3.1 quick start guide

### Technical Details
- **New Dependencies**:
  - PyQt6-WebEngine>=6.6.0 for browser-based token capture
- **New Modules**:
  - `plexiq/token_installer.py`: Core token installation logic
  - `plexiq/commands/setup.py`: CLI setup command
  - `plexiq/gui/setup_wizard.py`: Multi-step setup wizard
  - `plexiq/gui/components/browser_widget.py`: Browser widget for token capture
- **Modified Modules**:
  - `plexiq/config.py`: Added optional token validation
  - `plexiq/cli.py`: Added startup token check and setup command
  - `plexiq/gui/main_window.py`: Added startup wizard and Tools menu item
  - `requirements.txt`: Added PyQtWebEngine dependency

### Security
- Token stored with secure file permissions (600)
- Config directory protected (700)
- Tokens never exposed in logs or error messages
- Validation before storage
- Support for both manual and automated token retrieval

---

## [2.x.x] - Previous Versions
- Legacy versions (functionality preserved in v3 rewrite)

---

## Future Roadmap

### [3.2.0] - Planned
- TV show support with episode-level analysis
- Duplicate detection and resolution
- Enhanced quality metrics (codec efficiency, bitrate)

### [3.2.0] - Planned
- Multi-server support
- Cloud storage integration
- Advanced scheduling

### [3.3.0] - Planned
- Integration with *arr stack (Radarr, Sonarr)
- Webhook notifications
- API endpoints for external integration

---

For upgrade instructions, see [USAGE_GUIDE.md](docs/USAGE_GUIDE.md)
