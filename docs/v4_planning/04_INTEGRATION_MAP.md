# PlexIQ v4.x Integration Map

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Focus:** API Communication & Data Flow

---

## Integration Architecture

```
┌──────────────────┐
│   Dashboard      │  React App (Browser)
│   (Frontend)     │  Port: 3000
└────────┬─────────┘
         │ HTTP/WebSocket
         ▼
┌──────────────────┐
│   API Gateway    │  FastAPI Service
│   (Orchestrator) │  Port: 8000
└────────┬─────────┘
         │
    ┌────┴──────────────────────┐
    │                            │
    ▼                            ▼
┌──────────────────┐    ┌──────────────────┐
│  PlexIQ Core     │    │   SickChill      │
│  (Engine)        │    │   (Container)    │
│  Port: Internal  │    │   Port: 8081     │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│   Plex Server    │    │   Download       │
│   Port: 32400    │    │   Clients        │
└──────────────────┘    └──────────────────┘
```

---

## Communication Patterns

### 1. Dashboard ↔ API Gateway

**Protocol:** HTTP REST + WebSocket
**Authentication:** JWT Bearer Token
**Base URL:** `http://localhost:8000/api/v4`

#### REST Endpoints Used
- `GET /status` - System health check (polling every 30s)
- `GET /libraries` - Fetch library list (on dashboard load)
- `GET /libraries/{id}/items` - Fetch media items (paginated)
- `POST /libraries/{id}/analyze` - Trigger analysis
- `POST /media/delete` - Execute deletion
- `GET /automation/sickchill/status` - SickChill health
- `GET /automation/sickchill/shows` - Show list
- `GET /automation/sickchill/downloads` - Active downloads
- `POST /automation/sickchill/backlog/search` - Trigger backlog

#### WebSocket Connection
- **Endpoint:** `ws://localhost:8000/api/v4/ws`
- **Auth:** Send JWT in first message
- **Reconnect:** Exponential backoff (2s, 4s, 8s, 16s, 30s max)

**Events Received:**
- `status_update` - Service status changes
- `download_progress` - Real-time download progress
- `episode_added` - New episode downloaded
- `analysis_complete` - Analysis task finished
- `log_entry` - Activity feed log entries

---

### 2. API Gateway ↔ PlexIQ Core

**Protocol:** Internal Python function calls (in-process)
**Deployment:** Same process or IPC (Unix socket)

#### Core Functions Exposed

```python
# plexiq/api/core_interface.py

class PlexIQCoreInterface:
    """API Gateway interface to PlexIQ Core."""

    def get_libraries(self) -> List[Library]:
        """Fetch all Plex libraries."""

    def get_library_items(
        self,
        library_id: str,
        limit: int = 50,
        offset: int = 0,
        sort: str = "added_at"
    ) -> PaginatedItems:
        """Fetch items from a library."""

    def analyze_library(
        self,
        library_id: str,
        enrich: bool = True
    ) -> str:
        """Start async analysis task, returns task_id."""

    def delete_items(
        self,
        item_ids: List[str],
        dry_run: bool = True,
        confirm: bool = False
    ) -> DeletionResult:
        """Delete media items with safety checks."""

    def scan_library(
        self,
        library_id: str,
        deep: bool = False
    ) -> str:
        """Trigger Plex library scan, returns task_id."""
```

#### Task Queue (Async Operations)

**Technology:** Celery + Redis or simple asyncio queue

**Long-running tasks:**
- Library analysis (60-120s)
- Metadata enrichment (30-60s)
- Library scans (20-40s)
- Bulk deletions (10-30s)

**Task Status Tracking:**
```python
{
  "task_id": "uuid-here",
  "status": "running",  # pending, running, completed, failed
  "progress_percent": 45,
  "started_at": "2025-12-07T12:00:00Z",
  "estimated_completion": "2025-12-07T12:02:00Z",
  "result": None  # Populated on completion
}
```

---

### 3. API Gateway ↔ SickChill

**Protocol:** HTTP REST (SickChill API)
**Authentication:** API Key in query string
**Base URL:** `http://sickchill:8081/api/{api_key}/`

#### SickChill API Endpoints Used

##### Get Status
```http
GET /api/{api_key}/?cmd=sb
Response:
{
  "data": {
    "api_version": "v4",
    "pid": 1234,
    "version": "2024.12.1"
  }
}
```

