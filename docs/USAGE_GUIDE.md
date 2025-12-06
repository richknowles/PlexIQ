# PlexIQ v3 Usage Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Common Workflows](#common-workflows)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Initial Setup

1. **Install PlexIQ**
   ```bash
   cd PlexIQ
   ./install.sh
   source venv/bin/activate
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Required settings:
   - `PLEX_URL`: Your Plex server URL (e.g., `http://localhost:32400`)
   - `PLEX_TOKEN`: Your Plex authentication token

3. **Validate Setup**
   ```bash
   plexiq config --validate
   ```

### Finding Your Plex Token

1. Open Plex Web App
2. Play any media item
3. Click on the "..." menu → "Get Info"
4. Click "View XML"
5. In the URL, find `X-Plex-Token=...`
6. Copy the token value

---

## Configuration

### Environment Variables

#### Plex Settings
```bash
PLEX_URL=http://192.168.1.100:32400  # Your Plex server
PLEX_TOKEN=abc123xyz                  # Your token
```

#### External API Keys (Optional)

Get TMDb API key from: https://www.themoviedb.org/settings/api
```bash
TMDB_API_KEY=your_tmdb_key_here
```

Get OMDb API key from: http://www.omdbapi.com/apikey.aspx
```bash
OMDB_API_KEY=your_omdb_key_here
```

#### Scoring Weights

Customize how PlexIQ scores items (must sum to ~1.0):
```bash
WEIGHT_PLAY_COUNT=0.3     # How much play count matters
WEIGHT_RATINGS=0.25       # How much external ratings matter
WEIGHT_SIZE=0.2           # How much file size matters
WEIGHT_AGE=0.15           # How much age/staleness matters
WEIGHT_QUALITY=0.1        # How much quality metrics matter
```

#### Safety Thresholds

```bash
MIN_DELETION_SCORE=0.7              # Minimum score to recommend deletion
NEVER_DELETE_RATING_THRESHOLD=8.0   # Never delete if rated >= 8.0/10
```

---

## Common Workflows

### Workflow 1: First-Time Library Analysis

```bash
# 1. Collect metadata with enrichment
plexiq collect Movies --enrich --output movies_data.json

# 2. Analyze with recommendations
plexiq analyze Movies --show-recommended --format report

# 3. Review dry-run deletion plan
plexiq delete Movies --dry-run

# 4. (Optional) Export analysis for review
plexiq analyze Movies --output analysis.json
```

### Workflow 2: Regular Maintenance

```bash
# Quick analysis without re-collection
plexiq analyze Movies --input previous_collection.json

# Review items with custom threshold
plexiq analyze Movies --min-score 0.8 --show-recommended

# Perform deletion after review
plexiq delete Movies --execute --confirm
```

### Workflow 3: Space Recovery

```bash
# Analyze focusing on large files
plexiq analyze Movies --show-recommended --format table

# Sort by size to see biggest candidates
plexiq analyze Movies --output analysis.json
# Then review analysis.json sorted by size

# Delete high-scoring large files
plexiq delete Movies --min-score 0.8 --execute
```

### Workflow 4: Quality Upgrade Path

```bash
# Find low-quality versions
plexiq analyze Movies --show-recommended

# Review items with low resolution
# (Check "Quality" scores in rationale)

# Mark for replacement, not deletion
# (Use dry-run to generate replacement list)
plexiq delete Movies --dry-run --output to_replace.json
```

---

## Advanced Usage

### Custom Scoring Scenarios

#### Scenario: Prioritize Unwatched Old Content
```bash
# Increase age weight
export WEIGHT_AGE=0.4
export WEIGHT_PLAY_COUNT=0.3
export WEIGHT_RATINGS=0.15
export WEIGHT_SIZE=0.1
export WEIGHT_QUALITY=0.05

plexiq analyze Movies --show-recommended
```

#### Scenario: Aggressive Space Recovery
```bash
# Prioritize large files
export WEIGHT_SIZE=0.5
export WEIGHT_RATINGS=0.2
export WEIGHT_PLAY_COUNT=0.2
export WEIGHT_AGE=0.08
export WEIGHT_QUALITY=0.02

plexiq analyze Movies --show-recommended
```

### Batch Processing

