# PlexIQ Setup Complete ✅

**Date:** April 4, 2026  
**Author:** Richard Knowles

## Status: WORKING ✓

PlexIQ has been successfully installed and is now functional with basic capabilities.

---

## What Was Done

### 1. **Installation** ✅
- Ran the installation script (`install.sh`)
- Created Python virtual environment at `venv/`
- Installed all dependencies from `requirements.txt`
- Installed PlexIQ in development mode (`pip install -e .`)

### 2. **Directory Structure** ✅
Created required data directories:
- `data/backups/` - For backup storage
- `data/logs/` - For application logs
- `data/cache/` - For cached metadata

### 3. **Configuration** ✅
- Created `.env` file from `.env.example`
- Configured default scoring weights
- Set safety thresholds (dry-run by default)

### 4. **Testing** ✅
- Verified CLI commands work (`plexiq --version`, `plexiq --help`)
- Confirmed core modules import correctly
- Created and ran demo script proving analyzer functionality
- Validated configuration management works

---

## Current State

### What Works ✅
- ✓ CLI commands (`plexiq config`, `plexiq backup list`, etc.)
- ✓ Core modules (analyzer, config, logger, backup)
- ✓ Configuration management
- ✓ Scoring system and analysis engine
- ✓ Directory structure and file management
- ✓ Safety-first architecture (dry-run defaults)

### What Needs Configuration ⚙️
- **Plex Server Connection**: Currently configured for `http://localhost:32400`
  - Needs valid `PLEX_TOKEN` in `.env`
  - Update `PLEX_URL` if server is not on localhost
  
- **API Keys** (optional for metadata enrichment):
  - `TMDB_API_KEY` - TMDb for movie ratings
  - `OMDB_API_KEY` - OMDb for additional metadata

### Known Limitations
- **GUI Tests Fail**: PyQt6 requires system libraries (libEGL.so.1) not available in headless environments
  - This is expected and doesn't affect CLI functionality
  - GUI will work on systems with proper display/graphics libraries

---

## How to Use

### First Time Setup
1. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

2. **Configure Plex connection:**
   ```bash
   nano .env
   # Set PLEX_URL and PLEX_TOKEN
   ```

3. **Validate configuration:**
   ```bash
   plexiq config --validate
   ```

### Basic Operations

**View configuration:**
```bash
plexiq config
```

**Collect metadata from a library:**
```bash
plexiq collect "Movies" --enrich
```

**Analyze and get recommendations:**
```bash
plexiq analyze "Movies" --show-recommended
```

**Dry-run deletion (safe - doesn't actually delete):**
```bash
plexiq delete "Movies" --dry-run
```

**Launch GUI (requires display):**
```bash
plexiq gui
```

---

## File Changes

### New Files Created
- `venv/` - Python virtual environment (gitignored)
- `data/` - Data directories (gitignored)
- `.env` - Configuration file (gitignored)
- `demo_test.py` - Demo script showing core functionality
- `SETUP_COMPLETE.md` - This file

### Modified Files
- None (clean installation)

---

## Next Steps

### Immediate (To Get Fully Functional)
1. **Get Plex Token**:
   - Use the built-in setup wizard: `plexiq setup --execute`
   - Or manually: https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/

2. **Configure Plex Server URL**:
   - Update `PLEX_URL` in `.env` if not localhost

3. **Test Connection**:
   ```bash
   plexiq config --validate
   ```

### Optional Enhancements
1. **Add API Keys** for better metadata:
   - TMDb API: https://www.themoviedb.org/settings/api
   - OMDb API: http://www.omdbapi.com/apikey.aspx

2. **Customize Scoring Weights** in `.env`:
   - Adjust weights based on your priorities
   - Must sum to ~1.0

3. **Run Tests** (when GUI libraries available):
   ```bash
   pytest tests/ -v
   ```

### Future Development
- Add TV show episode-level analysis
- Implement duplicate detection
- Add scheduling for automated maintenance
- Multi-server support

---

## Command Reference

```bash
# View help
plexiq --help

# Configuration
plexiq config                    # View current config
plexiq config --validate         # Test connections
plexiq config --show-secrets     # Show API keys/tokens

# Setup wizard
plexiq setup --execute           # Interactive token setup

# Data collection
plexiq collect "Library Name"    # Collect metadata
plexiq collect Movies --enrich   # With external APIs

# Analysis
plexiq analyze Movies            # Analyze all items
plexiq analyze Movies --show-recommended  # Show deletion candidates
plexiq analyze Movies --format table      # Table output

# Deletion (safety-first)
plexiq delete Movies --dry-run   # Preview (default)
plexiq delete Movies --execute   # ACTUALLY delete (requires --confirm too)

# Backup management
plexiq backup list               # List all backups
plexiq backup restore <file>     # Restore from backup

# GUI
plexiq gui                       # Launch GUI
plexiq gui --library Movies      # Pre-select library
```

---

## Safety Features ✓

- **Dry-run by default** - No accidental deletions
- **Explicit confirmation required** - `--execute` and `--confirm` flags
- **Never deletes highly-rated content** - Threshold: ≥8.0/10
- **Automatic backups** - Created before operations
- **Detailed audit trail** - All actions logged

---

## Environment Details

- **Python Version:** 3.11.14
- **PlexIQ Version:** 3.2.0
- **Installation Type:** Development mode (`pip install -e .`)
- **Platform:** Linux 6.18.5
- **Working Directory:** `/home/user/PlexIQ`

---

## Support

- **Issues**: https://github.com/richknowles/PlexIQ/issues
- **Documentation**: See `README.md` and `docs/`
- **Examples**: See `examples/` directory

---

## Summary

🎉 **PlexIQ is successfully installed and operational!**

The core functionality has been verified and is working correctly. To start managing your Plex library:

1. Configure your Plex token (use `plexiq setup --execute`)
2. Validate the connection (`plexiq config --validate`)
3. Start collecting metadata (`plexiq collect Movies --enrich`)

All safety features are enabled by default. Happy organizing! 🌭