##### List Shows
```http
GET /api/{api_key}/?cmd=shows
Response:
{
  "data": {
    "12345": {
      "tvdbid": 121361,
      "show_name": "Game of Thrones",
      "status": "Ended",
      "paused": 0,
      "quality": "HD 1080p"
    }
  }
}
```

##### Get Show Details
```http
GET /api/{api_key}/?cmd=show&tvdbid=121361
Response:
{
  "data": {
    "show_name": "Game of Thrones",
    "status": "Ended",
    "network": "HBO",
    "genre": ["Drama", "Fantasy"],
    "season_list": [1, 2, 3, 4, 5, 6, 7, 8]
  }
}
```

##### Get Episodes
```http
GET /api/{api_key}/?cmd=show.seasons&tvdbid=121361
Response:
{
  "data": {
    "1": {
      "1": {
        "name": "Winter Is Coming",
        "status": "Downloaded",
        "airdate": "2011-04-17"
      }
    }
  }
}
```

##### Force Backlog Search
```http
GET /api/{api_key}/?cmd=backlog.search
Response:
{
  "result": "success",
  "message": "Backlog search started"
}
```

##### Get Queue (Active Downloads)
```http
GET /api/{api_key}/?cmd=queue
Response:
{
  "data": [
    {
      "show_name": "The Mandalorian",
      "season": 4,
      "episode": 1,
      "name": "Chapter 25",
      "status": "Downloading",
      "quality": "1080p WEB-DL",
      "percentage": "45%",
      "size": "1.5 GB"
    }
  ]
}
```

#### Polling Strategy

**Fast Polling (Active Downloads):**
- Interval: 5 seconds
- Condition: When downloads in progress
- Endpoint: `/queue`

**Medium Polling (Show Status):**
- Interval: 60 seconds
- Condition: Always
- Endpoint: `/shows`

**Slow Polling (Backlog):**
- Interval: 300 seconds (5 minutes)
- Condition: Always
- Endpoint: `/backlog.search` (status check)

**Optimization:** Use Redis caching to avoid redundant API calls

---

### 4. PlexIQ Core ↔ Plex Server

**Protocol:** HTTP REST (PlexAPI library)
**Authentication:** X-Plex-Token header
**Base URL:** `http://plex.local:32400`

#### PlexAPI Wrapper Usage

```python
from plexapi.server import PlexServer

# Initialize connection
plex = PlexServer(
    baseurl='http://plex.local:32400',
    token='your-plex-token'
)

# Get libraries
libraries = plex.library.sections()

# Get library items
movies = plex.library.section('Movies')
all_movies = movies.all()

# Scan library
movies.update()

# Get item metadata
item = plex.library.section('Movies').get('Inception')
metadata = {
    'title': item.title,
    'year': item.year,
    'rating': item.rating,
    'view_count': item.viewCount,
    'last_viewed': item.lastViewedAt
}

# Delete item
item.delete()
```

#### Plex Events (Webhooks)

**Optional:** Configure Plex to send webhooks to PlexIQ

```
Plex Settings → Network → Webhooks
URL: http://localhost:8000/api/v4/webhooks/plex
```

**Event Types:**
- `media.scrobble` - Playback completed
- `library.new` - New item added
- `library.on.deck` - Item added to "On Deck"

**Payload Example:**
```json
{
  "event": "library.new",
  "user": true,
  "owner": true,
  "Account": { "title": "username" },
  "Server": { "title": "My Plex Server" },
  "Metadata": {
    "type": "movie",
    "title": "Inception",
    "year": 2010,
    "rating": 8.7
  }
}
```

---

### 5. SickChill ↔ Download Clients

**Protocol:** Internal SickChill management
**Not directly accessed by PlexIQ**

**Download Clients Supported by SickChill:**
- Transmission
- Deluge
- qBittorrent
- SABnzbd (Usenet)
- NZBGet (Usenet)

**PlexIQ Integration:** Monitor via SickChill API only

---

### 6. Notification Layer

**Multi-Channel Dispatcher**

