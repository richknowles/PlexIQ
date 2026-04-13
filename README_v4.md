# PlexIQ v4.0 "ProxMenux Edition" 🎬

**THE ONE SLIDER Revolution - Smart Plex Media Library Management**

> Inspired by [ProxMenux](https://proxmenux.com) - Simple. Powerful. Beautiful.

---

## 🌟 What Makes v4.0 Special?

PlexIQ v4.0 is a **complete reimagining** of media library management, taking inspiration from the elegance and simplicity of ProxMenux. We've stripped away complexity and focused on what matters: **intelligent automation with simple control**.

### THE ONE SLIDER Philosophy

**Everything you need. Nothing you don't.**

Previous versions had complex multi-parameter configurations. v4.0 has **ONE SLIDER** to control the deletion threshold. That's it. PlexIQ's intelligent analysis handles everything else:

- ✅ Multi-factor scoring (play count, ratings, size, age, quality)
- ✅ External metadata enrichment (IMDb, TMDb, Rotten Tomatoes)
- ✅ Safety-first design (highly-rated content never deleted)
- ✅ Automatic backups and audit trails
- ✅ Dry-run defaults with explicit confirmations

**One slider. Infinite intelligence.**

---

## 🚀 Quick Start

### One-Liner Installation

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/richknowles/PlexIQ/main/install.sh)"
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/richknowles/PlexIQ.git
cd PlexIQ

# Install dependencies
npm install

# Install Python dependencies (for backend)
pip install -r requirements.txt

# Setup your Plex token
plexiq setup --execute

# Launch the web dashboard
npm run web

# OR launch the TUI (Terminal User Interface)
npm run tui
```

---

## 🎨 Interfaces

PlexIQ v4.0 offers **three** beautiful interfaces, all with the same ONE SLIDER philosophy:

### 1. Web Dashboard (Next.js 14 + TypeScript)

**ProxMenux-inspired modern web interface**

```bash
npm run web
```

Then open: `http://localhost:3000`

**Features:**
- 🌑 Dark gradient theme with mustard accent colors
- 📊 Real-time library statistics
- 🎯 THE ONE SLIDER for threshold control
- 📱 Responsive design (mobile + desktop)
- ⚡ Live progress indicators
- 🔍 Interactive recommendation tables

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18

### 2. Terminal User Interface (TUI)

**ProxMenux-style menu-driven interface**

```bash
npm run tui
```

**Features:**
- 🖥️ Full terminal UI with blessed
- ⌨️ Keyboard-driven navigation
- 📊 Real-time monitoring
- 🎚️ ASCII slider visualization
- 🎨 ProxMenux-inspired design language

**Keyboard Controls:**
- `↑↓` - Navigate menus
- `Enter` - Select option
- `+/-` - Adjust threshold
- `Q` - Quit

### 3. Python CLI (Legacy)

**Original command-line interface**

```bash
# Activate virtual environment
source venv/bin/activate

# Run CLI commands
plexiq analyze Movies --show-recommended
plexiq delete Movies --dry-run
plexiq gui  # PyQt6 GUI
```

---

## 📖 Usage Guide

### The Workflow (Same Across All Interfaces)

1. **Select Library** - Choose Movies, TV Shows, etc.
2. **Set Threshold** - Adjust THE ONE SLIDER (0.0-1.0)
   - `0.5-0.6` = Conservative
   - `0.7` = **Recommended** (Aggressive)
   - `0.8+` = Very Aggressive
3. **Analyze** - PlexIQ collects, enriches, and scores your media
4. **Review** - See recommendations sorted by score
5. **Delete (Dry Run)** - Preview what would be deleted
6. **Delete (Execute)** - Confirm and execute (requires explicit confirmation)

### Understanding the Threshold

The threshold determines the **minimum score** required for deletion recommendation:

| Threshold | Description | Use Case |
|-----------|-------------|----------|
| 0.5 | Very Conservative | Keep almost everything |
| 0.6 | Moderate | Balanced approach |
| **0.7** | **Aggressive** (Default) | **Recommended for most users** |
| 0.8 | Very Aggressive | Delete most unwatched content |
| 0.9+ | Extreme | Only keep favorites |

**Safety Note:** Regardless of threshold, items with ratings ≥ 8.0/10 are **never deleted**.

---

## 🎯 Design Principles (ProxMenux-Inspired)

### 1. **Minimalism Over Complexity**
- ONE SLIDER instead of 5+ configuration options
- Clean, function-forward interface
- No unnecessary visual clutter

### 2. **Safety First**
- Dry-run defaults
- Explicit confirmations for destructive operations
- Highly-rated content protected
- Automatic backups

### 3. **Accessibility**
- Works in terminal, web browser, or desktop GUI
- Keyboard-driven navigation
- Universal compatibility

### 4. **Professional Aesthetic**
- Dark gradient theme
- Mustard/amber accent colors
- Consistent design language across all interfaces
- ProxMenux-style visual hierarchy

### 5. **Intelligent Automation**
- Multi-factor scoring system
- External metadata enrichment
- Contextual recommendations
- Background processing

