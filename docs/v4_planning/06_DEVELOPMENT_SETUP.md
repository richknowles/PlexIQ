# PlexIQ v4.x Development Setup Guide

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Target:** Developers starting v4.0 Alpha development

---

## Prerequisites

### Required Software

1. **Python 3.10+**
   ```bash
   python --version  # Should be 3.10 or higher
   ```

2. **Node.js 18+ & npm**
   ```bash
   node --version  # Should be 18 or higher
   npm --version
   ```

3. **Docker & Docker Compose**
   ```bash
   docker --version
   docker-compose --version
   ```

4. **Git**
   ```bash
   git --version
   ```

5. **Redis** (for caching & WebSocket pub/sub)
   ```bash
   # Via Docker
   docker run -d -p 6379:6379 redis:7-alpine

   # Or install locally
   # macOS: brew install redis
   # Ubuntu: sudo apt install redis-server
   ```

### Recommended Tools

- **VS Code** with extensions:
  - Python
  - Pylance
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
- **Postman** or **Insomnia** for API testing
- **Redis Insight** for Redis debugging

---

## Project Structure (v4.x)

```
PlexIQ/
├── plexiq/                     # PlexIQ Core (existing v3.1)
│   ├── api/                    # NEW: API interface layer
│   │   ├── __init__.py
│   │   ├── core_interface.py  # Core functions for API Gateway
│   │   └── tasks.py           # Async task management
│   ├── integrations/           # NEW: External service integrations
│   │   ├── __init__.py
│   │   ├── sickchill_client.py
│   │   └── plex_wrapper.py
│   ├── notifications/          # NEW: Notification dispatcher
│   │   ├── __init__.py
│   │   ├── dispatcher.py
│   │   └── channels/
│   │       ├── desktop.py
│   │       ├── email.py
│   │       ├── slack.py
│   │       └── discord.py
│   └── ... (existing modules)
├── api_gateway/                # NEW: FastAPI API Gateway
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # API configuration
│   ├── auth.py                 # JWT authentication
│   ├── middleware.py           # CORS, rate limiting, etc.
│   ├── routers/                # API route handlers
│   │   ├── __init__.py
│   │   ├── status.py
│   │   ├── libraries.py
│   │   ├── media.py
│   │   ├── analysis.py
│   │   ├── automation.py
│   │   ├── notifications.py
│   │   └── webhooks.py
│   ├── websocket.py            # WebSocket handler
│   ├── dependencies.py         # FastAPI dependencies
│   └── schemas.py              # Pydantic models
├── dashboard/                  # NEW: React Dashboard
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── StatusTile.tsx
│   │   │   ├── LibraryCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── ...
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LibraryBrowser.tsx
│   │   │   ├── SickChillHub.tsx
│   │   │   └── Settings.tsx
│   │   ├── services/           # API & WebSocket services
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── hooks/              # React hooks
│   │   ├── types/              # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker/                     # Docker configurations
│   ├── sickchill/
│   │   └── docker-compose.yml
│   └── production/
│       └── docker-compose.yml
├── docs/                       # Documentation
│   ├── v4_planning/            # Planning documents (this folder)
│   └── ...
├── tests/                      # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── requirements.txt            # Python dependencies (v3.1)
├── requirements-v4.txt         # NEW: v4 additional dependencies
├── .env.example                # Environment variables template
└── README.md
```

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/richknowles/PlexIQ.git
cd PlexIQ
```

### 2. Create v4 Development Branch

```bash
git checkout -b develop-v4.0
```

### 3. Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install existing dependencies (v3.1)
pip install -r requirements.txt

# Install v4 additional dependencies
pip install -r requirements-v4.txt
```

**Create `requirements-v4.txt`:**
```txt
# API Gateway
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6

# WebSocket & Real-time
websockets>=12.0
redis>=5.0.1

# Task Queue (choose one)
celery>=5.3.4  # Option A: Celery
# asyncio (built-in)  # Option B: asyncio

# Notifications
plyer>=2.1.0  # Desktop notifications
slack-sdk>=3.26.2
discord-webhook>=1.3.1

# Additional
aiohttp>=3.9.1  # Async HTTP client
pydantic>=2.5.3  # Data validation
```

