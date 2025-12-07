# PlexIQ v4.x "Einstein Edition" - Architecture Overview

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Status:** Planning Phase

---

## Executive Summary

PlexIQ v4.x "Einstein Edition" represents a major architectural evolution, transforming PlexIQ from a media management tool into a **modular automation platform** with integrated SickChill capabilities and an executive-level "mini skirt" dashboard.

### Core Vision

**"Keep the backend engine fully functional while providing a modern, interactive, ProxMenux-style dashboard for executives."**

---

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     PlexIQ v4.x "Einstein Edition"                       │
│                         Executive Dashboard Layer                         │
└──────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ REST API / WebSocket
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        PlexIQ Core Orchestration                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ PlexIQ Core     │  │ API Gateway     │  │ Event Bus       │         │
│  │ Engine (v3.x)   │  │ & Router        │  │ & Webhooks      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘
                                    ▲
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
         ┌─────────────────┐ ┌──────────────┐ ┌────────────────┐
         │  SickChill      │ │ Plex Server  │ │ Notification   │
         │  Container      │ │ API          │ │ Services       │
         │  (Isolated)     │ │              │ │ (Multi-channel)│
         └─────────────────┘ └──────────────┘ └────────────────┘
```

---

## Core Components

### 1. PlexIQ Core Engine (Existing v3.1 Foundation)

**Purpose:** Media management, analysis, and deletion orchestration
**Status:** Fully functional, requires API exposure for v4.x

**Responsibilities:**
- Media metadata collection & enrichment
- Intelligent scoring & analysis engine
- Safe deletion workflows with dry-run
- Backup & audit trail management
- Configuration & logging

**v4.x Enhancements:**
- Expose REST API endpoints
- Add WebSocket support for real-time updates
- Modularize for microservice architecture
- Plugin system for extensibility

---

### 2. SickChill Automation Engine (New Integration)

**Purpose:** Automated TV show grabbing, renaming, backlog management
**Deployment:** Docker/container isolation
**Communication:** API-based (SickChill REST API)

**Responsibilities:**
- Automated episode downloads
- Quality upgrades & backlog management
- Renaming & organization
- Post-processing hooks
- Release group preferences

**Integration Points:**
- PlexIQ monitors SickChill status via API
- SickChill triggers PlexIQ scans on new downloads
- Shared notification layer for alerts
- Unified logging & monitoring

**Critical Constraint:**
✋ **DO NOT modify SickChill backend**
✅ **Treat as isolated service with API communication only**

---

### 3. Executive Dashboard ("Mini Skirt UI")

**Purpose:** Modern, interactive, real-time monitoring & control
**Style:** ProxMenux-inspired, tile-based, color-coded
**Technology:** Web-based (React/Vue + WebSocket)

**UI/UX Principles:**
- **Interactive tiles** with hover effects & quick actions
- **Color-coded status indicators** (🟩🟨🟧🔴)
- **Real-time log streaming** via WebSocket
- **One-click operations** (scan, cleanup, backlog trigger)
- **Expandable details** (click to drill down)
- **Pinned favorites** for quick access

**Dashboard Sections:**
1. **Status Overview** - System health, services, stats
2. **Media Libraries** - Plex libraries with quick actions
3. **Automation Hub** - SickChill shows, downloads, backlog
4. **Activity Feed** - Real-time logs & events
5. **Quick Actions** - One-click operations
6. **Notifications** - Alerts & warnings

---

### 4. API Gateway & Orchestration Layer (New)

**Purpose:** Central communication hub between all modules
**Technology:** FastAPI or Flask + WebSocket

**Responsibilities:**
- Route requests to PlexIQ Core or SickChill
- Aggregate data from multiple sources
- Real-time event streaming to dashboard
- Authentication & authorization
- Rate limiting & caching

**API Endpoints (Planned):**

```
/api/v4/
├── /status                    # System health
├── /libraries                 # Plex libraries
├── /media                     # Media items & metadata
├── /analysis                  # Scoring & recommendations
├── /automation
│   ├── /sickchill/status      # SickChill health
│   ├── /sickchill/shows       # Show list
│   ├── /sickchill/backlog     # Backlog status
│   └── /sickchill/downloads   # Active downloads
├── /actions
│   ├── /scan                  # Trigger library scan
│   ├── /analyze               # Run analysis
│   ├── /delete                # Execute deletion
│   └── /backlog/trigger       # Force backlog search
└── /notifications             # Notification history
```

---

### 5. Notification Layer (Enhanced)

**Purpose:** Multi-channel alerting for critical events
**Channels:** Desktop, Email, Slack, Discord, Webhooks

**Alert Types:**
- 🔴 Critical: Service failures, errors
- 🟧 Attention: Backlog stalled, low disk space
- 🟨 Caution: Quality upgrades available
- 🟩 Success: Downloads completed, scans finished

**Configuration:**
- Per-channel enable/disable
- Priority filtering (only critical alerts)
- Quiet hours (scheduled silence)
- Custom webhooks for integration

---

## Data Flow Architecture

### Scenario 1: New Episode Download

```
1. SickChill detects new episode release
2. SickChill downloads & processes episode
3. SickChill calls webhook → PlexIQ Event Bus
4. PlexIQ triggers Plex library scan
5. PlexIQ collects metadata for new episode
6. PlexIQ pushes update to Dashboard (WebSocket)
7. Dashboard shows notification 🟩 "New episode added"
8. Notification layer sends alert (if configured)
```

### Scenario 2: Manual Library Cleanup

```
1. User clicks "Analyze Library" on Dashboard
2. Dashboard → API Gateway → PlexIQ Core
3. PlexIQ runs analysis with scoring
4. Real-time progress streamed to Dashboard
5. Results displayed with recommendations
6. User reviews, clicks "Delete" (with confirmation)
7. PlexIQ executes deletion (with backup)
8. Dashboard updates, notification sent
```

### Scenario 3: Backlog Management

```
1. Dashboard shows "Backlog Status" tile (🟨 50 missing episodes)
2. User clicks "Trigger Backlog Search"
3. Dashboard → API Gateway → SickChill API
4. SickChill initiates backlog search
5. Progress updates streamed to Dashboard
6. Downloads start, PlexIQ monitors via API polling
7. On completion, PlexIQ scans library
8. Dashboard updates counts, notification sent
```

---

## Modular Design Principles

### 1. Independent Deployability
Each module can be deployed, scaled, or updated independently:
- **PlexIQ Core:** Python service, CLI, or microservice
- **SickChill:** Docker container with network isolation
- **Dashboard:** Static web app (CDN-ready)
- **API Gateway:** Scalable API layer (horizontal scaling)

### 2. API-First Communication
All inter-module communication via REST APIs or WebSockets:
- No direct database access between modules
- Versioned APIs (`/api/v4/`, `/api/v5/`)
- Backward compatibility guarantees

### 3. Plugin-Ready Architecture
Future extensibility via plugin system:
- Custom analyzers (e.g., duplicate detection)
- Additional automation engines (Radarr, Lidarr)
- Custom notification channels
- External metadata sources

### 4. Failure Isolation
Module failures don't cascade:
- SickChill down → Dashboard shows status, PlexIQ continues
- PlexIQ analysis error → Dashboard displays error, SickChill unaffected
- Dashboard offline → API & automation continue working

---

## Security & Authentication

### API Security
- **Token-based authentication** (JWT or API keys)
- **HTTPS required** for external access
- **CORS configuration** for dashboard
- **Rate limiting** per client

### Container Isolation
- SickChill runs in isolated Docker network
- PlexIQ API exposes only necessary endpoints
- Dashboard served via reverse proxy (Nginx/Traefik)

### Secrets Management
- Environment variables for sensitive data
- No hardcoded credentials
- Encrypted configuration files
- Vault integration (optional)

---

## Scalability Considerations

### Horizontal Scaling
- **API Gateway:** Load-balanced across multiple instances
- **Dashboard:** Static files on CDN
- **SickChill:** Multiple instances for different shows (advanced)

### Performance Optimization
- **Caching:** Redis for API responses
- **Database:** Optional PostgreSQL for metadata (vs. JSON files)
- **WebSocket:** Dedicated server for real-time updates
- **CDN:** Dashboard assets on edge locations

---

## Deployment Architecture

### Development Environment
```
PlexIQ Core (local)
├── API Gateway (localhost:8000)
├── Dashboard (localhost:3000, dev server)
└── SickChill (Docker, localhost:8081)
```

### Production Environment
```
[Reverse Proxy - Nginx]
    │
    ├─→ /dashboard → Static Web App (CDN)
    ├─→ /api       → API Gateway (load-balanced)
    ├─→ /ws        → WebSocket Server
    │
    └─→ Backend Services
         ├── PlexIQ Core (systemd service or Docker)
         └── SickChill (Docker container)
