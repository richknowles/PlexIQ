# PlexIQ v4.x Dashboard Design - "Mini Skirt UI"

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Design Style:** ProxMenux-inspired, Executive-Level Interface

---

## Design Philosophy

**"Clean, modern, interactive dashboards with color-coded tiles, hover effects, and one-click actions for executive-level users."**

### Core Principles

1. **Visual Hierarchy** - Most critical info first, expandable details
2. **Color-Coded Status** - Instant recognition via 🟩🟨🟧🔴 tiles
3. **Interactive Elements** - Hover reveals, click to expand, drag to reorder
4. **Real-Time Updates** - Live logs, progress bars, status changes
5. **One-Click Actions** - No more than 2 clicks to any operation
6. **Responsive Design** - Full functionality on desktop, tablet, mobile
7. **Dark Mode First** - Executive-friendly, low-eye-strain interface

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PlexIQ Einstein Edition v4.0                [Settings] [Profile] [🔔]  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  System     │  │  PlexIQ     │  │  SickChill  │  │  Disk       │  │
│  │  Health     │  │  Core       │  │  Status     │  │  Space      │  │
│  │  🟩 Healthy │  │  🟩 Active  │  │  🟩 Running │  │  🟨 75%     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│  Media Libraries                                      [+ Add Library]   │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐   │
│  │  Movies 🎬                   │  │  TV Shows 📺                 │   │
│  │  450 items • 800 GB          │  │  120 shows • 650 GB          │   │
│  │  🟩 Last scan: 2h ago        │  │  🟩 Last scan: 3h ago        │   │
│  │  [Scan] [Analyze] [Cleanup]  │  │  [Scan] [Analyze] [Cleanup]  │   │
│  └──────────────────────────────┘  └──────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  Automation Hub - SickChill                           [View All Shows]  │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐  │
│  │  Active Downloads  │  │  Backlog Queue     │  │  Today's Grabs  │  │
│  │  2 in progress     │  │  🟨 50 missing     │  │  12 episodes    │  │
│  │  45% • 2m left     │  │  [Run Search]      │  │  [View Log]     │  │
│  └────────────────────┘  └────────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│  Activity Feed                                        [Filter] [Clear]  │
│  ┌─────────────────────────────────────────────────────────────────────┤
│  │  12:34:56  🟩 Download complete: The Mandalorian S04E01              │
│  │  12:30:12  🟦 Library scan started: TV Shows                         │
│  │  12:15:45  🟨 Warning: Disk space below 20%                          │
│  │  12:00:00  🟩 Analysis complete: 35 items recommended for deletion   │
│  └─────────────────────────────────────────────────────────────────────┤
├─────────────────────────────────────────────────────────────────────────┤
│  Quick Actions                                                          │
│  [Full Library Scan] [Run Backlog] [Delete Recommended] [View Reports] │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Status Tile System

### Color-Coded Indicators

**Visual System:**
- 🟩 **Green** - Good, healthy, no action needed
- 🟨 **Yellow** - Caution, monitor, optional action
- 🟧 **Orange** - Attention needed, recommended action
- 🔴 **Red** - Critical, immediate action required

### Tile States by Component

#### System Health
- 🟩 **Healthy** - All services running, no errors
- 🟨 **Degraded** - One service slow or non-critical issue
- 🟧 **Warning** - One service down but recoverable
- 🔴 **Critical** - Multiple services down or core failure

#### PlexIQ Core
- 🟩 **Active** - Core running, no pending tasks
- 🟨 **Busy** - Analysis or scan in progress
- 🟧 **Queued** - Multiple tasks queued, high load
- 🔴 **Error** - Core process failed or unreachable

#### SickChill Status
- 🟩 **Running** - Service healthy, recent activity
- 🟨 **Idle** - No recent downloads or searches
- 🟧 **Stalled** - Backlog not progressing, check config
- 🔴 **Offline** - Service unreachable or crashed

#### Disk Space
- 🟩 **Good** - >30% available
- 🟨 **Monitor** - 15-30% available
- 🟧 **Low** - 5-15% available
- 🔴 **Critical** - <5% available

#### Library Status
- 🟩 **Synced** - Recent scan, no issues
- 🟨 **Stale** - No scan in 24+ hours
- 🟧 **Errors** - Scan errors or missing files
- 🔴 **Offline** - Library unreachable

---

