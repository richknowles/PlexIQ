# PlexIQ v3.2 🎬

**Smart Plex Media Library Management with Safety-First Design**

PlexIQ is an intelligent media library management tool for Plex that helps you analyze, organize, and optimize your media collection. Built with a safety-first philosophy, PlexIQ defaults to dry-run mode for all destructive operations and provides detailed analysis before any action.

## 🆕 What's New in v3.2

- **One-Liner Installer** - Install PlexIQ with a single command
- **Docker Support** - Run PlexIQ in containers with docker-compose
- **Guided Token Installer** - Interactive setup wizard for easy Plex authentication
- **Browser-Based Token Capture** - Automatic token retrieval from Plex login
- **Enhanced Security** - Secure token storage with restricted file permissions

---

## ✨ Features

### Core Capabilities
- 📊 **Intelligent Analysis** - Multi-factor scoring system considering play count, ratings, file size, age, and quality
- 🔍 **Metadata Enrichment** - Integrates IMDb, TMDb, and Rotten Tomatoes ratings
- 🛡️ **Safety First** - Dry-run mode by default; explicit confirmation required for deletion
- 💾 **Automatic Backups** - All operations create audit trails and backups
- 🎨 **Dual Interface** - Full feature parity between CLI and GUI

### UI/UX Principles (Rules #1-5)

1. **Safety First** - Dry-run defaults, explicit confirmations, never delete highly-rated content
2. **CLI/GUI Parity** - Every CLI command has a GUI equivalent
3. **Clarity & Feedback** - Detailed logging, progress bars, and status messages
4. **Consistency** - Predictable interactions and patterns throughout
5. **Aesthetic & Delight** - Polished visuals with mustard-colored progress bars

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Plex Media Server with API access
- Plex account credentials (token will be configured via setup wizard)

### Installation

```bash
# Clone the repository
git clone https://github.com/richknowles/PlexIQ.git
cd PlexIQ

# Run the installation script
./install.sh

# Activate virtual environment
source venv/bin/activate
```

### First Run - Setup Wizard (v3.1)

PlexIQ v3.1 includes a guided setup wizard for easy token configuration:

```bash
# Run the interactive setup wizard
plexiq setup --execute

# The wizard will guide you through:
# 1. Browser-based token retrieval (automatic)
# 2. Manual token entry (with instructions)
# 3. Token validation
# 4. Secure storage in ~/.plexiq/config.json
```

**Alternative: Manual Configuration**

If you prefer manual configuration, create a `.env` file:

```bash
cp .env.example .env
nano .env  # Set your PLEX_TOKEN and other settings
```

### Usage Examples

```bash
# Validate your configuration
plexiq config --validate

# Collect metadata from a library
plexiq collect Movies --enrich

# Analyze and get recommendations
plexiq analyze Movies --show-recommended

# Perform a dry-run deletion
plexiq delete Movies --dry-run

# Launch the GUI (includes built-in setup wizard)
plexiq gui
```

---

## 📖 Documentation

### Configuration

PlexIQ uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

```bash
# Required
PLEX_URL=http://localhost:32400
PLEX_TOKEN=your_plex_token_here

# Optional API Keys (for metadata enrichment)
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_omdb_api_key

# Scoring Weights (must sum to ~1.0)
WEIGHT_PLAY_COUNT=0.3
WEIGHT_RATINGS=0.25
WEIGHT_SIZE=0.2
WEIGHT_AGE=0.15
WEIGHT_QUALITY=0.1

# Safety Thresholds
MIN_DELETION_SCORE=0.7
NEVER_DELETE_RATING_THRESHOLD=8.0
```

### CLI Commands

#### Collect Metadata
```bash
# Collect from a library with enrichment
plexiq collect Movies --enrich

# Collect without external metadata
plexiq collect "TV Shows" --no-enrich --media-type show

# Save to file
plexiq collect Movies --output movies.json
```

#### Analyze Items
```bash
# Analyze and show all items
plexiq analyze Movies --show-all

# Show only recommended deletions
plexiq analyze Movies --show-recommended

# Limit results
plexiq analyze Movies --limit 20

# Output formats
plexiq analyze Movies --format table
plexiq analyze Movies --format report
plexiq analyze Movies --format json
```

#### Delete Items
```bash
# Dry-run (default - NO actual deletion)
plexiq delete Movies --dry-run

# ACTUAL deletion (requires confirmation)
plexiq delete Movies --execute --confirm

# Use custom threshold
plexiq delete Movies --min-score 0.8 --execute
```

#### Backup Management
```bash
# List backups
plexiq backup list

# Filter by type
plexiq backup list --type deletion_executed

# Restore a backup
plexiq backup restore backup_file.json

# Cleanup old backups
plexiq backup cleanup
```