### 4. Set Up Node.js Environment

```bash
# Create dashboard directory
mkdir dashboard
cd dashboard

# Initialize React + TypeScript project with Vite
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional packages
npm install axios socket.io-client
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react  # Icons
npm install recharts  # Charts (optional)

# Initialize Tailwind CSS
npx tailwindcss init -p
```

**Configure Tailwind (`tailwind.config.js`):**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'plexiq-mustard': '#F4A940',
      },
    },
  },
  plugins: [],
}
```

**Add Tailwind to `src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. Set Up Docker for SickChill

```bash
# Create docker directory
mkdir -p docker/sickchill
cd docker/sickchill
```

**Create `docker-compose.yml`:**
```yaml
version: "3.8"

services:
  sickchill:
    image: lscr.io/linuxserver/sickchill:latest
    container_name: sickchill
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    volumes:
      - ./config:/config
      - /path/to/tv:/tv  # Update with actual path
      - /path/to/downloads:/downloads  # Update with actual path
    ports:
      - "8081:8081"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: plexiq-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
```

**Start SickChill:**
```bash
docker-compose up -d
```

**Access SickChill:**
- Open browser: `http://localhost:8081`
- Complete initial setup wizard
- Configure indexers (torrent/usenet providers)
- Add a test show
- Get API key: Settings → General → API Key

### 6. Configure Environment Variables

**Create `.env` file in project root:**
```bash
cp .env.example .env
nano .env
```

**Add v4 configuration to `.env`:**
```bash
# Existing v3.1 config
PLEX_URL=http://localhost:32400
PLEX_TOKEN=your_plex_token_here
TMDB_API_KEY=your_tmdb_key
OMDB_API_KEY=your_omdb_key

# v4 API Gateway
API_HOST=0.0.0.0
API_PORT=8000
API_SECRET_KEY=generate_random_secret_key_here  # Use: openssl rand -hex 32
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=1

# SickChill Integration
SICKCHILL_URL=http://localhost:8081
SICKCHILL_API_KEY=your_sickchill_api_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Notifications
NOTIFICATION_DESKTOP_ENABLED=true
NOTIFICATION_EMAIL_ENABLED=false
NOTIFICATION_SLACK_ENABLED=false
NOTIFICATION_DISCORD_ENABLED=false

# Email (if enabled)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=plexiq@localhost

# Slack (if enabled)
SLACK_TOKEN=xoxb-your-slack-token
SLACK_CHANNEL=#plexiq

# Discord (if enabled)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# CORS (for dashboard)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Running the Development Environment

### Terminal 1: API Gateway

```bash
# From project root
cd api_gateway

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test API:**
```bash
curl http://localhost:8000/api/v4/status
```

### Terminal 2: Dashboard

```bash
# From project root
cd dashboard

# Run dev server
npm run dev
```

**Expected output:**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Access dashboard:** `http://localhost:5173`

### Terminal 3: Docker Services (SickChill + Redis)

```bash
cd docker/sickchill
docker-compose up
```

Or run in background:
```bash
docker-compose up -d
docker-compose logs -f  # View logs
```

---

## Development Workflow

### 1. Create API Endpoint (Example: `/status`)

**File: `api_gateway/routers/status.py`**
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/api/v4", tags=["status"])

class SystemStatus(BaseModel):
    status: str
    version: str
    uptime_seconds: int

@router.get("/status", response_model=SystemStatus)
async def get_system_status():
    """Get system health status."""
    return SystemStatus(
        status="healthy",
        version="4.0.0-alpha",
        uptime_seconds=3600
    )
```

**File: `api_gateway/main.py`**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import status

app = FastAPI(title="PlexIQ API", version="4.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(status.router)

@app.get("/")
async def root():
    return {"message": "PlexIQ API v4.0"}
```

**Test:**
```bash
curl http://localhost:8000/api/v4/status
```

### 2. Create Dashboard Component (Example: StatusTile)

