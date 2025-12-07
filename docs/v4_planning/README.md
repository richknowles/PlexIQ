# PlexIQ v4.x "Einstein Edition" - Planning Documentation

**Version:** 1.0
**Status:** Planning Phase
**Last Updated:** 2025-12-07

---

## 📋 Table of Contents

This directory contains comprehensive planning documentation for **PlexIQ v4.x "Einstein Edition"** - the next major evolution of PlexIQ into a modular media management platform with integrated automation and an executive-level dashboard.

### Planning Documents

1. **[Architecture Overview](./01_ARCHITECTURE_OVERVIEW.md)**
   - System architecture and modular design
   - Core components (PlexIQ Core, SickChill, Dashboard, API Gateway)
   - Data flow and integration patterns
   - Technology stack and deployment architecture
   - Migration path from v3.1 to v4.0

2. **[API Specifications](./02_API_SPECIFICATIONS.md)**
   - Complete REST API reference
   - WebSocket API for real-time updates
   - Authentication and authorization
   - SickChill integration endpoints
   - Error handling and rate limiting
   - Pagination and filtering

3. **[Dashboard Design](./03_DASHBOARD_DESIGN.md)**
   - "Mini Skirt UI" design philosophy
   - Color-coded status tile system (🟩🟨🟧🔴)
   - Interactive elements and hover effects
   - Page layouts and wireframes
   - Component specifications
   - Responsive design and accessibility

4. **[Integration Map](./04_INTEGRATION_MAP.md)**
   - Communication patterns between all modules
   - API Gateway ↔ PlexIQ Core integration
   - API Gateway ↔ SickChill integration
   - WebSocket event streaming
   - Notification layer (multi-channel)
   - Data flow scenarios with timing

5. **[Release Roadmap](./05_RELEASE_ROADMAP.md)**
   - 4-phase development plan (Alpha → Beta → RC → Production)
   - Detailed task breakdown per phase
   - Timeline estimates (10-15 weeks total)
   - Risk management and mitigation strategies
   - Success metrics and KPIs
   - Post-v4.3 future roadmap

6. **[Development Setup Guide](./06_DEVELOPMENT_SETUP.md)**
   - Prerequisites and required software
   - Project structure (v4.x)
   - Initial setup steps
   - Running the development environment
   - Development workflow examples
   - Testing and debugging
   - Common issues and solutions

---

## 🎯 Quick Start

### For Executives / Decision Makers
1. **Read:** [Architecture Overview](./01_ARCHITECTURE_OVERVIEW.md) - Executive summary and system design
2. **Review:** [Dashboard Design](./03_DASHBOARD_DESIGN.md) - Visual mockups and UI/UX specifications
3. **Approve:** [Release Roadmap](./05_RELEASE_ROADMAP.md) - Timeline and milestones

### For Developers
1. **Start:** [Development Setup Guide](./06_DEVELOPMENT_SETUP.md) - Get environment running
2. **Reference:** [API Specifications](./02_API_SPECIFICATIONS.md) - Build API endpoints
3. **Understand:** [Integration Map](./04_INTEGRATION_MAP.md) - Learn how modules communicate

### For Product Managers
1. **Review:** [Release Roadmap](./05_RELEASE_ROADMAP.md) - Sprint planning and deliverables
2. **Track:** Use roadmap task lists for progress monitoring
3. **Plan:** Feature prioritization based on Alpha/Beta/RC phases

---

## 🔑 Key Concepts

### The Vision
**"Keep the backend engine fully functional while providing a modern, interactive, ProxMenux-style dashboard for executives."**

PlexIQ v4.x transforms the existing media management tool into a comprehensive automation platform by:
- Integrating **SickChill** for automated TV show downloads
- Building an **executive-level dashboard** with real-time updates
- Maintaining **modular architecture** with independent deployability
- Adding **multi-channel notifications** for critical events

### Core Principles

1. **Modular Design** - Each component (PlexIQ Core, SickChill, Dashboard, API Gateway) is independently deployable and scalable
2. **API-First** - All communication via REST APIs or WebSockets, no direct database access
3. **Safety-First** - Preserving PlexIQ v3.1's safety philosophy (dry-run defaults, confirmations, backups)
4. **Real-Time** - WebSocket-powered live updates for downloads, scans, and events
5. **Executive UX** - Clean, color-coded, one-click operations with visual feedback

### Status Tile Color System

- 🟩 **Green** - Good, healthy, no action needed
- 🟨 **Yellow** - Caution, monitor, optional action
- 🟧 **Orange** - Attention needed, recommended action
- 🔴 **Red** - Critical, immediate action required

---

## 📊 Architecture Summary

```
┌──────────────────────────────────────────────────┐
│         PlexIQ v4.x "Einstein Edition"           │
│           Executive Dashboard (React)            │
└────────────────┬─────────────────────────────────┘
                 │ HTTP REST + WebSocket
                 ▼
┌──────────────────────────────────────────────────┐
│           API Gateway (FastAPI)                  │
│  Authentication • Routing • WebSocket Server     │
└────────┬────────────────────────────┬────────────┘
         │                            │
         ▼                            ▼
┌─────────────────────┐    ┌──────────────────────┐
│  PlexIQ Core (v3.1) │    │  SickChill Container │
│  Media Management   │    │  TV Automation       │
└─────────┬───────────┘    └───────────┬──────────┘
          │                            │
          ▼                            ▼
┌─────────────────────┐    ┌──────────────────────┐
│  Plex Media Server  │    │  Download Clients    │
└─────────────────────┘    └──────────────────────┘
```