## Interactive Elements

### 1. Status Tiles (Top Row)

**Default State:**
```
┌─────────────┐
│  System     │
│  Health     │
│  🟩 Healthy │
│  Uptime 24h │
└─────────────┘
```

**Hover State:**
```
┌─────────────────────────┐
│  System Health          │
│  🟩 Healthy             │
│  ────────────────────   │
│  Uptime: 24h 15m        │
│  CPU: 15%               │
│  RAM: 2.1/8 GB          │
│  Services: 3/3          │
│  ────────────────────   │
│  [View Details →]       │
└─────────────────────────┘
```

**Click Action:** Opens modal with full system metrics, service logs, and restart buttons

---

### 2. Library Tiles

**Default State:**
```
┌──────────────────────────────┐
│  Movies 🎬                   │
│  450 items • 800 GB          │
│  🟩 Last scan: 2h ago        │
│  [Scan] [Analyze] [Cleanup]  │
└──────────────────────────────┘
```

**Hover State:**
```
┌──────────────────────────────────────┐
│  Movies 🎬                           │
│  450 items • 800 GB                  │
│  🟩 Last scan: 2h ago                │
│  ──────────────────────────────────  │
│  Top Rated: Shawshank (9.3)          │
│  Recent: Inception (added 1d ago)    │
│  Recommended Deletions: 15 (30 GB)   │
│  ──────────────────────────────────  │
│  [Scan] [Analyze] [Cleanup]          │
└──────────────────────────────────────┘
```

**Click Action:** Expands to show full library browser with sortable table of all items

---

### 3. Automation Tiles

**Active Downloads Tile:**
```
┌────────────────────────────────────────┐
│  Active Downloads                      │
│  2 in progress                         │
│  ────────────────────────────────────  │
│  The Mandalorian S04E01                │
│  ████████████░░░░░░░ 45%               │
│  10.5 MB/s • 2m left                   │
│  ────────────────────────────────────  │
│  Breaking Bad S03E07                   │
│  ███░░░░░░░░░░░░░░░░ 15%               │
│  8.2 MB/s • 8m left                    │
└────────────────────────────────────────┘
```

**Real-Time Updates:** Progress bars update live via WebSocket

---

### 4. Activity Feed