**File: `dashboard/src/components/StatusTile.tsx`**
```tsx
import { ReactNode } from 'react';

interface StatusTileProps {
  title: string;
  status: 'healthy' | 'warning' | 'error';
  icon: ReactNode;
  details?: string;
}

export function StatusTile({ title, status, icon, details }: StatusTileProps) {
  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 hover:transform hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="mt-2 text-2xl">{icon}</div>
      {details && <p className="mt-2 text-slate-400 text-sm">{details}</p>}
    </div>
  );
}
```

**Use in page:**
```tsx
import { StatusTile } from '../components/StatusTile';

export function Dashboard() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatusTile
        title="System Health"
        status="healthy"
        icon="🟩"
        details="All services running"
      />
    </div>
  );
}
```

### 3. Connect Dashboard to API

**File: `dashboard/src/services/api.ts`**
```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v4';

export interface SystemStatus {
  status: string;
  version: string;
  uptime_seconds: number;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const response = await axios.get<SystemStatus>(`${API_BASE_URL}/status`);
  return response.data;
}
```

**Use in component:**
```tsx
import { useEffect, useState } from 'react';
import { getSystemStatus, SystemStatus } from '../services/api';

export function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    getSystemStatus().then(setStatus);
  }, []);

  return (
    <div>
      {status && <p>System: {status.status}</p>}
    </div>
  );
}
```

---

## Testing

### Unit Tests (Python)

```bash
# Install pytest
pip install pytest pytest-asyncio pytest-cov

# Run tests
pytest tests/unit/

# With coverage
pytest --cov=api_gateway tests/
```

**Example test:**
```python
# tests/unit/test_status.py
import pytest
from fastapi.testclient import TestClient
from api_gateway.main import app

client = TestClient(app)

def test_get_status():
    response = client.get("/api/v4/status")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### Integration Tests (Dashboard)

```bash
cd dashboard

# Install testing libraries
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

### E2E Tests (Cypress/Playwright)

```bash
cd dashboard

# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test
```

---

## Code Quality Tools

### Python Linting & Formatting

```bash
# Install tools
pip install ruff black mypy

# Run linter
ruff check .

# Auto-fix
ruff check --fix .

# Format code
black .

# Type checking
mypy api_gateway/
```

### TypeScript Linting & Formatting

```bash
cd dashboard

# Install ESLint & Prettier
npm install -D eslint prettier eslint-config-prettier

# Lint
npm run lint

# Format
npx prettier --write src/
```

### Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix]
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
EOF

# Install hooks
pre-commit install
```

---

## Debugging

### API Debugging (VS Code)

**`.vscode/launch.json`:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "api_gateway.main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
      ],
      "jinja": true,
      "justMyCode": false
    }
  ]
}
```

### Dashboard Debugging (VS Code)

**Install Chrome Debugger for VS Code**

**`.vscode/launch.json`:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/dashboard"
    }
  ]
}
```

---

## Common Issues & Solutions

### Issue 1: CORS Errors

**Symptom:** Dashboard can't fetch API
**Solution:** Add dashboard URL to CORS origins in `api_gateway/main.py`

### Issue 2: Redis Connection Failed

**Symptom:** `ConnectionRefusedError: [Errno 61] Connection refused`
**Solution:** Ensure Redis is running: `docker-compose up redis`

### Issue 3: SickChill API Not Responding

**Symptom:** API returns 500 when accessing SickChill endpoints
**Solution:**
- Check SickChill is running: `docker-compose ps`
- Verify API key in `.env`
- Test manually: `curl http://localhost:8081/api/{key}/?cmd=sb`

### Issue 4: WebSocket Connection Drops

**Symptom:** Dashboard loses real-time updates
**Solution:** Check browser console for errors, verify WebSocket endpoint, check Redis pub/sub

---

## Next Steps

1. **Start with API Gateway foundation** (Week 1)
2. **Build basic dashboard** (Week 2)
3. **Integrate SickChill** (Week 3)
4. **Add WebSocket for real-time** (Week 4-5)
5. **Polish UI/UX** (Week 6+)

**Refer to:** `05_RELEASE_ROADMAP.md` for detailed task breakdown

---

## Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **shadcn/ui:** https://ui.shadcn.com/
- **SickChill API:** https://github.com/SickChill/SickChill/wiki/SickChill-API-Commands
- **PlexAPI Docs:** https://python-plexapi.readthedocs.io/

---

**Document End**