```python
# plexiq/notifications/dispatcher.py

class NotificationDispatcher:
    """Send notifications to multiple channels."""

    async def send(
        self,
        level: str,  # info, success, warning, error
        title: str,
        message: str,
        category: str,  # system, sickchill, plexiq
        metadata: dict = None
    ):
        """Dispatch to all enabled channels."""

        # Desktop notification (Windows/macOS/Linux)
        if config.notifications.desktop_enabled:
            await self.send_desktop(title, message, level)

        # Email
        if config.notifications.email_enabled:
            await self.send_email(title, message, level)

        # Slack
        if config.notifications.slack_enabled:
            await self.send_slack(title, message, level)

        # Discord
        if config.notifications.discord_enabled:
            await self.send_discord(title, message, level)

        # Custom webhook
        if config.notifications.webhook_url:
            await self.send_webhook(title, message, level, metadata)
```

#### Desktop Notifications

**Library:** `plyer` or `notify-py`

```python
from plyer import notification

notification.notify(
    title="PlexIQ: Download Complete",
    message="The Mandalorian S04E01 downloaded",
    app_icon="path/to/icon.png",
    timeout=10
)
```

#### Email Notifications

**Library:** `smtplib` (built-in)

```python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText("The Mandalorian S04E01 downloaded")
msg['Subject'] = "PlexIQ: Download Complete"
msg['From'] = "plexiq@localhost"
msg['To'] = "user@example.com"

smtp = smtplib.SMTP(config.smtp_host, config.smtp_port)
smtp.starttls()
smtp.login(config.smtp_user, config.smtp_password)
smtp.send_message(msg)
smtp.quit()
```

#### Slack Notifications

**Library:** `slack-sdk`

```python
from slack_sdk import WebClient

client = WebClient(token=config.slack_token)

client.chat_postMessage(
    channel=config.slack_channel,
    text="Download Complete: The Mandalorian S04E01",
    blocks=[
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "✅ *Download Complete*\n*Show:* The Mandalorian\n*Episode:* S04E01 - Chapter 25"
            }
        }
    ]
)
```

#### Discord Notifications

**Library:** `discord-webhook`

```python
from discord_webhook import DiscordWebhook, DiscordEmbed

webhook = DiscordWebhook(url=config.discord_webhook_url)

embed = DiscordEmbed(
    title="Download Complete",
    description="The Mandalorian S04E01 - Chapter 25",
    color="03b2f8"
)
embed.set_author(name="PlexIQ Einstein Edition")
embed.add_embed_field(name="Quality", value="1080p WEB-DL")
embed.add_embed_field(name="Size", value="1.5 GB")

webhook.add_embed(embed)
webhook.execute()
```

---

## Data Flow Scenarios

### Scenario 1: New Episode Download & Library Update

```
1. SickChill detects new episode
   ↓
2. SickChill downloads episode to /media/tv/
   ↓
3. SickChill post-processing renames file
   ↓
4. SickChill calls webhook → API Gateway
   POST /api/v4/webhooks/sickchill
   Body: { "event": "download_complete", "show": "...", ... }
   ↓
5. API Gateway receives webhook
   ↓
6. API Gateway calls PlexIQ Core
   core.scan_library("TV Shows")
   ↓
7. PlexIQ Core calls Plex API
   plex.library.section("TV Shows").update()
   ↓
8. API Gateway sends WebSocket event to Dashboard
   { "type": "episode_added", "data": {...} }
   ↓
9. Dashboard receives event, updates UI
   Shows toast: "New episode: The Mandalorian S04E01"
   Updates activity feed
   Increments download counter
   ↓
10. API Gateway sends notification
    NotificationDispatcher.send(
      level="success",
      title="Download Complete",
      message="The Mandalorian S04E01"
    )
   ↓
11. Notifications sent to enabled channels
    Desktop notification appears
    Email sent (if configured)
    Slack/Discord message posted
```

**Timing:**
- Step 1-3: Handled by SickChill (5-30 minutes)
- Step 4-11: PlexIQ processing (<5 seconds)
- Total user-visible latency: <1 second from webhook to dashboard update

---

### Scenario 2: Manual Library Analysis from Dashboard

