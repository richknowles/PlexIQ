# PlexIQ v5.3.4 — The Chicago Edition 🌭

<p align="center">
  <img src="plexiq-demo.gif" alt="PlexIQ v5.3.4 demo" width="900" />
</p>

---

**Smart Plex Media Library Management. One slider. No nonsense. Just HOTDOGS.**

PlexIQ analyzes your Plex library using multi-factor scoring (play count, ratings, file size) and surfaces deletion candidates through a cinematic 1930s Chicago noir interface. Built with *The Untouchables* aesthetic — because even some of them had to die.

> **# We are NOT responsible for your data loss. #**
>
> You will be asked **three** times before anything gets deleted. The third time, you'll enter your deletion password. After that — it's gone. `OUR SOFTWARE WILL NOT BACK UP YOUR DATA EVER.` We love you. Be careful out there. ☠️


---

## GET YOUR REDHOTS! 🌭🌭🌭
### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;GET YOUR REDHOTS OVER HERE! 📣

---

## ✨ What's New in v5.3.4

### Chicago Mob Edition Features

- **🎯 Shooting Range Animation** - Deleted movies get a target lock → three shots (boom boom boom) → fade out
- **💀 THE HIT LIST** - Renamed from "Cut List" — movies awaiting their fate
- **🕊️ IN REMEMBRANCE** - Deleted movie history with grouping by session, total body count displayed
- **🗑️ Animated Wastebasket** - Fills up as movies are selected, pulses red at 10+ selections
- **📝 Deletion Banner** - Shows "THE HIT IS COMPLETE" with titles of casualties (persistent, no auto-dismiss)
- **📄 Page Numbers** - Replaced "Load More" with proper ◄ 1 2 [3] ... 8 ► pagination
- **🎨 Smaller Header** - PLEXIQ 24px / Hotdog 44px for cleaner layout

### v5.3.3 - UX Polish

- **Perfected Hotdog Slider** - Grab handle centered on track via flexbox
- **Color Palette Documentation** - Complete hex codes in COLOR_PALETTE.md
- **Live Deletion Count** - Candidates update in real-time as slider moves
- **Consistent Version Tags** - All UI elements aligned

### v5.3.2 - Chicago Edition Features

- **🔌 Auto-Reconnect** - Automatic Plex connection management with manual retry
- **💾 Session Persistence** - Your selections survive page refresh, disconnects, and accidental navigation
- **🧪 Enhanced Demo Library** - Clearly labeled safe testing environment  
- **🪄 Setup Wizard** - Interactive configuration with Plex token and optional API keys
- **⚡ Simple Installation** - One command to get started
- **📱 Dual Interfaces** - Feature parity between Web UI and Terminal UI

### Core Capabilities

- 📊 **Intelligent Scoring** — Multi-factor algorithm weighing play count, IMDb/TMDb/Rotten Tomatoes ratings, and file size. Run a fresh Plex library scan before deleting to ensure the freshest weights.
- 🌭 **The Hotdog Slider** — That one UI element is the **smartest** knob you have. Drag it. You'll understand immediately.
- ★ **The Untouchables** — Star any title to permanently protect it from the Cut List. Marquee lights included. No extra charge.
- 🛡️ **Dry Run by Default** — Nothing gets touched until you flip the switch. Ratings ≥ 8.0 are always protected, no exceptions.
- 🗑️ **THE CUT LIST** — Your deletion candidates, ranked by score. Multi-select, page through, or nuke the whole list. Your call.
- 📋 **Full Audit Trail** — Every action logged. What went where and when.

### UI/UX Principles

1. **Hotdog Grabbing** — The slider IS the interface. Pull it left, things get safer. Pull it right, things get spicy.
2. **The Untouchables** — Star it. Save it. Mean it.
3. **Three Strikes** — Three confirmation steps + password before live deletion. We really don't want you to be sad.
4. **Clarity & Feedback** — Progress bars, status dots, live Plex connection indicator.
5. **Aesthetic & Delight** — 1930s Chicago noir. Art deco gold. Police sirens when it gets real.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (check: `node --version`)
- **Plex Media Server** running and accessible
- **Plex Token** ([how to find it](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/))

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

Open [http://localhost:3000](http://localhost:3000)

---

## 🎨 Interfaces

### Web Interface (Primary)

```bash
cd web
npm run dev
```

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
   - Analyze and score items
   - Star items as untouchable
   - Practice deletion flow (dry-run)
   - Learn the interface

**Demo library is clearly labeled** with a 🧪 icon in both Web and TUI. Uses sample data - no real files affected.

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

## 🧮 Scoring System

Scores range from `0.0` (keep it forever) to `1.0` (why does this exist).

```
Score = 0.55 × (8 - rating) / 8   +   0.45 × e^(−plays × 0.9)
```

- **Ratings factor (55%)** — Low-rated content scores higher for deletion
- **Play count factor (45%)** — Never watched = high score. Rewatched 12 times = untouchable in spirit, even if not starred

**Hard rule:** Anything rated ≥ 8.0 is protected at the UI level regardless of score.

---

## 💾 Session Persistence

Your session survives:
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

## 🤝 Contributing / Licensing

Interested in licensing PlexIQ for commercial use, or want to join the cause?

Contact Rich: **support@itwerks.net**

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 TEAM HOTDOG! 🌭 💙 🌭

**Rich Knowles**
Developer | Cybersecurity Engineer | Musician

**OZ**
The Great & Beautiful

---

## 📞 Support

- **Email**: support@itwerks.net
- **Issues**: [GitHub Issues](https://github.com/richknowles/PlexIQ/issues)
- **Discussions**: [GitHub Discussions](https://github.com/richknowles/PlexIQ/discussions)

---

☠️ **Remember: Always test with Dry Run first. The hotdog will guide you. 🌭**
