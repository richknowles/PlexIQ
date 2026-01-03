# PlexIQ Docker Usage Guide

## Quick Start

### 1. Build the Image

docker-compose build

### 2. Configure Environment Variables

Your `.env` file is already configured with your API keys and settings.

**⚠️ SECURITY WARNING:** Never commit `.env` to version control! It contains sensitive API keys.

### 3. Enable X11 for GUI (Linux)

Before running GUI, allow Docker to access X11:

xhost +local:dockerTo revoke access later:
xhost -local:docker### 4. Run Commands
h
# CLI Commands
docker-compose run --rm plexiq plexiq collect Movies --enrich
docker-compose run --rm plexiq plexiq analyze Movies --show-recommended
docker-compose run --rm plexiq plexiq delete Movies --execute

# GUI Mode
docker-compose run --rm plexiq plexiq gui## Configuration

Your current configuration:
- **Plex Server:** http://10.0.0.10:32400
- **Physical Deletion:** ENABLED (DRY_RUN_DEFAULT=false)
- **TMDB API:** Configured
- **OMDB API:** Configured

## GUI Support

The Docker image includes full GUI support via X11 forwarding.

### Linux

1. Install X11 utilities (if not already installed):h
   sudo apt-get install x11-xserver-utils
   2. Allow Docker access:sh
   xhost +local:docker
   3. Run GUI:
   docker-compose run --rm plexiq plexiq gui
   
### macOS

1. Install XQuartz:
   brew install --cask xquartz
   2. Restart XQuartz and allow network connections:ash
   # In XQuartz preferences: Security → Allow connections from network clients
   3. Set DISPLAY:
   
   export DISPLAY=host.docker.internal:0
   4. Run GUI:
  
   docker-compose run --rm -e DISPLAY=host.docker.internal:0 plexiq plexiq gui
   ### Windows

Use WSL2 with X11 forwarding or use the native Windows installer instead of Docker for GUI.

## Persistent Data

All data (backups, logs, cache) is stored in the `plexiq-data` Docker volume and persists between container runs.

## Network Configuration

The container uses `network_mode: host` to access:
- Your Plex server at 10.0.0.10:32400
- X11 display server

If you need to change this, modify `docker-compose.yml` to use bridge networking instead.

## Physical Deletion

⚠️ **WARNING:** Physical deletion is ENABLED in your configuration.

- Default behavior: `--execute` flag is NOT required (dry-run is disabled)
- Always review recommendations before running delete commands
- Backups are still created automatically
- Highly-rated content (≥8.0) is still protected

To run a safe dry-run:
docker-compose run --rm plexiq plexiq delete Movies --dry-run## Common Commands

### Run One-Time Commands
docker-compose run --rm plexiq plexiq <command>### Interactive Shell
docker-compose run --rm plexiq /bin/bash### View Logs
docker-compose logs -f plexiq### Stop and Remove
docker-compose down### Remove Everything (including volumes)
docker-compose down -v## Troubleshooting

### GUI Not Displaying

1. Check X11 access:
   xhost
   # Should show "local:docker" in the list
   2. Check DISPLAY variable:
   echo $DISPLAY
   # Should be :0 or similar
   3. Test with a simple X11 app:
   docker-compose run --rm plexiq xeyes
   ### Container Can't Reach Plex Server

1. Verify Plex server is accessible:ash
   curl http://10.0.0.10:32400
   2. Check network mode in docker-compose.yml (should be "host")

### Permission Errors

The container runs as non-root user (UID 1000). If you mount volumes, ensure proper permissions:
sudo chown -R 1000:1000 /path/to/mounted/directory## Security Notes

1. **Never commit `.env` file** - It contains your API keys
2. **Review `.gitignore`** - Ensure `.env` is listed
3. **Rotate API keys** if they're ever exposed
4. **Use Docker secrets** in production environments