**Scrollable Log Stream:**
```
┌─────────────────────────────────────────────────────────────┐
│  Activity Feed                    [Filter ▼] [Clear]        │
├─────────────────────────────────────────────────────────────┤
│  12:34:56  🟩 Download complete: The Mandalorian S04E01     │
│            ↪ File: S04E01.mkv (1.5 GB, 1080p WEB-DL)        │
│            [View Details] [Scan Library]                    │
│  ────────────────────────────────────────────────────────── │
│  12:30:12  🟦 Library scan started: TV Shows                │
│            ↪ Progress: 120/120 shows scanned                │
│  ────────────────────────────────────────────────────────── │
│  12:15:45  🟨 Warning: Disk space below 20%                 │
│            ↪ Available: 50 GB / Total: 2000 GB              │
│            [View Storage] [Run Cleanup]                     │
│  ────────────────────────────────────────────────────────── │
│  12:00:00  🟩 Analysis complete: 35 items recommended       │
│            ↪ Space recoverable: 82.5 GB                     │
│            [View Report] [Delete Items]                     │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Auto-scroll to newest entries (can disable)
- Click to expand full details
- Filter by level (info, warning, error)
- Quick action buttons inline
- Color-coded by severity

---

## Page Layouts

### Dashboard (Home)

**Layout:** As shown in main overview above

**Key Sections:**
1. Status tiles (4 tiles, top row)
2. Library tiles (2-4 tiles, scrollable horizontal)
3. Automation tiles (3 tiles, SickChill focused)
4. Activity feed (scrollable, real-time)
5. Quick actions (sticky bottom bar)

---

### Library Browser (Expanded View)

**Triggered by:** Clicking library tile

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard              Movies Library                   🎬   │
├─────────────────────────────────────────────────────────────────────────┤
│  📊 Statistics                                                           │
│  450 items • 800 GB • Last scan: 2h ago • Recommended deletions: 15     │
│  ────────────────────────────────────────────────────────────────────── │
│  [Scan Library] [Analyze All] [Delete Recommended] [Export Report]      │
├─────────────────────────────────────────────────────────────────────────┤
│  Filters:  [All ▼] [Recommended ✓] [Protected ✓] [Unwatched ✓]        │
│  Sort by:  [Deletion Score ▼] [Ascending ▼]       🔍 Search...         │
├─────────────────────────────────────────────────────────────────────────┤
│  Title               Year  Rating  Size   Views  Score  Actions         │
│  ────────────────────────────────────────────────────────────────────── │
│  🔴 Old Movie        2005  3.2     8.5GB    0    0.92   [Delete] [Info] │
│  🟧 Boring Film      2010  5.5     4.2GB    1    0.78   [Delete] [Info] │
│  🟨 Mediocre Title   2015  6.8     3.1GB    2    0.65   [Keep]   [Info] │
│  🟩 Inception        2010  8.7     4.2GB    3    0.35   [Keep]   [Info] │
│  🟩 Shawshank Red.   1994  9.3     2.8GB   12    0.05   [Keep]   [Info] │
│  ────────────────────────────────────────────────────────────────────── │
│  Showing 5 of 450 items                               [1][2][3]...[90]  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Sortable columns (click header to sort)
- Multi-select for batch operations
- Color-coded rows by deletion score
- Expandable rows (click to show full metadata)
- Quick filter chips
- Pagination with page size selector

---

### SickChill Hub (Expanded View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard      Automation Hub - SickChill              📺    │
├─────────────────────────────────────────────────────────────────────────┤
│  📊 Status: 🟩 Running • 45 shows • 50 backlog • 12 downloads today     │
│  ────────────────────────────────────────────────────────────────────── │
│  [Force Backlog Search] [Pause All] [View SickChill UI →]               │
├─────────────────────────────────────────────────────────────────────────┤
│  📥 Active Downloads (2)                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  The Mandalorian S04E01 - Chapter 25                            │   │
│  │  ████████████░░░░░░░ 45%  •  10.5 MB/s  •  ETA: 2m              │   │
│  │  Quality: 1080p WEB-DL  •  Size: 1.5 GB                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Breaking Bad S03E07 - One Minute                               │   │
│  │  ███░░░░░░░░░░░░░░░░ 15%  •  8.2 MB/s  •  ETA: 8m               │   │
│  │  Quality: 720p WEB-DL  •  Size: 800 MB                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  📋 Tracked Shows (45)               [Filter: All ▼] 🔍 Search...       │
│  ┌────┬────────────────────┬────────┬────────┬──────┬─────────────┐   │
│  │ St │ Show Name          │ Status │ Next   │ Miss │ Actions     │   │
│  ├────┼────────────────────┼────────┼────────┼──────┼─────────────┤   │
│  │ 🟩 │ The Mandalorian    │ Active │ S04E01 │  0   │ [Edit][Log] │   │
│  │    │                    │        │ Dec 15 │      │             │   │
│  │ 🟨 │ Older Show         │ Paused │ -      │  15  │ [Edit][Log] │   │
│  │ 🟩 │ Breaking Bad       │ Active │ -      │  0   │ [Edit][Log] │   │
│  └────┴────────────────────┴────────┴────────┴──────┴─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time download progress bars
- Show status with next episode info
- Quick pause/resume/edit actions
- Link to SickChill native UI for advanced settings
- Backlog status with manual trigger

---

### Item Details Modal

**Triggered by:** Clicking [Info] or row in library browser

```
┌──────────────────────────────────────────────────────────────────┐
│  Inception (2010)                                      [✕ Close] │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  Title: Inception                                  │
│  │  Poster  │  Year: 2010                                        │
│  │  Image   │  Director: Christopher Nolan                       │
│  │  Here    │  Genre: Sci-Fi, Thriller                           │
│  └──────────┘  Runtime: 169 min                                  │
│                                                                   │
│  📊 Ratings                                                       │
│  IMDb: 8.7/10 • TMDb: 8.4/10 • Rotten Tomatoes: 72%             │
│                                                                   │
│  💾 Media Info                                                    │
│  Size: 4.2 GB • Resolution: 1080p • Codec: h264                  │
│  File: /media/movies/Inception (2010)/Inception.mkv              │
│                                                                   │
│  📈 Viewing History                                               │
│  View Count: 3 • Last Watched: 2 days ago                        │
│  Added: Dec 1, 2025                                              │
│                                                                   │
│  🎯 Deletion Analysis                                             │
│  Score: 0.35/1.00 (Low Priority)                                 │
│  Recommendation: KEEP (Protected - Highly Rated)                 │
│  ──────────────────────────────────────────────────────────────  │
│  Rationale:                                                       │
│  • Play count: 3 (occasional viewer) → low priority              │
│  • Ratings: avg 8.5/10 → PROTECTED                               │
│  • Size: 4.2 GB (moderate space recovery)                        │
│  • Age: Last watched 2 days ago → very low priority              │
│  • Quality: 1080p, h264 → score 0.30                             │
│                                                                   │
│  [Play in Plex] [Refresh Metadata] [Delete] [Close]              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme (Dark Mode)

