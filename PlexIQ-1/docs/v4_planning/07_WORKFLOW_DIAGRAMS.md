# PlexIQ v4.x Workflow Diagrams & Flowcharts

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Purpose:** Visual representation of key workflows and interactions

---

## Table of Contents

1. [System Startup Sequence](#system-startup-sequence)
2. [New Episode Download Flow](#new-episode-download-flow)
3. [Manual Library Analysis Flow](#manual-library-analysis-flow)
4. [Deletion Workflow](#deletion-workflow)
5. [Real-Time WebSocket Flow](#real-time-websocket-flow)
6. [Notification Dispatch Flow](#notification-dispatch-flow)
7. [SickChill Backlog Search Flow](#sickchill-backlog-search-flow)
8. [Error Handling & Recovery](#error-handling--recovery)

---

## System Startup Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    PlexIQ v4.x Startup Flow                     │
└─────────────────────────────────────────────────────────────────┘

Step 1: Infrastructure
┌──────────────┐
│ Docker Start │
└──────┬───────┘
       │
       ├─→ Start Redis Container
       │   └─→ Port 6379 ready
       │
       └─→ Start SickChill Container
           └─→ Port 8081 ready
           └─→ Load SickChill config
           └─→ Connect to download clients


Step 2: Backend Services
┌──────────────────┐
│ API Gateway Init │
└────────┬─────────┘
         │
         ├─→ Load .env configuration
         │   └─→ Validate required vars (PLEX_TOKEN, SICKCHILL_API_KEY)
         │
         ├─→ Initialize PlexIQ Core
         │   └─→ Connect to Plex Server (port 32400)
         │   └─→ Validate Plex token
         │   └─→ Load library list
         │
         ├─→ Initialize SickChill Client
         │   └─→ Connect to SickChill API (port 8081)
         │   └─→ Validate API key
         │   └─→ Fetch show list
         │
         ├─→ Initialize Redis Connection
         │   └─→ Connect to Redis (port 6379)
         │   └─→ Set up pub/sub channels
         │
         ├─→ Start WebSocket Server
         │   └─→ Listen on /api/v4/ws
         │
         └─→ Start HTTP Server
             └─→ Listen on port 8000
             └─→ API ready: http://localhost:8000


Step 3: Monitoring & Background Tasks
┌────────────────────┐
│ Background Workers │
└─────────┬──────────┘
          │
          ├─→ Start SickChill Queue Monitor (poll every 5s)
          │   └─→ Detect download completions
          │   └─→ Send WebSocket events
          │
          ├─→ Start Health Check Monitor (poll every 30s)
          │   └─→ Check Plex Server health
          │   └─→ Check SickChill health
          │   └─→ Check Redis health
          │   └─→ Update status via WebSocket
          │
          └─→ Start Notification Worker
              └─→ Process notification queue


Step 4: Frontend (Dashboard)
┌──────────────────┐
│ Dashboard Start  │
└────────┬─────────┘
         │
         ├─→ Load React App (http://localhost:5173)
         │
         ├─→ Initialize API Client
         │   └─→ Fetch initial data:
         │       - GET /api/v4/status
         │       - GET /api/v4/libraries
         │       - GET /api/v4/automation/sickchill/status
         │
         ├─→ Establish WebSocket Connection
         │   └─→ ws://localhost:8000/api/v4/ws
         │   └─→ Send auth message with JWT
         │   └─→ Subscribe to events
         │
         └─→ Render Dashboard
             └─→ Display status tiles
             └─→ Display library cards
             └─→ Display activity feed
             └─→ Ready for user interaction


Step 5: System Ready
┌──────────────────────────────────────────┐
│  ✅ All Services Running                 │
│  ✅ API Gateway: http://localhost:8000   │
│  ✅ Dashboard: http://localhost:5173     │
│  ✅ SickChill: http://localhost:8081     │
│  ✅ WebSocket: Connected                 │
│  ✅ Notifications: Enabled               │
└──────────────────────────────────────────┘
```

---

## New Episode Download Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              New Episode Download & Processing                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  SickChill RSS  │
│  Feed Check     │
│  (Every 15min)  │
└────────┬────────┘
         │
         ▼
    New Episode
    Detected?
         │ YES
         ▼
┌─────────────────────────────┐
│  SickChill Searches         │
│  Torrent/Usenet Indexers    │
└─────────────┬───────────────┘
              │
              ▼
         Found Release?
              │ YES
              ▼
┌─────────────────────────────┐
│  Send to Download Client    │
│  (Transmission/Deluge/etc)  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐     ┌──────────────────────┐
│  Downloading...             │────→│  PlexIQ Monitors     │
│  Progress: 0% → 100%        │     │  SickChill Queue     │
└─────────────┬───────────────┘     │  (Poll every 5s)     │
              │                     └──────────┬───────────┘
              │                                │
              │ Download Complete              │
              ▼                                ▼
┌─────────────────────────────┐     ┌──────────────────────┐
│  SickChill Post-Processing  │     │  Change Detected!    │
│  - Rename file              │     │  Send WebSocket evt  │
│  - Move to TV folder        │     │  Type: download_prog │
│  - Update database          │     └──────────────────────┘
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Call Post-Processing Hook  │
│  /path/to/webhook_script.sh │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  POST /api/v4/webhooks/sickchill            │
│  Body: {                                    │
│    "event": "download_complete",            │
│    "show_name": "The Mandalorian",          │
│    "season": 4,                             │
│    "episode": 1,                            │
│    "file_path": "/tv/The Mandalorian/..."   │
│  }                                          │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│  API Gateway Webhook Handler│
└─────────────┬───────────────┘
              │
              ├─→ Send WebSocket Event
              │   └─→ { "type": "episode_added", ... }
              │
              ├─→ Trigger Plex Library Scan
              │   └─→ plex.library.section("TV Shows").update()
              │
              └─→ Send Notification
                  └─→ NotificationDispatcher.send(...)


              ┌─────────────────────────┐
              │  Plex Scans Library     │
              │  Detects new file       │
              │  Downloads metadata     │
              └─────────────┬───────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Dashboard Updates      │
              │  - Toast notification   │
              │  - Activity feed entry  │
              │  - Library counter +1   │
              │  - Download tile clear  │
              └─────────────────────────┘

┌──────────────────────────────────────────┐
│  ✅ User sees new episode in Plex        │
│  ⏱️ Total time: 5-30 minutes             │
│  🔔 Notification sent (if configured)   │
└──────────────────────────────────────────┘
```

**Timeline:**
- SickChill RSS check: Every 15 minutes
- Download duration: 5-30 minutes (depends on speed)
- PlexIQ queue poll: 5 seconds (detects completion)
- Webhook → Dashboard: <1 second
- Plex scan: 10-60 seconds
- Total user-visible latency: <2 seconds (from download complete to dashboard update)

---

## Manual Library Analysis Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                Manual Library Analysis Workflow                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  User Action     │
│  Clicks "Analyze"│
│  on Library Tile │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Dashboard → API                        │
│  POST /api/v4/libraries/1/analyze       │
│  Body: { "enrich_metadata": true }      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  API Gateway                            │
│  - Validates request                    │
│  - Creates async task                   │
│  - Returns task_id immediately          │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Response (202 Accepted)                │
│  {                                      │
│    "task_id": "abc123",                 │
│    "status": "pending",                 │
│    "estimated_duration_seconds": 120    │
│  }                                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Dashboard                              │
│  - Shows progress modal                 │
│  - "Analyzing Movies library..."        │
│  - Progress bar: 0%                     │
└─────────────────────────────────────────┘


              ┌────────────────────────────────┐
              │  Background Task (PlexIQ Core) │
              └────────────┬───────────────────┘
                           │
                           ├─→ Step 1: Fetch items from Plex (10%)
                           │   └─→ GET /library/sections/1/all
                           │   └─→ Send WS: { "progress": 10 }
                           │
                           ├─→ Step 2: Parse metadata (20%)
                           │   └─→ Extract: title, year, size, views
                           │   └─→ Send WS: { "progress": 20 }
                           │
                           ├─→ Step 3: Enrich metadata (30-70%)
                           │   └─→ For each item:
                           │       - Fetch TMDb data (rate-limited)
                           │       - Fetch OMDb data (rate-limited)
                           │       - Send WS: { "progress": 30...70 }
                           │
                           ├─→ Step 4: Compute scores (80%)
                           │   └─→ For each item:
                           │       - Calculate deletion score
                           │       - Generate rationale
                           │       - Determine recommendation
                           │   └─→ Send WS: { "progress": 80 }
                           │
                           ├─→ Step 5: Sort & filter (90%)
                           │   └─→ Sort by deletion score
                           │   └─→ Count recommendations
                           │   └─→ Send WS: { "progress": 90 }
                           │
                           └─→ Step 6: Save results & complete (100%)
                               └─→ Cache in Redis (15min TTL)
                               └─→ Send WS: {
                                   "type": "analysis_complete",
                                   "task_id": "abc123",
                                   "result": {
                                     "items_analyzed": 450,
                                     "recommended_deletions": 35,
                                     "space_recoverable_gb": 82.5
                                   }
                                 }


┌──────────────────────────────────────────┐
│  Dashboard Receives Completion Event    │
│  - Hides progress modal                 │
│  - Shows toast notification:            │
│    "✅ Analysis complete: 35 items      │
│     recommended for deletion (82.5 GB)" │
│  - Updates library tile badge           │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  User clicks "View Results"             │
└─────────────┬────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Dashboard → API                        │
│  GET /api/v4/libraries/1/items          │
│    ?sort=deletion_score&order=desc      │
│    &limit=50&offset=0                   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  API Gateway                            │
│  - Fetches from cache (if available)    │
│  - Or queries PlexIQ Core               │
│  - Returns paginated results            │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Dashboard Displays Table               │
│  - Sortable columns                     │
│  - Color-coded rows (🔴🟧🟨🟩)          │
│  - Action buttons (Delete, Keep, Info)  │
│  - Pagination controls                  │
└─────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ✅ User reviews recommendations         │
│  ⏱️ Total analysis time: 60-120 seconds  │
│  📊 Results cached for 15 minutes        │
└──────────────────────────────────────────┘
```

**Performance Breakdown:**
- Fetch items: 5-10s (450 items)
- Enrich metadata: 40-80s (rate-limited, ~1-2 req/s)
- Compute scores: 5-10s
- Total: 60-120s for 450 items with enrichment

---

## Deletion Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Safe Deletion Workflow                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  User Action     │
│  Selects items   │
│  Clicks "Delete" │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Dashboard Confirmation Dialog          │
│  "Delete 15 items? (30 GB total)"       │
│  ⚠️  This action cannot be undone       │
│  [ ] I understand (checkbox required)   │
│  [Cancel] [Delete]                      │
└─────────────┬───────────────────────────┘
              │ User confirms
              ▼
┌─────────────────────────────────────────┐
│  Dashboard → API (DRY RUN FIRST)        │
│  POST /api/v4/media/delete              │
│  Body: {                                │
│    "item_ids": ["1", "2", "3", ...],    │
│    "dry_run": true,                     │
│    "confirm": false                     │
│  }                                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  API Gateway → PlexIQ Core              │
│  - Validates item IDs                   │
│  - Checks protection rules              │
│  - Simulates deletion                   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Protection Checks                      │
│  For each item:                         │
│  ❌ Rating ≥ 8.0? → PROTECTED           │
│  ❌ Recently watched? → WARNING         │
│  ❌ File not found? → ERROR             │
│  ✅ Passes checks → OK                  │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Dry Run Response                       │
│  {                                      │
│    "dry_run": true,                     │
│    "items_to_delete": 12,               │
│    "space_to_recover_gb": 25.3,         │
│    "protected_items": [                 │
│      { "id": "5", "reason": "Rated 9.3" }│
│    ],                                   │
│    "warnings": [                        │
│      { "id": "7", "reason": "Watched 1d ago" }│
│    ]                                    │
│  }                                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Dashboard Shows Dry Run Results        │
│  ✅ 12 items can be deleted (25.3 GB)   │
│  ⚠️  3 items protected (shown in list)  │
│  ⚠️  2 warnings (shown in list)         │
│  "Proceed with deletion?"               │
│  [Cancel] [Proceed]                     │
└─────────────┬───────────────────────────┘
              │ User confirms again
              ▼
┌─────────────────────────────────────────┐
│  Dashboard → API (EXECUTE)              │
│  POST /api/v4/media/delete              │
│  Body: {                                │
│    "item_ids": ["1", "2", "3", ...],    │
│    "dry_run": false,                    │
│    "confirm": true                      │
│  }                                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  API Gateway → PlexIQ Core              │
└─────────────┬───────────────────────────┘
              │
              ├─→ Step 1: Create Backup
              │   └─→ Save metadata to JSON
              │   └─→ Generate SHA-256 checksum
              │   └─→ Save to ~/.plexiq/backups/
              │
              ├─→ Step 2: Delete Files
              │   └─→ For each item:
              │       - Delete media file from disk
              │       - Send WS: { "progress": X% }
              │
              ├─→ Step 3: Update Plex
              │   └─→ For each item:
              │       - Call plex.delete() API
              │       - Remove from Plex database
              │
              └─→ Step 4: Complete
                  └─→ Send WS: {
                      "type": "deletion_complete",
                      "items_deleted": 12,
                      "space_recovered_gb": 25.3
                    }


┌──────────────────────────────────────────┐
│  Dashboard Updates                      │
│  - Shows success toast                  │
│  - Removes items from table             │
│  - Updates library stats (-12 items)    │
│  - Updates disk space (+25.3 GB free)   │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  Notification Sent                      │
│  🔔 "Deletion complete: 12 items        │
│     removed, 25.3 GB recovered"         │
│  Channels: Desktop, Email (if enabled)  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ✅ Deletion complete                    │
│  💾 Backup saved (restorable)            │
│  📊 Library updated                      │
│  ⏱️ Total time: 5-15 seconds             │
└──────────────────────────────────────────┘
```

**Safety Features:**
1. **Dry run first** - Always simulate before execute
2. **Double confirmation** - User confirms twice
3. **Protection rules** - High-rated items never deleted
4. **Automatic backup** - Full metadata saved before deletion
5. **Real-time progress** - WebSocket updates during deletion
6. **Audit trail** - All deletions logged with timestamps

---

## Real-Time WebSocket Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                WebSocket Real-Time Communication                │
└─────────────────────────────────────────────────────────────────┘

Initial Connection
──────────────────
┌─────────────┐                          ┌──────────────┐
│  Dashboard  │                          │ API Gateway  │
└──────┬──────┘                          └──────┬───────┘
       │                                        │
       │ 1. Open WebSocket Connection          │
       │────────────────────────────────────────→
       │    ws://localhost:8000/api/v4/ws       │
       │                                        │
       │ 2. Connection Established              │
       │←────────────────────────────────────────
       │                                        │
       │ 3. Send Authentication                 │
       │────────────────────────────────────────→
       │    { "type": "auth",                   │
       │      "token": "jwt_token_here" }       │
       │                                        │
       │ 4. Auth Success                        │
       │←────────────────────────────────────────
       │    { "type": "auth_success",           │
       │      "user_id": "123" }                │


Event Flow
──────────
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Event     │         │ API Gateway  │         │  Dashboard  │
│  Trigger    │         │ (WS Server)  │         │  (WS Client)│
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │ Download Complete     │                        │
       │──────────────────────→│                        │
       │                       │                        │
       │                       │ Publish to Redis       │
       │                       │───────────────→┐       │
       │                       │                │       │
       │                       │←───────────────┘       │
       │                       │                        │
       │                       │ Broadcast to all       │
       │                       │ connected clients      │
       │                       │────────────────────────→
       │                       │   {                    │
       │                       │     "type": "episode_added",
       │                       │     "data": {...}      │
       │                       │   }                    │
       │                       │                        │
       │                       │                        │ Update UI
       │                       │                        │───────→┐
       │                       │                        │        │
       │                       │                        │←───────┘


Event Types & Handlers
───────────────────────
1. download_progress
   ├─→ Update progress bar
   ├─→ Update ETA
   └─→ Update speed

2. episode_added
   ├─→ Show toast notification
   ├─→ Add to activity feed
   ├─→ Increment library counter
   └─→ Clear download tile

3. status_update
   ├─→ Update status tile color
   ├─→ Update status tile text
   └─→ Show warning if degraded

4. analysis_complete
   ├─→ Hide progress modal
   ├─→ Show results toast
   ├─→ Update library tile badge
   └─→ Refresh item list

5. log_entry
   ├─→ Add to activity feed
   ├─→ Auto-scroll feed
   └─→ Color-code by level


Reconnection Logic
──────────────────
┌─────────────┐                          ┌──────────────┐
│  Dashboard  │                          │ API Gateway  │
└──────┬──────┘                          └──────┬───────┘
       │                                        │
       │ Connection Lost (network issue)       │
       │╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳│
       │                                        │
       │ Wait 2 seconds                         │
       │─────────→┐                             │
       │          │                             │
       │←─────────┘                             │
       │                                        │
       │ Retry Connection (Attempt 1)           │
       │────────────────────────────────────────→
       │╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳│ Failed
       │                                        │
       │ Wait 4 seconds (exponential backoff)   │
       │─────────→┐                             │
       │          │                             │
       │←─────────┘                             │
       │                                        │
       │ Retry Connection (Attempt 2)           │
       │────────────────────────────────────────→
       │                                        │
       │ Connection Established ✅              │
       │←────────────────────────────────────────
       │                                        │
       │ Re-authenticate                        │
       │────────────────────────────────────────→
       │                                        │
       │ Resume receiving events                │
       │←────────────────────────────────────────


┌──────────────────────────────────────────┐
│  ✅ WebSocket maintains real-time sync   │
│  ⏱️ Event latency: <100ms                │
│  🔄 Auto-reconnect with backoff          │
│  📊 Handles 100+ concurrent connections  │
└──────────────────────────────────────────┘
```

---

## Notification Dispatch Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Multi-Channel Notification Dispatch                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Event Trigger│
│ (Download    │
│  Complete)   │
└──────┬───────┘
       │
       ▼
┌───────────────────────────────────┐
│ NotificationDispatcher.send()     │
│ Parameters:                       │
│  - level: "success"               │
│  - title: "Download Complete"     │
│  - message: "The Mandalorian..."  │
│  - category: "sickchill"          │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ Check Configuration               │
│ Which channels are enabled?       │
└───────────────┬───────────────────┘
                │
        ┌───────┼───────┬───────┬───────┐
        │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼
    Desktop  Email  Slack  Discord Webhook
    (✅ ON) (❌ OFF) (✅ ON) (❌ OFF) (✅ ON)


Channel: Desktop Notification
──────────────────────────────
┌────────────────────────┐
│ plyer.notification()   │
│ - Title: "Download..." │
│ - Message: "The Man..."│
│ - Icon: plexiq.png     │
│ - Duration: 10s        │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│ OS Notification Center │
│ ┌────────────────────┐ │
│ │ 🔔 PlexIQ          │ │
│ │ Download Complete  │ │
│ │ The Mandalorian... │ │
│ └────────────────────┘ │
└────────────────────────┘


Channel: Slack (if enabled)
────────────────────────────
┌────────────────────────┐
│ slack_sdk.WebClient    │
│ POST to Slack API      │
│ - Channel: #plexiq     │
│ - Blocks: [...]        │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────────────┐
│ Slack Message Posted           │
│ ┌────────────────────────────┐ │
│ │ 🟩 PlexIQ                  │ │
│ │ Download Complete          │ │
│ │ Show: The Mandalorian      │ │
│ │ Episode: S04E01 - Chapter  │ │
│ │ Quality: 1080p WEB-DL      │ │
│ │ Size: 1.5 GB               │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘


Channel: Custom Webhook (if enabled)
─────────────────────────────────────
┌────────────────────────┐
│ POST to webhook URL    │
│ Body: {                │
│   "level": "success",  │
│   "title": "...",      │
│   "message": "...",    │
│   "category": "...",   │
│   "timestamp": "..."   │
│ }                      │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│ External Service       │
│ (Home Assistant,       │
│  IFTTT, Zapier, etc)   │
└────────────────────────┘


Error Handling
──────────────
┌────────────────────────┐
│ Channel Send Failed?   │
│ (e.g., SMTP error)     │
└────────────┬───────────┘
             │ YES
             ▼
┌────────────────────────┐
│ Retry Logic            │
│ - Retry 3 times        │
│ - Exponential backoff  │
│ - Log error            │
└────────────┬───────────┘
             │ Still failed
             ▼
┌────────────────────────┐
│ Mark as Failed         │
│ - Store in DB          │
│ - Show in dashboard    │
│ - Alert admin          │
└────────────────────────┘


┌──────────────────────────────────────────┐
│  ✅ Notifications sent to 3 channels     │
│  ⏱️ Dispatch time: <500ms per channel    │
│  🔄 Retry on failure (3 attempts)        │
│  📊 Delivery rate tracked                │
└──────────────────────────────────────────┘
```

---

## SickChill Backlog Search Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Manual Backlog Search Trigger                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User Action  │
│ Clicks "Run  │
│ Backlog      │
│ Search"      │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Dashboard → API                     │
│ POST /api/v4/automation/sickchill/  │
│      backlog/search                 │
│ Body: {                             │
│   "show_id": null,  // All shows    │
│   "force": true                     │
│ }                                   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ API Gateway → SickChill API         │
│ GET /api/{key}/?cmd=backlog.search  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ SickChill Starts Backlog Search     │
│ Response: {                         │
│   "result": "success",              │
│   "message": "Backlog search..."    │
│ }                                   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Dashboard Shows Toast               │
│ "🔍 Backlog search initiated"       │
│ "Monitoring progress..."            │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│ SickChill Background Processing     │
└─────────────┬───────────────────────┘
              │
              ├─→ Step 1: Build Backlog List
              │   └─→ Query all shows
              │   └─→ Identify missing episodes
              │   └─→ Total found: 50 episodes
              │
              ├─→ Step 2: Search Indexers
              │   └─→ For each missing episode:
              │       - Query torrent trackers
              │       - Query usenet indexers
              │       - Check quality preferences
              │       - Select best release
              │   └─→ Duration: 1-10 minutes
              │
              ├─→ Step 3: Queue Downloads
              │   └─→ Found releases: 15 episodes
              │   └─→ Send to download client
              │
              └─→ Step 4: Update Status
                  └─→ Backlog count: 50 → 35


Monitoring Loop (PlexIQ)
────────────────────────
┌────────────────────────────────────┐
│ API Gateway Polling (every 5s)     │
│ GET /api/{key}/?cmd=queue          │
└────────────────┬───────────────────┘
                 │
                 ├─→ Detect new downloads
                 │   └─→ Send WS event:
                 │       { "type": "download_started", ... }
                 │
                 ├─→ Track progress
                 │   └─→ Send WS event:
                 │       { "type": "download_progress", ... }
                 │
                 └─→ Detect completions
                     └─→ See "New Episode Download Flow"


┌──────────────────────────────────────────┐
│ Dashboard Real-Time Updates             │
│ - "Backlog Status" tile updates         │
│   50 → 35 missing episodes              │
│ - "Active Downloads" tile shows new     │
│   downloads with progress bars          │
│ - Activity feed entries for each        │
│   new download                          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ✅ Backlog search complete              │
│  📥 15 episodes queued for download      │
│  ⏱️ Search duration: 1-10 minutes        │
│  🔔 Notification sent on completion      │
└──────────────────────────────────────────┘
```

---

## Error Handling & Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                 Error Handling Strategies                       │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: SickChill Service Down
───────────────────────────────────
┌──────────────────────┐
│ API Gateway tries to │
│ connect to SickChill │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────┐
│ Connection Failed        │
│ ConnectionRefusedError   │
└──────────┬───────────────┘
           │
           ├─→ Retry 3 times (2s, 4s, 8s backoff)
           │   └─→ Still failed
           │
           ├─→ Mark SickChill as "offline"
           │   └─→ Update Redis cache
           │   └─→ Send WS event:
           │       { "type": "status_update",
           │         "service": "sickchill",
           │         "status": "offline" }
           │
           ├─→ Return error to dashboard
           │   └─→ API Response (503):
           │       { "error": "SickChill unavailable" }
           │
           └─→ Send notification (if critical)
               └─→ "🔴 SickChill service is down"


Dashboard Handling:
┌────────────────────────────────┐
│ SickChill Status Tile          │
│ ┌────────────────────────────┐ │
│ │ 🔴 SickChill Offline       │ │
│ │ Last seen: 2 minutes ago   │ │
│ │ [Retry Connection]         │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘


Scenario 2: Plex Server Unreachable
────────────────────────────────────
┌──────────────────────┐
│ PlexIQ Core tries to │
│ fetch library        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────┐
│ Timeout (30s)            │
│ requests.Timeout         │
└──────────┬───────────────┘
           │
           ├─→ Log error with traceback
           │
           ├─→ Return cached data (if available)
           │   └─→ Show warning: "Using cached data"
           │
           ├─→ If no cache, return error
           │   └─→ API Response (503):
           │       { "error": "Plex server timeout" }
           │
           └─→ Send WS event:
               { "type": "status_update",
                 "service": "plex",
                 "status": "unreachable" }


Dashboard Handling:
┌────────────────────────────────┐
│ Library Tile                   │
│ ┌────────────────────────────┐ │
│ │ ⚠️  Plex Server Timeout    │ │
│ │ Showing cached data        │ │
│ │ Last updated: 15 min ago   │ │
│ │ [Refresh]                  │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘


Scenario 3: WebSocket Disconnection
────────────────────────────────────
┌──────────────────────┐
│ Network interruption │
│ WebSocket drops      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────┐
│ Dashboard detects        │
│ onclose event            │
└──────────┬───────────────┘
           │
           ├─→ Show reconnecting indicator
           │   └─→ "🔄 Reconnecting..."
           │
           ├─→ Attempt reconnect (exponential backoff)
           │   └─→ Try 1: 2s
           │   └─→ Try 2: 4s
           │   └─→ Try 3: 8s
           │   └─→ Try 4: 16s
           │   └─→ Try 5: 30s (max)
           │
           ├─→ On successful reconnect
           │   └─→ Re-authenticate
           │   └─→ Fetch missed events (if possible)
           │   └─→ Show success: "✅ Reconnected"
           │
           └─→ On persistent failure (5 attempts)
               └─→ Show error banner:
                   "❌ Connection lost. Please refresh."


Dashboard UI:
┌────────────────────────────────┐
│ Top Banner (when disconnected) │
│ ┌────────────────────────────┐ │
│ │ ⚠️  Real-time updates      │ │
│ │    paused (reconnecting...) │ │
│ │ [Dismiss] [Refresh Page]   │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘


Scenario 4: Analysis Task Failure
──────────────────────────────────
┌──────────────────────┐
│ Analysis task runs   │
│ Exception raised     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────┐
│ Task failure detected    │
│ (e.g., API rate limit)   │
└──────────┬───────────────┘
           │
           ├─→ Log full traceback
           │   └─→ Store in error tracking (Sentry)
           │
           ├─→ Update task status
           │   └─→ status: "failed"
           │   └─→ error: "Rate limit exceeded"
           │
           ├─→ Send WS event
           │   └─→ { "type": "task_failed",
           │         "task_id": "...",
           │         "error": "..." }
           │
           └─→ Return partial results (if any)
               └─→ "Analyzed 200/450 items before error"


Dashboard Handling:
┌────────────────────────────────┐
│ Toast Notification             │
│ ┌────────────────────────────┐ │
│ │ ❌ Analysis Failed         │ │
│ │ Rate limit exceeded.       │ │
│ │ Partial results available. │ │
│ │ [View Details] [Retry]     │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘


┌──────────────────────────────────────────┐
│  ✅ Graceful error handling              │
│  🔄 Auto-retry with backoff              │
│  📊 Error tracking & logging             │
│  🔔 User-friendly error messages         │
│  💾 Fallback to cached data              │
└──────────────────────────────────────────┘
```

---

## Summary

These workflows demonstrate:

1. **System Reliability** - Graceful error handling and recovery
2. **Real-Time Communication** - WebSocket events for instant updates
3. **Safety-First Design** - Dry-run confirmations and backups
4. **User Experience** - Clear progress indicators and notifications
5. **Modular Architecture** - Independent components communicating via APIs

**Next Steps:**
- Implement these workflows in v4.0 Alpha
- Test each scenario thoroughly
- Monitor performance metrics
- Iterate based on user feedback

---

**Document End**