---

## 📊 Scoring System

PlexIQ uses a weighted multi-factor scoring algorithm (0.0-1.0):

### Factors

1. **Play Count (30%)** - Never watched = high score
2. **External Ratings (25%)** - Low ratings = high score
3. **File Size (20%)** - Larger files = higher score
4. **Age/Staleness (15%)** - Old + unwatched = high score
5. **Quality (10%)** - Lower resolution/codecs = higher score

### Safety Rules

- ❌ **Never recommend** if average rating ≥ 8.0/10
- ✅ **Always backup** before deletion
- ⚠️ **Explicit confirmation** required for execution
- 📝 **Detailed rationale** for every score

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```bash
# Required
PLEX_URL=http://localhost:32400
PLEX_TOKEN=your_plex_token_here

# Optional API Keys (for metadata enrichment)
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_omdb_api_key

# Safety Thresholds
MIN_DELETION_SCORE=0.7
NEVER_DELETE_RATING_THRESHOLD=8.0
```

### Guided Setup

```bash
plexiq setup --execute
```

The wizard will:
1. Open browser for automatic token capture
2. Validate Plex connection
3. Save secure configuration
4. Test API access

---

## 🏗️ Architecture

```
PlexIQ v4.0/
├── web/                    # Next.js 14 Web Dashboard
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   │   ├── threshold-slider.tsx    # THE ONE SLIDER
│   │   ├── library-stats.tsx
│   │   └── mustard-progress.tsx
│   ├── types/             # TypeScript definitions
│   └── package.json
│
├── tui/                   # Terminal User Interface
│   └── plexiq-tui.js     # Blessed-based TUI
│
├── plexiq/               # Python Backend
│   ├── analyzer.py       # Scoring engine
│   ├── collector.py      # Metadata collection
│   ├── backup.py         # Backup manager
│   ├── cli.py            # CLI entry point
│   └── gui/              # PyQt6 GUI (legacy)
│
├── docs/                 # Documentation
├── tests/                # Test suite
└── package.json          # NPM scripts
```

---

## 🎬 Screenshots

### Web Dashboard
![Web Dashboard - THE ONE SLIDER](docs/screenshots/web-dashboard.png)
*Clean, ProxMenux-inspired interface with THE ONE SLIDER*

### TUI
![Terminal User Interface](docs/screenshots/tui.png)
*Menu-driven terminal interface with ASCII slider*

### Analysis Results
![Analysis Results](docs/screenshots/results.png)
*Real-time recommendations with detailed rationale*

---

## 🚦 Roadmap

### v4.1 (Planned)
- [ ] API endpoints for remote access
- [ ] WebSocket support for real-time updates
- [ ] Mobile app (React Native)
- [ ] Docker support with docker-compose
- [ ] Multi-server management

### v4.2 (Planned)
- [ ] TV show episode-level analysis
- [ ] Duplicate detection
- [ ] Cloud storage integration
- [ ] Advanced scheduling
- [ ] *arr stack integration (Radarr, Sonarr)

### Future (PlatformIQ)
- [ ] Multi-service support (Jellyfin, Emby)
- [ ] AI-powered recommendations
- [ ] Community sharing of configurations
- [ ] Plugin system for extensibility

---

## 🤝 Contributing

PlexIQ v4.0 is built for the community. Contributions welcome!

### Development Setup

```bash
# Clone and install
git clone https://github.com/richknowles/PlexIQ.git
cd PlexIQ

# Install all dependencies
npm install
pip install -r requirements.txt
cd web && npm install && cd ..

# Run tests
pytest
npm test

# Start development
npm run web      # Web dashboard (localhost:3000)
npm run tui      # TUI
```

### Guidelines

1. Follow the **ONE SLIDER** philosophy - simplicity over complexity
2. Maintain **ProxMenux-inspired** design language
3. **Safety first** - never compromise on user data protection
4. Write tests for new features
5. Update documentation

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 👤 Author

**Rich Knowles**  
Cybersecurity Engineer | Media Enthusiast | ProxMenux Fan

Built with ❤️ and inspired by the beautiful simplicity of [ProxMenux](https://proxmenux.com)

---

## 🙏 Acknowledgments

- **ProxMenux** - Design inspiration and UI/UX philosophy
- **Plex Team** - Excellent media server platform
- **TMDb & OMDb** - Metadata APIs
- **Next.js Team** - Amazing React framework
- **Blessed** - Terminal UI library

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/richknowles/PlexIQ/issues)
- **Discussions**: [GitHub Discussions](https://github.com/richknowles/PlexIQ/discussions)
- **Twitter**: [@richknowles](https://twitter.com/richknowles)

---

## ⚠️ Important Safety Notice

PlexIQ deletes **Plex media files** (movies/shows). It does NOT touch:
- System files
- Plex database
- User data
- Configuration files

**Always test with `--dry-run` first! 🛡️**

---

**PlexIQ v4.0 - The ONE SLIDER Revolution**

*Simple. Powerful. Beautiful.*
