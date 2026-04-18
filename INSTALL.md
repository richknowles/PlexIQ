# PlexIQ v5.3.2 - Installation Guide

## 🚀 Quick Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/richknowles/PlexIQ.git
cd PlexIQ

# Run the setup wizard
./setup.sh
```

That's it! The setup wizard will:
- Check for Node.js 18+
- Install dependencies
- Guide you through Plex configuration
- Set up API keys (optional)
- Create demo library for testing
- Launch the application

---

## 📋 Manual Installation

### Prerequisites

- **Node.js 18+** (check with `node --version`)
- **Plex Media Server** running and accessible
- **Plex Token** ([how to find it](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/))

### Step 1: Install Dependencies

```bash
cd PlexIQ/web
npm install
```

### Step 2: Configure Plex Connection

Create `.env.local` in the `web/` directory:

```bash
PLEX_HOST=http://YOUR_PLEX_IP:32400
PLEX_TOKEN=your_plex_token_here

# Optional: API keys for enhanced metadata
TMDB_API_KEY=your_tmdb_key
OMDB_API_KEY=your_omdb_key
```

**Option:** Run the interactive setup wizard instead:
```bash
npm run setup
```

### Step 3: Launch the Application

```bash
# Web Interface (recommended)
npm run dev

# Terminal User Interface (TUI)
npm run tui
```

---

## 🌐 Web Interface

Access at: **http://localhost:3000**

Features:
- 🌭 The Famous Hotdog Slider™
- ★ The Untouchables (starred protection)
- 📊 Real-time library analysis
- 🎨 1930s Chicago noir theme
- 💾 Session persistence (survives page refresh!)
- 🔄 Auto-reconnect to Plex
- 🧪 Demo library for safe testing

---

## 💻 Terminal Interface (TUI)

Run: `npm run tui`

Same features as Web UI:
- Library selection and analysis
- Threshold control (arrow keys)
- Star/unstar items
- Dry-run and live deletion
- Real-time Plex connection status

**Keyboard Shortcuts:**
- `↑/↓` - Navigate lists
- `←/→` - Adjust threshold slider
- `s` - Star/unstar selected item
- `Enter` - Confirm actions
- `Tab` - Switch between panels
- `q` or `Ctrl+C` - Exit

---

## 🧪 Demo Library

PlexIQ includes a built-in demo library for safe testing:

1. Select **"Demo Library"** from the library dropdown
2. This uses sample data - no real files are affected
3. Test all features risk-free:
   - Analyze and score items
   - Star items as untouchable
   - Practice deletion flow (dry-run)
   - Learn the interface

**Demo library is clearly labeled** with a 🧪 icon in both Web and TUI.

---

## 🔧 Troubleshooting

### Can't connect to Plex

```bash
# Test your Plex connection
curl http://YOUR_PLEX_IP:32400/?X-Plex-Token=YOUR_TOKEN
```

If this fails:
- Check Plex is running
- Verify IP address and port
- Confirm token is valid
- Check firewall settings

### Port 3000 already in use

```bash
# Use a different port
PORT=3001 npm run dev
```

### Session not persisting

Clear browser storage and reload:
1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Refresh page

---

## 🔄 Updating PlexIQ

```bash
cd PlexIQ
git pull origin MAIN
cd web
npm install  # Get new dependencies
npm run dev
```

---

## 📚 Next Steps

1. **Test with Demo Library** - Get comfortable with the interface
2. **Select Your Library** - Connect to your real Plex libraries
3. **Analyze** - Review scores and recommendations
4. **Star Important Items** - Protect content you want to keep
5. **Dry Run First** - Always test deletion with dry-run mode
6. **Go Live** - When ready, flip to live mode (triple confirmation required)

---

## 🆘 Support

- **Issues**: https://github.com/richknowles/PlexIQ/issues
- **Email**: support@itwerks.net
- **Discussions**: https://github.com/richknowles/PlexIQ/discussions

---

☠️ **Remember: Always test with Dry Run first. The hotdog will guide you. 🌭**
