# PlexIQ v5.3.2 — Production Ready Edition 🌭

<p align="center">
  <img src="plexiq-demo.gif" alt="PlexIQ v5.3.2 demo" width="900" />
</p>

---

**Smart Plex Media Library Management. Simple. Powerful. Production-ready.**

PlexIQ analyzes your Plex libraries using intelligent scoring (ratings, play count, file size) and helps you identify deletion candidates through an elegant web interface with 1930s Chicago noir aesthetics. Built for the $25K Anthropic funding presentation.

> **⚠️ SAFETY FIRST**
>
> PlexIQ deletes media files through Plex. Always test with the Demo Library first. Triple confirmation required for live deletion.

---

## ✨ What's New in v5.3.2

### Production Ready Features

- **🔌 Auto-Reconnect** - Automatic Plex connection management with manual retry
- **💾 Session Persistence** - Your selections survive page refresh, disconnects, and accidental navigation
- **🧪 Enhanced Demo Library** - Clearly labeled safe testing environment  
- **🪄 Setup Wizard** - Interactive configuration with Plex token and optional API keys
- **⚡ Simple Installation** - One command to get started
- **📱 Dual Interfaces** - Feature parity between Web UI and Terminal UI

### Core Capabilities

- 📊 **Intelligent Scoring** - Multi-factor algorithm (play count, ratings, file size)
- 🌭 **The Hotdog Slider** - Single control for deletion threshold
- ★ **The Untouchables** - Star items for permanent protection
- 🛡️ **Dry Run Mode** - Safe testing without actually deleting (default)
- 🗑️ **Smart Deletion** - Ratings ≥ 8.0 automatically protected
- 📋 **Full Audit Trail** - Complete logging of all operations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (check: `node --version`)
- **Plex Media Server** running and accessible
- **Plex Token** ([how to find it](https://support.plex.tv/articles/204059436))

### Installation (Recommended)

```bash
# Clone repository
git clone https://github.com/richknowles/PlexIQ.git
cd PlexIQ

# Run setup wizard
./setup.sh
```

The wizard handles everything: dependencies, configuration, Plex connection testing.

### Manual Installation

```bash
cd PlexIQ/web
npm install

# Create .env.local with your Plex credentials
echo "PLEX_HOST=http://YOUR_PLEX_IP:32400" >> .env.local
echo "PLEX_TOKEN=your_token_here" >> .env.local

# Launch
npm run dev
```

---

## 🎨 Interfaces

### Web Interface (Primary)

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Features:**
- 🌭 Hotdog slider for threshold control
- ★ Star system for protection
- 📊 Real-time library statistics
- 💾 Session persistence
- 🔄 Auto-reconnect
- 🧪 Demo library
- 🎨 1930s Chicago noir theme

### Terminal Interface (TUI)

```bash
npm run tui
```

**Same features, terminal-based:**
- Full keyboard navigation
- Library selection
- Threshold control (arrow keys)
- Star/unstar items
- Dry-run and live deletion

**Keys:**
- `↑/↓` - Navigate
- `←/→` - Adjust threshold
- `s` - Star item
- `Enter` - Confirm
- `Tab` - Switch panels
- `q` - Quit

---

## 🧪 Demo Library

**Always test here first!**

1. Launch PlexIQ (Web or TUI)
2. Select **"🧪 Demo Library"** from dropdown
3. Practice the full workflow:
   - Analyze library
   - Review scores
   - Star important items
   - Run dry-run deletion
   - Learn the interface safely

The demo library uses sample data - no real files affected.

---

## 📖 How To Use

### Step 1: Select Library

Choose from dropdown or use **🧪 Demo Library** for testing.

### Step 2: Set Threshold

Drag the hotdog slider:
- **Left (conservative)** - Only worst candidates
- **Right (aggressive)** - More deletion candidates

### Step 3: Analyze

Click **"ANALYZE LIBRARY"** - PlexIQ scores every item.

### Step 4: Review THE CUT LIST

- Check deletion candidates
- Review scores and ratings
- Star anything sacred (moves to "THE UNTOUCHABLES")

### Step 5: Test with Dry Run

**DRY RUN** mode (default) shows what *would* be deleted without actually deleting.

### Step 6: Go Live (When Ready)

1. Flip toggle to **LIVE MODE**
2. Three confirmation steps
3. Enter password
4. Deletion executes

---

## 🧮 Scoring Algorithm

```
Score = 0.55 × (8 - rating)/8  +  0.45 × e^(-plays × 0.9)
```

- **Score range**: 0.0 (keep forever) to 1.0 (prime deletion candidate)
- **Ratings factor (55%)**: Lower ratings = higher score
- **Play count factor (45%)**: Never watched = high score

**Protection**: Items rated ≥ 8.0 automatically protected regardless of score.

---

## 💾 Session Persistence

**New in v5.3.2!** Your session survives:
- Page refresh
- Browser disconnect
- Accidental navigation
- Tab closure and reopening

**Persisted:**
- Selected library
- Threshold value
- Starred items (Untouchables)
- Dry run mode

To reset: Clear browser storage (DevTools → Application → Clear site data).

---

## 🔌 Connection Management

**Auto-Reconnect**: PlexIQ maintains connection automatically.

**Manual Reconnect**: Click **"↺ RECONNECT TO PLEX"** button to:
- Refresh library list
- Re-establish connection
- Update library status

**Connection Indicators**:
- Green dot = Connected
- Red dot = Disconnected
- Yellow dot = Connecting

---

## 📁 Project Structure

```
PlexIQ/
├── setup.sh           # Setup wizard (start here!)
├── INSTALL.md         # Detailed installation guide
├── web/               # Next.js web application
│   ├── app/
│   │   ├── page.tsx           # Main dashboard
│   │   ├── api/
│   │   │   ├── libraries/     # Get Plex libraries
│   │   │   ├── analyze/       # Score items
│   │   │   ├── demo/          # Demo library data
│   │   │   └── delete/        # Deletion endpoint
│   │   └── globals.css
│   ├── components/
│   │   ├── threshold-slider.tsx
│   │   ├── library-stats.tsx
│   │   └── mustard-progress.tsx
│   └── .env.local     # Your config (created by setup)
├── tui/               # Terminal interface
│   └── plexiq-tui.js
└── legacy/            # Python v3.x code (archived)
```

---

## ⚠️ Important Safety Notes

PlexIQ **DELETES MEDIA FILES** via Plex API. It does NOT touch:
- System files
- Plex database
- Configuration
- User data

**Deletion is permanent.** There is no undo. There is no recovery.

**Safety features:**
- 🧪 Demo library for testing
- 🛡️ Dry run mode (default)
- ★ Star protection system
- 🎯 Automatic rating protection (≥ 8.0)
- 🚨 Triple confirmation + password
- 📋 Complete audit logging

---

## 🆘 Troubleshooting

### Can't connect to Plex

```bash
# Test connection
curl http://YOUR_PLEX_IP:32400/?X-Plex-Token=YOUR_TOKEN
```

If fails:
- Verify Plex is running
- Check IP and port (usually 32400)
- Confirm token is valid
- Check firewall

### Port 3000 in use

```bash
PORT=3001 npm run dev
```

### Session not persisting

Clear browser storage:
1. F12 (DevTools)
2. Application → Storage
3. Clear site data
4. Refresh

### Demo library not showing

Check `.env.local`:
```bash
NEXT_PUBLIC_DEMO_ENABLED=true
```

---

## 🤝 Contributing

This is production code for Anthropic funding presentation. For commercial licensing or contributions:

**Contact**: support@itwerks.net

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 👥 Team

**Rich Knowles**  
Developer | Cybersecurity Engineer | Musician  
[resume.richknowles.com](https://resume.richknowles.com)

**OZ (Claude Cowork)**  
The Great & Beautiful (Chicago Edition Designer)

**Scotty (Claude Code)**  
Production Engineering (v5.3.2)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/richknowles/PlexIQ/issues)
- **Email**: support@itwerks.net
- **Discussions**: [GitHub Discussions](https://github.com/richknowles/PlexIQ/discussions)

---

## 🎯 For Anthropic Presentation

PlexIQ v5.3.2 demonstrates:
- Production-ready code quality
- Elegant UI/UX design
- Intelligent algorithms
- Safety-first architecture
- Session persistence
- Connection management
- Comprehensive documentation
- Dual interface support

Built with Claude Code for the $25K funding opportunity.

---

☠️ **Always test with Demo Library first. The hotdog will guide you. 🌭**