```bash
# Process multiple libraries
for lib in "Movies" "TV Shows" "Anime"; do
    echo "Processing: $lib"
    plexiq collect "$lib" --enrich --output "${lib// /_}_data.json"
    plexiq analyze "$lib" --show-recommended > "${lib// /_}_analysis.txt"
done
```

### Integration with Scripts

```python
#!/usr/bin/env python3
# custom_analysis.py - Custom PlexIQ automation

from plexiq import get_config, MetadataCollector, MediaAnalyzer

# Load configuration
config = get_config()

# Collect metadata
collector = MetadataCollector(config)
items = collector.collect_and_enrich("Movies")

# Custom filtering
large_unwatched = [
    item for item in items
    if item['plex']['view_count'] == 0
    and item['media']['size_bytes'] > 10 * 1024**3  # >10GB
]

# Analyze
analyzer = MediaAnalyzer(config)
analyzed = analyzer.analyze_items(large_unwatched)

# Your custom logic here
for item in analyzed:
    if item['deletion_score'] > 0.85:
        print(f"High priority: {item['title']}")
```

### GUI Automation

```bash
# Launch GUI with specific library
plexiq gui --library "Movies"

# The GUI maintains full CLI parity
# All CLI operations available via menu/buttons
```

---

## Troubleshooting

### Common Issues

#### Issue: "PLEX_TOKEN not set"
**Solution:**
```bash
# Verify .env file exists
ls -la .env

# Check token is set
grep PLEX_TOKEN .env

# Reload environment
source venv/bin/activate
```

#### Issue: "Failed to connect to Plex"
**Solution:**
```bash
# Test Plex URL
curl http://localhost:32400/identity

# Verify token
plexiq config --validate

# Check firewall/network
ping <plex-server-ip>
```

#### Issue: "No items meet deletion criteria"
**Solution:**
```bash
# Lower threshold
plexiq delete Movies --min-score 0.5 --dry-run

# Check current weights
plexiq config

# Review analysis details
plexiq analyze Movies --format report
```

#### Issue: External APIs not working
**Solution:**
```bash
# Validate API keys
plexiq config --validate

# Test TMDb
curl "https://api.themoviedb.org/3/movie/550?api_key=YOUR_KEY"

# Test OMDb
curl "http://www.omdbapi.com/?t=Inception&apikey=YOUR_KEY"
```

### Performance Tips

1. **Large Libraries**
   ```bash
   # Collect without enrichment first
   plexiq collect Movies --no-enrich

   # Then enrich in smaller batches
   # (Use custom scripts for batch processing)
   ```

2. **Slow Analysis**
   ```bash
   # Use cached data
   plexiq analyze Movies --input cached_data.json

   # Disable external API calls
   plexiq collect Movies --no-enrich
   ```

3. **GUI Performance**
   ```bash
   # Import pre-analyzed data
   # File → Import Analysis
   # Select analysis.json
   ```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
plexiq analyze Movies

# Check logs
tail -f data/logs/plexiq_*.log
```

---

## Safety Reminders

1. **Always test with dry-run first**
   ```bash
   plexiq delete Movies --dry-run
   ```

2. **Review backups before cleanup**
   ```bash
   plexiq backup list
   ```

3. **Keep backups of important analyses**
   ```bash
   plexiq analyze Movies --output important_analysis.json
   cp important_analysis.json ~/backups/
   ```

4. **Never delete without confirmation**
   - CLI requires `--execute --confirm`
   - GUI shows multiple confirmation dialogs

---

## Best Practices

### Regular Maintenance Schedule

**Weekly:**
```bash
# Quick health check
plexiq analyze Movies --show-recommended
```

**Monthly:**
```bash
# Full analysis with enrichment
plexiq collect Movies --enrich
plexiq analyze Movies --show-recommended --output monthly_$(date +%Y%m).json
```

**Quarterly:**
```bash
# Deep cleanup
plexiq delete Movies --min-score 0.8 --execute
plexiq backup cleanup
```

### Data Management

```bash
# Keep historical analyses
mkdir -p ~/plexiq-archives
cp data/backups/*.json ~/plexiq-archives/

# Regular log cleanup
plexiq backup cleanup
find data/logs -name "*.log" -mtime +30 -delete
```

---

For more help, visit: https://github.com/richknowles/PlexIQ/discussions