### Primary Colors
- **Background:** `#0f172a` (slate-900)
- **Surface:** `#1e293b` (slate-800)
- **Surface Elevated:** `#334155` (slate-700)
- **Text Primary:** `#f1f5f9` (slate-100)
- **Text Secondary:** `#cbd5e1` (slate-300)
- **Border:** `#475569` (slate-600)

### Status Colors
- **Green (Success):** `#22c55e` (green-500)
- **Yellow (Warning):** `#eab308` (yellow-500)
- **Orange (Attention):** `#f97316` (orange-500)
- **Red (Critical):** `#ef4444` (red-500)
- **Blue (Info):** `#3b82f6` (blue-500)

### Accent Colors
- **Primary Accent:** `#F4A940` (PlexIQ mustard - from v3.1)
- **Hover State:** `#fbbf24` (amber-400)
- **Active State:** `#f59e0b` (amber-500)

### Progress Bars
- **Background:** `#334155` (slate-700)
- **Fill:** `#F4A940` (mustard gradient)
- **Success:** `#22c55e` (green-500)
- **Error:** `#ef4444` (red-500)

---

## Animations & Transitions

### Hover Effects
```css
.tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(244, 169, 64, 0.2);
  transition: all 0.2s ease-in-out;
}
```

### Progress Bars
```css
.progress-bar-fill {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    90deg,
    #F4A940 0%,
    #fbbf24 50%,
    #F4A940 100%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Status Indicators
```css
.status-indicator {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Toast Notifications
```css
.toast {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## Responsive Breakpoints

### Desktop (1920px+)
- 4 status tiles in top row
- 2-3 library tiles side-by-side
- Full activity feed visible
- All quick actions visible

### Laptop (1280px - 1919px)
- 4 status tiles (compact)
- 2 library tiles side-by-side
- Scrollable activity feed
- Quick actions in dropdown

### Tablet (768px - 1279px)
- 2 status tiles per row (stacked)
- 1 library tile per row
- Collapsible activity feed
- Floating action button

### Mobile (< 768px)
- 1 tile per row (stacked)
- Swipeable library cards
- Bottom sheet for activity feed
- Floating action button with menu

---

## Accessibility

### WCAG 2.1 AA Compliance
- ✅ Color contrast ratios ≥ 4.5:1 for text
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Screen reader support (ARIA labels)
- ✅ Focus indicators visible
- ✅ No flashing animations >3 Hz
- ✅ Resizable text up to 200%

### Keyboard Shortcuts
- `Ctrl+K` - Open command palette
- `Ctrl+L` - Focus library search
- `Ctrl+R` - Refresh dashboard
- `Esc` - Close modal/dropdown
- `?` - Show keyboard shortcuts help

---

## Component Library

### Recommended Tech Stack

**Framework:** React 18+ with TypeScript
**UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
**Charts:** Recharts or Chart.js
**Icons:** Lucide React or Heroicons
**Animations:** Framer Motion
**WebSocket:** Socket.IO client or native WebSocket API

### Key Components to Build

1. **StatusTile.tsx** - Reusable status tile with hover states
2. **LibraryCard.tsx** - Library tile with actions
3. **ProgressBar.tsx** - Animated progress bar (matching PlexIQ mustard)
4. **ActivityFeed.tsx** - Real-time log stream component
5. **MediaTable.tsx** - Sortable, filterable media table
6. **ItemModal.tsx** - Media item details modal
7. **NotificationToast.tsx** - Toast notification system
8. **QuickActionBar.tsx** - Sticky bottom action bar

---

## Next: Integration Map

See `04_INTEGRATION_MAP.md` for detailed API and data flow mappings.

---

**Document End**
