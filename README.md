# PlexIQ v5.4.0 — Target Acquisition 🌭

<p align="center">
  <img src="plexiq-demo.gif" alt="PlexIQ v5.4.0 demo" width="900" />
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

## ✨ What's New in v5.4.0 — Target Acquisition

### Poster Grid View
- **🎬 Visual Poster Grid** — Browse your library as 130×195px Plex posters, just like the real thing
- **🎯 Target Selection** — Click any poster to acquire it as a target: red outline + crosshair overlay
- **📊 Table / Grid Toggle** — Switch between classic table view and poster grid view any time
- **Compact Stats Bar** — Library name, item count, size, and target count in a single clean line

### Weapon Select System
- **🔫 Choose Your Weapon** — Every deletion now routes through an armory modal: Tommy Gun, Sniper, Pistol, or C4
- **🎯 Sniper Scope** — Full GSAP-animated scope overlay with mil-dot reticle, real movie metadata HUD, lock-on sequence, and click-to-fire
- **💣 Chicago 3-Shot** — Tommy gun execution: neon flash × 3, heavy smoke, row collapse (3.2s)
- **⚡ Pistol** — Quick flash + fade (0.5s)
- **💥 C4** — Orange blast (0.8s)

### Scoring Upgrade
- **File Size Restored** — Two-pass normalization adds file size back into deletion scoring
- **New Weights:** Rating 35% / Plays 35% / File Size 30%

### v5.3.4 Highlights (still here)
- **💣 Bomb Builder** — Select targets to assemble 💣 → 💣🧨 → 💣🧨⏱️ → 💣🧨⏱️💥
- **🎯 THE HIT LIST** — Movies awaiting their fate
- **🕊️ IN REMEMBRANCE** — Deleted movie history with body count + space freed
- **📄 Pagination** — ◄ 1 2 [3] ... 8 ► proper page navigation
- **🚨 Police Lights** — Live mode confirmation bar

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (check: `node --version`)
- **Plex Media Server** running and accessible
- **Plex Token** ([how to find it](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/))

### Installation

```bash
git clone https://github.com/richknowles/PlexIQ.git
cd PlexIQ/web
npm install

# Create .env.local with your Plex credentials
echo "PLEX_HOST=http://YOUR_PLEX_IP:32400" >> .env.local
echo "PLEX_TOKEN=your_token_here" >> .env.local
echo "NEXT_PUBLIC_PLEX_HOST=http://YOUR_PLEX_IP:32400" >> .env.local
echo "NEXT_PUBLIC_PLEX_TOKEN=your_token_here" >> .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Demo Library

**Always test here first!**

1. Launch PlexIQ
2. Select **"🧪 Demo Library"** from dropdown
3. Practice the full workflow — analyze, star, select targets, dry-run deletion
4. No real files are ever touched

---

## 📖 How To Use

### Step 1: Select Library
Choose from dropdown or use **🧪 Demo Library** for testing.

### Step 2: Set Threshold
Drag the hotdog slider:
- **Left (conservative)** — Only worst candidates
- **Right (aggressive)** — More deletion candidates

### Step 3: Analyze
Click **"ANALYZE LIBRARY"** — PlexIQ scores every item using rating, plays, and file size.

### Step 4: Browse Targets
Default view is the **Poster Grid** — your library laid out like Plex, scored and color-coded.
Click posters to select targets (🎯 overlay + red border).
Switch to **Table View** for sortable columns.

### Step 5: Select Weapon & Delete
Click **DETONATE** → choose your weapon → confirm × 3 → enter password → execute.

---

## 🧮 Scoring System

Scores range from `0` (keep forever) to `100` (why does this exist).

```
Score = 0.35 × rFactor  +  0.35 × pFactor  +  0.30 × fFactor
```

- **rFactor** — `max(0, (8 - rating) / 8)` — Low-rated content scores higher
- **pFactor** — `exp(−plays × 0.9)` — Never watched = high score
- **fFactor** — `sizeBytes / maxSizeBytes` — Larger files score higher (normalized to library max)

Two-pass calculation: file size factor requires knowing the library maximum before any individual score can be computed.

**Hard rule:** Anything rated ≥ 8.0 is always protected, regardless of score.

---

## 📁 Project Structure

```
PlexIQ/
├── web/                        # Next.js app (the whole thing)
│   ├── app/
│   │   ├── page.tsx            # Main dashboard
│   │   ├── kill-demo/          # Weapon animation sandbox
│   │   └── api/
│   │       ├── analyze/        # Scoring endpoint (two-pass)
│   │       ├── libraries/      # Plex library list
│   │       ├── demo/           # Demo data
│   │       └── delete/         # Deletion endpoint
│   ├── components/
│   │   ├── poster-grid.tsx     # v5.4.0 poster grid
│   │   ├── threshold-slider.tsx
│   │   ├── library-stats.tsx
│   │   ├── deletion-feedback.tsx
│   │   └── mustard-progress.tsx
│   └── .env.local              # Your config (gitignored)
├── CLAUDE.md                   # AI development instructions
├── README.md
└── LICENSE
```

---

## ⚠️ Safety

PlexIQ **DELETES MEDIA FILES** via Plex API. Deletion is permanent. No undo.

**Built-in safeguards:**
- 🧪 Demo library for safe testing
- 🛡️ Dry run mode (default — nothing touched)
- ★ Star any title to permanently protect it
- 🎯 Rating ≥ 8.0 always protected automatically
- 🚨 Triple confirmation + password for live deletion

---

## 💾 Session Persistence

Selections, threshold, starred items, and dry-run state all survive page refresh and browser close. Clear via DevTools → Application → Clear site data.

---

## 🤝 Contact / Licensing

Interested in licensing PlexIQ for commercial use?

**Rich Knowles** — support@itwerks.net

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 TEAM HOTDOG! 🌭 💙 🌭

**Rich Knowles** — Developer | Cybersecurity Engineer | Musician

**OZ** — The Great & Beautiful

---

☠️ **Always test with Dry Run first. The hotdog will guide you. 🌭**
