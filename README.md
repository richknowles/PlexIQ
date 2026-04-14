# PlexIQ v5.3.1 — The Chicago Edition 🌭

<p align="center">
  <img src="plexiq-demo.gif" alt="PlexIQ v5.3 demo" width="700" />
</p>

**Smart Plex Media Library Management. One slider. No nonsense. Just HOTDOGS.**

PlexIQ analyzes your Plex library using multi-factor scoring (play count, ratings, file size, age, quality) and surfaces deletion candidates through a cinematic 1930s Chicago noir interface. Built with "The Untouchables", but even some of them had to die...

# We are NOT responsible for your data loss. #

You will be asked **three** times if you want to delete something or some things. The third time you will be asked for your deletion password.

All deleted data is **unrecoverable**! If you have been wise enough and able to accommodate the storage requirements of trying to back up all your movies, then good for you! You have done what most have not! We certainly will make a best case effort to help you if you need assistance. please reach out to: support@itwerks.net

---

## GET YOUR REDHOTS! 🌭🌭🌭
                            ## GET YOUR REDHOTS OVER HERE! ##

### Core Capabilities
- 📊 **Intelligent Analysis** - Multi-factor scoring system considering play count, ratings, file size, age, and quality. all data will be **algorithmically** weighted against IMDb, tvdb and Rotten Tomatoes vs play count and library freshness. Please be sure to perform a fresh scan before deleting to be sure you have the most current weighting
- 🔍 **Metadata Enrichment** - Infuses IMDb, TMDb, and Rotten Tomatoes ratings
- 🛡️ **Easy Setup** - You will he walked through gathering API data, **RESUME ANYTIME!**
- 💾 **All Changes Trackeds** - All operations create audit trails
- 🎨 **Dual Interface** - Full feature parity between CLI and GUI

### UI/UX Principles (Rules #1-5)

1. **Hotdog Grabbing** - That one UI element is the **smartest** knob you have
2. **The Untouchables** - Protect your cherished videos
3. **CLI/GUI Parity** - Every CLI command has a GUI equivalent
4. **Clarity & Feedback** - Detailed logging, progress bars, and status messages
5. **Consistency** - Predictable interactions and patterns throughout
6. **Aesthetic & Delight** - Polished visuals with mustard-colored progress bars

---

## 🌭 Quick Start

### Prerequisites
- Python 3.8 or higher
- Plex Media Server (API access token is built-in and will be found automatically)
- Plex account credentials (API access token will be configured via setup wizard)

# PRO TIP # SEE STEP 1. # Run the **FULLY AUTOMATED INSTALL** We'll grab your Plex API token... while you grab your hotdog! #

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

### First Run - Setup Wizard

PlexIQ v3.1 includes a guided setup wizard for easy token configuration:

```bash
# Run the interactive setup wizard
plexiq setup --execute

# The wizard will guide you through:
# 1. Browser-based token retrieval (FULLY AUTOMATED PLEX API TOKEN RETRIEVAL)
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

## 🌭🌭🌭 Hotdogs are a risky business!

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

Please contact Rich at richitwerks.net if you are interested in licensing this software for commercial purposes or if you are interested in joining the cause!

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
PlexIQ DELETES YOUR **media files**. It does NOT delete:
- System files
- Plex database
- User data
- Configuration files

### LOG FILES
- OUR SOFTWARE WILL NOT BACK UP YOUR DATA EVER!
- Deleted media files are handled by Plex's built-in trash
- Review all recommendations before executing - three strikes and you're out!!! ❌❌❌ 😵
- Test with dry-run mode first

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👤 TEAM HOTDOG! 🌭 💙 🌭

**Rich Knowles**
Developer | Cybersecurity Engineer | Musician

**OZ**
The Great & Beautiful

---

## 🙏 Acknowledgments

- Plex team for the excellent media server
- TMDb and OMDb for metadata APIs
- Python Rich library for beautiful terminal output
- PyQt6 for GUI framework

---

## 📞 Support

- **Email Support**: support@itwerks.net
- **Issues**: [GitHub Issues](https://github.com/richknowles/PlexIQ/issues)
- **Discussions**: [GitHub Discussions](https://github.com/richknowles/PlexIQ/discussions)

---
☠️
**Remember: Always test with `--dry-run` first! 🛡️**