```
1. User clicks "Analyze Library" button on Dashboard
   ↓
2. Dashboard sends HTTP request
   POST /api/v4/libraries/1/analyze
   Body: { "enrich_metadata": true }
   ↓
3. API Gateway receives request
   ↓
4. API Gateway creates async task
   task_id = core.analyze_library(library_id="1", enrich=True)
   ↓
5. API Gateway responds immediately
   Response (202): { "task_id": "...", "status": "pending" }
   ↓
6. Dashboard receives response
   Shows progress modal: "Analysis starting..."
   ↓
7. PlexIQ Core starts background task
   - Fetches all items from Plex
   - Enriches metadata (TMDb, OMDb)
   - Computes deletion scores
   - Streams progress updates
   ↓
8. API Gateway streams progress via WebSocket
   { "type": "analysis_progress", "task_id": "...", "progress": 25 }
   { "type": "analysis_progress", "task_id": "...", "progress": 50 }
   { "type": "analysis_progress", "task_id": "...", "progress": 75 }
   ↓
9. Dashboard updates progress bar in real-time
   ↓
10. PlexIQ Core completes analysis
    ↓
11. API Gateway sends completion event
    { "type": "analysis_complete", "task_id": "...", "result": {...} }
    ↓
12. Dashboard receives event
    Hides progress modal
    Shows results: "35 items recommended for deletion (82.5 GB)"
    Updates library tile with recommendation count
    ↓
13. User clicks "View Results"
    ↓
14. Dashboard fetches analyzed items
    GET /api/v4/libraries/1/items?sort=deletion_score&order=desc
    ↓
15. Dashboard displays sorted table with recommendations
```

**Timing:**
- API response: <200ms
- Analysis task: 60-120 seconds (450 items, with enrichment)
- Progress updates: Every 10%
- WebSocket latency: <100ms per event

---

### Scenario 3: Force Backlog Search

```
1. User clicks "Trigger Backlog Search" on Dashboard
   ↓
2. Dashboard sends HTTP request
   POST /api/v4/automation/sickchill/backlog/search
   ↓
3. API Gateway receives request
   ↓
4. API Gateway calls SickChill API
   GET http://sickchill:8081/api/{key}/?cmd=backlog.search
   ↓
5. SickChill API responds
   Response: { "result": "success", "message": "Backlog search started" }
   ↓
6. API Gateway returns response
   Response (202): { "status": "started", "message": "..." }
   ↓
7. Dashboard shows notification
   Toast: "Backlog search initiated"
   ↓
8. API Gateway starts polling SickChill queue
   Every 5 seconds: GET /api/{key}/?cmd=queue
   ↓
9. SickChill finds missing episodes, starts downloads
   ↓
10. API Gateway detects new downloads
    Compares queue state with previous poll
    ↓
11. API Gateway sends WebSocket events
    { "type": "download_started", "data": {...} }
    ↓
12. Dashboard receives events
    Updates "Active Downloads" tile
    Shows progress bars
    ↓
13. Downloads complete (see Scenario 1)
```

**Timing:**
- API response: <1 second
- Backlog search duration: 1-10 minutes (depends on indexers)
- Queue polling: Every 5 seconds during downloads
- WebSocket updates: <100ms latency

---

## Integration Challenges & Solutions

### Challenge 1: SickChill No Native Webhooks

**Problem:** SickChill doesn't send webhooks on download completion

**Solutions:**

**Option A: Post-Processing Script**
```bash
#!/bin/bash
# /path/to/sickchill/post_processing_hook.sh

SHOW_NAME="$1"
SEASON="$2"
EPISODE="$3"
FILE_PATH="$4"

curl -X POST http://localhost:8000/api/v4/webhooks/sickchill \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"download_complete\",
    \"show_name\": \"$SHOW_NAME\",
    \"season\": $SEASON,
    \"episode\": $EPISODE,
    \"file_path\": \"$FILE_PATH\"
  }"
```

Configure in SickChill:
```
Settings → Post Processing → Extra Scripts
/path/to/sickchill/post_processing_hook.sh
```

**Option B: Polling with Change Detection**
```python
# plexiq/integrations/sickchill_monitor.py

class SickChillMonitor:
    """Monitor SickChill state and detect changes."""

    def __init__(self):
        self.previous_queue = []
        self.previous_shows = {}

    async def poll(self):
        """Poll SickChill and detect changes."""

        # Get current queue
        current_queue = await sickchill_api.get_queue()

        # Detect completed downloads
        completed = self._detect_completions(
            self.previous_queue,
            current_queue
        )

        for download in completed:
            await self._handle_download_complete(download)

        self.previous_queue = current_queue

    def _detect_completions(self, prev, curr):
        """Compare queues to find completed downloads."""
        prev_ids = {d['id'] for d in prev}
        curr_ids = {d['id'] for d in curr}
        completed_ids = prev_ids - curr_ids

        return [d for d in prev if d['id'] in completed_ids]
```