---

## 🗓️ Development Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **v4.0 Alpha** | 4-6 weeks | API Gateway, Basic Dashboard, SickChill Integration |
| **v4.1 Beta** | 3-4 weeks | WebSocket Real-Time, Notifications, Live Updates |
| **v4.2 RC** | 2-3 weeks | UI Polish, Performance Optimization, Accessibility |
| **v4.3 Production** | 1-2 weeks | Documentation, Deployment, Release |
| **Total** | **10-15 weeks** | Full Einstein Edition Release |

---

## 🛠️ Technology Stack

### Backend
- **API Gateway:** FastAPI (Python)
- **PlexIQ Core:** Existing v3.1 codebase (Python)
- **SickChill:** Docker container (isolated)
- **Database:** SQLite or PostgreSQL (optional)
- **Cache:** Redis (WebSocket pub/sub + API caching)
- **Task Queue:** Celery or asyncio

### Frontend
- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand or React Context
- **Build Tool:** Vite
- **Real-Time:** Socket.IO client or native WebSocket

### Infrastructure
- **Reverse Proxy:** Nginx or Traefik
- **Containers:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (recommended)
- **Monitoring:** Prometheus + Grafana (optional)

---

## 📈 Success Metrics (v4.3 Target)

### Technical
- ✅ API response time: <200ms (p95)
- ✅ WebSocket latency: <100ms
- ✅ Dashboard load time: <2s
- ✅ Uptime: 99.5%+

### User Experience
- ✅ One-click operations: <3 clicks to any action
- ✅ Real-time updates: <1s latency
- ✅ Mobile-responsive: Full functionality on all devices
- ✅ WCAG 2.1 AA compliant

### Automation
- ✅ 80%+ episodes auto-downloaded
- ✅ 90%+ deletion recommendations accurate
- ✅ 100% notification delivery rate

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- Redis
- Plex Media Server (with API token)

### Quick Setup
```bash
# 1. Clone repository
git clone https://github.com/richknowles/PlexIQ.git
cd PlexIQ

# 2. Create development branch
git checkout -b develop-v4.0

# 3. Set up Python environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-v4.txt

# 4. Set up Dashboard
cd dashboard
npm install

# 5. Start SickChill + Redis
cd ../docker/sickchill
docker-compose up -d

# 6. Configure environment
cp .env.example .env
# Edit .env with your settings

# 7. Run development servers
# Terminal 1: API Gateway
cd api_gateway
uvicorn main:app --reload

# Terminal 2: Dashboard
cd dashboard
npm run dev
```

**Access:**
- Dashboard: `http://localhost:5173`
- API Docs: `http://localhost:8000/docs`
- SickChill: `http://localhost:8081`

---

## 📚 Additional Resources

### External Documentation
- **FastAPI:** https://fastapi.tiangolo.com/
- **React:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **SickChill API:** https://github.com/SickChill/SickChill/wiki/SickChill-API-Commands
- **PlexAPI:** https://python-plexapi.readthedocs.io/

### PlexIQ Resources
- **v3.1 README:** [../README.md](../../README.md)
- **v3.1 Usage Guide:** [../USAGE_GUIDE.md](../USAGE_GUIDE.md)
- **Changelog:** [../../CHANGELOG.md](../../CHANGELOG.md)

---

## 🤝 Contributing

When contributing to PlexIQ v4.x development:

1. **Follow the roadmap** - Use task lists in `05_RELEASE_ROADMAP.md`
2. **Maintain modularity** - Keep components independent
3. **Write tests** - 80%+ coverage target
4. **Document code** - Docstrings for all public functions
5. **Use conventional commits** - `feat:`, `fix:`, `docs:`, etc.
6. **Submit PRs** - Target `develop-v4.0` branch

---

## ⚠️ Important Constraints

### DO NOT Modify SickChill Backend
- ✋ **Never** modify SickChill source code
- ✅ **Only** communicate via SickChill API
- ✅ Treat SickChill as isolated black-box service

### Maintain v3.1 Compatibility
- ✅ Existing CLI commands must continue working
- ✅ v3.1 safety features preserved (dry-run, backups, confirmations)
- ✅ Migration path from v3.1 to v4.x provided

### Modular Independence
- ✅ Each module deployable independently
- ✅ No direct database access between modules
- ✅ API-first communication only

---

## 📞 Support & Feedback

- **GitHub Issues:** [PlexIQ Issues](https://github.com/richknowles/PlexIQ/issues)
- **Discussions:** [PlexIQ Discussions](https://github.com/richknowles/PlexIQ/discussions)
- **Documentation:** This directory (`docs/v4_planning/`)

---

## 📜 Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-07 | Initial v4.x planning documentation |

---

## 📄 License

PlexIQ v4.x maintains the same MIT License as v3.1. See [LICENSE](../../LICENSE) for details.

---

**Ready to build PlexIQ v4.x "Einstein Edition"?**

👉 **Start here:** [Development Setup Guide](./06_DEVELOPMENT_SETUP.md)

---

**Document End**