```

---

## Technology Stack

### PlexIQ Core (Python)
- **Framework:** FastAPI (API layer)
- **Existing:** PlexAPI, Rich, Click, PyQt6
- **New:** WebSocket support, async operations

### Dashboard (Web)
- **Framework:** React + TypeScript (or Vue 3)
- **UI Library:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand or Pinia
- **Real-time:** Socket.IO client or native WebSocket

### API Gateway (Python)
- **Framework:** FastAPI
- **WebSocket:** FastAPI WebSocket + Redis (pub/sub)
- **Auth:** JWT tokens (PyJWT)
- **Caching:** Redis

### SickChill (Docker)
- **Image:** Official SickChill image
- **Storage:** Persistent volumes for config & downloads
- **Network:** Bridge network with PlexIQ

### Infrastructure
- **Database (Optional):** PostgreSQL or SQLite
- **Cache:** Redis
- **Reverse Proxy:** Nginx or Traefik
- **Monitoring:** Prometheus + Grafana (optional)

---

## Migration Path from v3.1 to v4.0

### Phase 1: Foundation (v4.0 Alpha)
1. Extract PlexIQ Core into API-ready service
2. Create basic API Gateway with core endpoints
3. Deploy SickChill container with basic integration
4. Build minimal dashboard with status tiles

### Phase 2: Integration (v4.1 Beta)
1. Real-time log streaming via WebSocket
2. Full SickChill API integration (shows, backlog, downloads)
3. Notification layer implementation
4. Enhanced dashboard with interactive elements

### Phase 3: Polish (v4.2 RC)
1. Hover effects, animations, UI polish
2. Plugin system foundation
3. Performance optimization
4. Stress testing & bug fixes

### Phase 4: Production (v4.3)
1. Executive-level dashboard finalization
2. Documentation & deployment guides
3. Security audit
4. Production rollout

---

## Success Metrics

### Technical Metrics
- **API Response Time:** <200ms (p95)
- **WebSocket Latency:** <100ms
- **Dashboard Load Time:** <2s (initial)
- **Uptime:** 99.5%+

### User Experience Metrics
- **One-click operations:** <3 clicks to any action
- **Real-time updates:** <1s latency for events
- **Mobile-responsive:** Full functionality on tablets/phones
- **Accessibility:** WCAG 2.1 AA compliance

### Business Metrics
- **Automation rate:** 80%+ of episodes auto-downloaded
- **Space optimization:** Efficient deletion recommendations
- **User satisfaction:** Executive-level "mini skirt UI" approval

---

## Next Steps

1. **Review & approve** this architecture document
2. **Create detailed API specifications** (see `02_API_SPECIFICATIONS.md`)
3. **Design dashboard wireframes** (see `03_DASHBOARD_DESIGN.md`)
4. **Map integration points** (see `04_INTEGRATION_MAP.md`)
5. **Build development roadmap** (see `05_ROADMAP.md`)

---

**Document End**
