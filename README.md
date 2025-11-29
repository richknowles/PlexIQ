# PlexIQ 🎬

 

AI-Powered Plex Media Management System

 

## Overview

 

PlexIQ uses three specialized AI agents to analyze your Plex media library and generate intelligent recommendations for movies that can be safely deleted. It combines data from your Plex server with external ratings from OMDb, TMDb, and Rotten Tomatoes to create a comprehensive "delete score" for each movie.

 

### Features

 

- **Automated Analysis**: Three AI agents work together to collect, enrich, and analyze your media

- **Multi-Source Ratings**: Integrates IMDb, Rotten Tomatoes, and TMDb ratings

- **Smart Scoring**: Weighted algorithm considers ratings, play count, file size, age, and quality

- **Beautiful Dashboard**: AJ Ricardo-styled web interface with interactive visualizations

- **Space Recovery**: Calculates potential storage savings

- **Caching**: Smart caching to avoid API rate limits

 

## Architecture

 

### Three AI Agents

 

1. **Plex Collector** - Connects to your Plex server and extracts movie metadata

2. **Rating Enricher** - Enriches movies with external ratings from OMDb and TMDb APIs

3. **Analyzer** - Calculates delete scores using weighted algorithm

 

### Scoring Algorithm

 

- **Ratings (30%)**: Lower ratings = higher delete score

- **Play Count (30%)**: Never watched = higher delete score

- **File Size (20%)**: Larger files = higher score (more space to recover)

- **Age (10%)**: Not watched in years = higher score

- **Quality (10%)**: Combined quality indicators

 

## Installation

 

### Prerequisites

 

- Ubuntu 20.04+ or Debian 11+

- Python 3.8+

- Plex Media Server with valid token

- API keys for OMDb and TMDb

 

### Quick Deploy

 

```bash

cd plexiq

chmod +x deploy.sh

./deploy.sh

```

 

### Manual Installation

 

1. **Install Dependencies**:

```bash

sudo apt-get update

sudo apt-get install -y python3 python3-pip python3-venv

```

 

2. **Setup Backend**:

```bash

cd backend

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt

```

 

3. **Configure Environment**:

```bash

export PLEX_URL="http://10.0.0.10:32400"

export PLEX_TOKEN="your_plex_token"

export OMDB_API_KEY="your_omdb_key"

export TMDB_API_KEY="your_tmdb_key"

```

 

4. **Run Backend**:

```bash

python api.py

```

 

5. **Serve Frontend**:

```bash

cd ../frontend

python3 -m http.server 8080

```

 

## Configuration

 

### Environment Variables

 

| Variable | Description | Required |

|----------|-------------|----------|

| `PLEX_URL` | Plex server URL | Yes |

| `PLEX_TOKEN` | Plex authentication token | Yes |

| `OMDB_API_KEY` | OMDb API key | Yes |

| `TMDB_API_KEY` | TMDb API key | Yes |

 

### Getting API Keys

 

**OMDb API**:

1. Visit https://www.omdbapi.com/apikey.aspx

2. Register for free API key (1,000 requests/day)

 

**TMDb API**:

1. Visit https://www.themoviedb.org/settings/api

2. Create account and request API key

 

**Plex Token**:

1. Sign in to Plex Web App

2. Play any media item

3. View XML of item: `More (...) > Get Info > View XML`

4. Look for `X-Plex-Token` in URL

 

## Usage

 

### Web Dashboard

 

1. Open browser: `http://your-server-ip:8080`

2. Click "Start Analysis"

3. Wait for analysis to complete

4. Browse delete candidates sorted by priority

 

### API Endpoints

 

| Endpoint | Method | Description |

|----------|--------|-------------|

| `/api/health` | GET | Health check |

| `/api/status` | GET | Current analysis status |

| `/api/analyze` | POST | Trigger new analysis |

| `/api/movies` | GET | Get all analyzed movies |

| `/api/report` | GET | Get summary report |

| `/api/stats` | GET | Get statistics |

| `/api/cache/clear` | POST | Clear cache |

 

### Example API Call

 

```bash

# Trigger analysis

curl -X POST http://localhost:5000/api/analyze

 

# Get statistics

curl http://localhost:5000/api/stats

 

# Get top delete candidates

curl http://localhost:5000/api/movies?min_score=70&limit=20

```

 

## Caddy Reverse Proxy

 

Add to your Caddyfile:

 

```caddy

plexiq.oz.alisium.run {

    reverse_proxy localhost:8080

}

 

plexiq-api.oz.alisium.run {

    reverse_proxy localhost:5000

}

```

 

## Service Management

 

```bash

# Start services

sudo systemctl start plexiq-backend plexiq-frontend

 

# Stop services

sudo systemctl stop plexiq-backend plexiq-frontend

 

# Restart services

sudo systemctl restart plexiq-backend plexiq-frontend

 

# View status

sudo systemctl status plexiq-backend plexiq-frontend

 

# View logs

sudo journalctl -u plexiq-backend -f

```

 

## Troubleshooting

 

### Backend won't start

 

```bash

# Check logs

sudo journalctl -u plexiq-backend -n 50

 

# Test manually

cd /opt/plexiq/backend

source venv/bin/activate

python api.py

```

 

### Cannot connect to Plex

 

```bash

# Test Plex connection

curl http://10.0.0.10:32400/library/sections?X-Plex-Token=YOUR_TOKEN

 

# Verify Plex is running

systemctl status plexmediaserver

```

 

### API rate limits

 

PlexIQ automatically implements rate limiting to stay within free tier limits:

- OMDb: 1,000 requests/day

- TMDb: No hard limit but implements 1-second delays

 

Results are cached for 6 hours to minimize API calls.

 

## Development

 

### Project Structure

 

```

plexiq/

├── backend/

│   ├── agents/

│   │   ├── plex_collector.py    # Agent 1

│   │   ├── rating_enricher.py   # Agent 2

│   │   └── analyzer.py          # Agent 3

│   ├── api.py                   # Flask REST API

│   └── requirements.txt

├── frontend/

│   ├── index.html              # Main HTML

│   ├── app.js                  # Vue.js app

│   └── styles.css              # ProxMenux styling

├── deploy.sh                   # Deployment script

└── README.md

```

 

### Tech Stack

 

**Backend**:

- Python 3.8+

- Flask (REST API)

- plexapi (Plex integration)

- requests (API calls)

 

**Frontend**:

- Vue.js 3

- Chart.js (visualizations)

- Axios (HTTP client)

- Font Awesome (icons)

 

## Roadmap

 

- [ ] Email notifications for analysis completion

- [ ] Automated deletion with approval workflow

- [ ] TV show support

- [ ] Music library analysis

- [ ] Integration with Sonarr/Radarr

- [ ] Machine learning for personalized recommendations

 

## Credits

 

Made with MUSTARD ONLY 🌭

 

## License

 

MIT License - See LICENSE file for details

 

## Support

 

For issues, questions, or feature requests, please open an issue on GitHub.

 

---

 

**PlexIQ** - WARNING: Do not process with "The Terminator" as content may become self-aware 🌭🩻🤖🎬✨

 