#### Configuration
```bash
# View configuration
plexiq config

# Show secrets (use carefully!)
plexiq config --show-secrets

# Validate and test connections
plexiq config --validate
```

---

## 🎨 GUI Interface

Launch the GUI with:
```bash
plexiq gui

# Or with a pre-selected library
plexiq gui --library Movies
```

### GUI Features
- **Mustard-colored progress bars** for visual feedback
- **Context-aware right-click menus** (<100ms response time)
- **Real-time analysis** with background processing
- **Interactive tables** with sorting and filtering
- **Safety confirmations** for all destructive operations

---

## 🧮 Scoring System

PlexIQ uses a weighted multi-factor scoring system (0.0-1.0, where 1.0 = highest deletion priority):

### Factors

1. **Play Count (30%)** - Never watched = high score, frequently watched = low score
2. **External Ratings (25%)** - Low ratings = high score, high ratings = low score
3. **File Size (20%)** - Larger files = higher score (more space recovery)
4. **Age/Staleness (15%)** - Old + unwatched = high score
5. **Quality (10%)** - Lower resolution/old codecs = higher score

### Safety Rules

- **Never recommend deletion** if average rating ≥ 8.0/10
- **Minimum score threshold** (default 0.7) must be met
- **Detailed rationale** provided for every score
- **Backup created** before any operation

---

## 🔒 Safety Features

### Dry-Run First (Rule #1)
```bash
# Default behavior - NO deletion
plexiq delete Movies

# Explicit flag required for actual deletion
plexiq delete Movies --execute --confirm
```

### Automatic Backups
- Every operation creates a timestamped backup
- Backups include full metadata and checksums
- Configurable retention period (default: 7 days)

### Audit Trail
- All actions logged with timestamps
- Separate log files for each day
- Configurable log retention (default: 30 days)

### Protection Rules
- Highly-rated content never recommended (≥8.0/10)
- Confirmation prompts for destructive operations
- Detailed preview before any deletion

---

## 🧪 Development

### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=plexiq

# Run specific test file
pytest tests/test_analyzer.py

# Run with verbosity
pytest -v
```

### Project Structure
```
PlexIQ/
├── plexiq/                  # Main package
│   ├── __init__.py
│   ├── cli.py              # CLI entry point
│   ├── config.py           # Configuration management
│   ├── logger.py           # Logging system
│   ├── backup.py           # Backup manager
│   ├── collector.py        # Metadata collection
│   ├── analyzer.py         # Scoring engine
│   ├── commands/           # CLI commands
│   │   ├── collect.py
│   │   ├── analyze.py
│   │   ├── delete.py
│   │   ├── backup.py
│   │   └── config.py
│   └── gui/                # GUI components
│       ├── main_window.py
│       └── components/
│           ├── progress_bar.py
│           ├── table_widget.py
│           └── dialogs.py
├── tests/                  # Test suite
├── docs/                   # Documentation
├── examples/               # Example scripts
├── data/                   # Data directory (created on install)
│   ├── backups/
│   ├── logs/
│   └── cache/
├── requirements.txt        # Dependencies
├── setup.py               # Package setup
├── install.sh             # Installation script
├── .env.example           # Example configuration
└── README.md              # This file
```

---

## 🤝 Contributing

PlexIQ is designed for seasoned users who understand media management and Plex systems. Contributions welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 style guide
- Write tests for new features
- Update documentation
- Maintain safety-first principles

---

## 📋 Roadmap

- [ ] Support for TV shows with episode-level analysis
- [ ] Duplicate detection and resolution
- [ ] Cloud storage integration
- [ ] Advanced scheduling for automated maintenance
- [ ] Multi-server support
- [ ] Enhanced quality metrics (codec efficiency, bitrate analysis)
- [ ] Integration with *arr stack (Radarr, Sonarr)

---

## ⚠️ Important Notes

### Deletion Context
PlexIQ focuses on **Plex media files** (movies/shows). It does NOT delete:
- System files
- Plex database
- User data
- Configuration files

However, it CAN optionally manage:
- Media cache files
- Thumbnails
- Transcoding temp files

### Backup & Recovery
- Backups contain metadata only (not media files)
- Deleted media files are handled by Plex's built-in trash
- Review all recommendations before executing
- Test with dry-run mode first

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Rich Knowles**
Cybersecurity Engineer | Media Enthusiast

Built with safety-first design principles and respect for your media collection.

---

## 🙏 Acknowledgments

- Plex team for the excellent media server
- TMDb and OMDb for metadata APIs
- Python Rich library for beautiful terminal output
- PyQt6 for GUI framework

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/richknowles/PlexIQ/issues)
- **Discussions**: [GitHub Discussions](https://github.com/richknowles/PlexIQ/discussions)

---

**Remember: Always test with `--dry-run` first! 🛡️**