**Recommended:** Use Option A (post-processing script) for real-time updates

---

### Challenge 2: Rate Limiting External APIs

**Problem:** TMDb/OMDb have rate limits (40 requests/10 seconds)

**Solution: Request Queue with Rate Limiter**

```python
# plexiq/metadata/rate_limiter.py

import asyncio
from collections import deque
from datetime import datetime, timedelta

class RateLimiter:
    """Rate limiter for API requests."""

    def __init__(self, max_requests: int, time_window: timedelta):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()

    async def acquire(self):
        """Wait until rate limit allows request."""

        now = datetime.now()

        # Remove old requests outside time window
        while self.requests and self.requests[0] < now - self.time_window:
            self.requests.popleft()

        # Wait if at limit
        if len(self.requests) >= self.max_requests:
            sleep_time = (self.requests[0] + self.time_window - now).total_seconds()
            await asyncio.sleep(sleep_time)

        self.requests.append(now)

# Usage
tmdb_limiter = RateLimiter(max_requests=40, time_window=timedelta(seconds=10))

async def fetch_tmdb_metadata(movie_id):
    await tmdb_limiter.acquire()
    response = await tmdb_api.get_movie(movie_id)
    return response
```

---

### Challenge 3: WebSocket Connection Stability

**Problem:** WebSocket disconnections on network issues or server restarts

**Solution: Reconnection Logic with Exponential Backoff**

```typescript
// dashboard/src/services/websocket.ts

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000; // 30 seconds

  connect(token: string) {
    this.ws = new WebSocket('ws://localhost:8000/api/v4/ws');

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;

      // Send auth message
      this.ws?.send(JSON.stringify({ type: 'auth', token }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect(token);
    };
  }

  private reconnect(token: string) {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(token);
    }, delay);
  }
}
```

---

### Challenge 4: Long-Running Tasks Timeout

**Problem:** HTTP requests timeout during long analysis (>60s)

**Solution: Async Task Pattern with Polling**

```typescript
// dashboard/src/services/api.ts

async function analyzeLibrary(libraryId: string): Promise<AnalysisResult> {
  // 1. Initiate async task
  const { task_id } = await api.post(`/libraries/${libraryId}/analyze`);

  // 2. Poll for completion (with timeout)
  const maxWaitTime = 300_000; // 5 minutes
  const pollInterval = 2000; // 2 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const task = await api.get(`/tasks/${task_id}`);

    if (task.status === 'completed') {
      return task.result;
    }

    if (task.status === 'failed') {
      throw new Error(task.error);
    }

    // Update progress (optional)
    onProgress?.(task.progress_percent);

    await sleep(pollInterval);
  }

  throw new Error('Task timeout');
}
```

**Better Solution: Use WebSocket for task updates (no polling needed)**

```typescript
// Subscribe to task events via WebSocket
websocket.on('analysis_complete', (event) => {
  if (event.task_id === task_id) {
    resolve(event.result);
  }
});
```

---

## Security Considerations

### API Authentication

**JWT Token Flow:**
1. User logs in → API returns JWT token
2. Dashboard stores token in `localStorage` or `sessionStorage`
3. All API requests include `Authorization: Bearer <token>` header
4. API validates token on every request
5. Token expires after 1 hour → Dashboard auto-refreshes

**Security Best Practices:**
- ✅ Use HTTPS in production
- ✅ Short token expiration (1 hour)
- ✅ Refresh token rotation
- ✅ CORS whitelist for dashboard origin
- ✅ Rate limiting per token
- ✅ Audit log all API calls

---

### Container Isolation

**SickChill Docker Network:**
```yaml
# docker-compose.yml
services:
  sickchill:
    image: lscr.io/linuxserver/sickchill:latest
    container_name: sickchill
    networks:
      - plexiq_internal
    ports:
      - "8081:8081"  # Expose only to localhost
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - ./config:/config
      - /media/tv:/tv
      - /downloads:/downloads
    restart: unless-stopped

networks:
  plexiq_internal:
    driver: bridge
    internal: false  # Allow external access for indexers
```

**Firewall Rules:**
- SickChill port 8081: Localhost only
- API Gateway port 8000: LAN access (optional external)
- Dashboard port 3000: LAN access (or served via CDN)

---

## Next: Release Roadmap

See `05_RELEASE_ROADMAP.md` for phased development plan.

---

**Document End**
