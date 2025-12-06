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

## [2.x.x] - Previous Versions
- Legacy versions (functionality preserved in v3 rewrite)

---

## Future Roadmap

### [3.1.0] - Planned
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
