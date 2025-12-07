# PlexIQ v4.x API Specifications

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Base URL:** `/api/v4`

---

## API Design Principles

1. **RESTful conventions** with resource-oriented URLs
2. **JSON-only** request/response bodies
3. **Versioned endpoints** (`/api/v4/`, `/api/v5/`)
4. **Token-based authentication** (JWT or API keys)
5. **Consistent error responses** with proper HTTP status codes
6. **Pagination** for list endpoints
7. **Rate limiting** (100 requests/minute per client)
8. **WebSocket** for real-time updates

---

## Authentication

### Token-Based Auth

**Header:**
```
Authorization: Bearer <jwt_token>
```

**Acquire Token:**
```http
POST /api/v4/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "secure_password"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Refresh Token:**
```http
POST /api/v4/auth/refresh
Authorization: Bearer <expired_token>

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

---

## Core Endpoints

### 1. System Status

#### GET `/api/v4/status`

**Description:** Overall system health check

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "4.0.0",
  "uptime_seconds": 86400,
  "services": {
    "plexiq_core": {
      "status": "running",
      "version": "3.1.0",
      "last_heartbeat": "2025-12-07T12:34:56Z"
    },
    "sickchill": {
      "status": "running",
      "version": "2024.12.1",
      "last_heartbeat": "2025-12-07T12:34:50Z",
      "url": "http://sickchill:8081"
    },
    "plex": {
      "status": "reachable",
      "version": "1.40.1.8227",
      "url": "http://plex.local:32400"
    }
  },
  "disk": {
    "total_gb": 2000,
    "used_gb": 1500,
    "available_gb": 500,
    "usage_percent": 75
  }
}
```

---

### 2. Libraries

#### GET `/api/v4/libraries`

**Description:** List all Plex libraries

**Query Parameters:**
- `type` (optional): Filter by type (`movie`, `show`)

**Response (200 OK):**
```json
{
  "libraries": [
    {
      "id": "1",
      "name": "Movies",
      "type": "movie",
      "item_count": 450,
      "size_gb": 800.5,
      "last_scanned": "2025-12-07T10:00:00Z"
    },
    {
      "id": "2",
      "name": "TV Shows",
      "type": "show",
      "item_count": 120,
      "episode_count": 3500,
      "size_gb": 650.2,
      "last_scanned": "2025-12-07T09:30:00Z"
    }
  ],
  "total_count": 2
}
```

#### GET `/api/v4/libraries/{library_id}`

**Description:** Get detailed library information

**Response (200 OK):**
```json
{
  "id": "1",
  "name": "Movies",
  "type": "movie",
  "item_count": 450,
  "size_gb": 800.5,
  "last_scanned": "2025-12-07T10:00:00Z",
  "top_rated": [
    {
      "title": "The Shawshank Redemption",
      "year": 1994,
      "rating": 9.3
    }
  ],
  "recent_additions": [
    {
      "title": "Inception",
      "year": 2010,
      "added_at": "2025-12-06T15:22:00Z"
    }
  ]
}
```

---

### 3. Media Items

#### GET `/api/v4/libraries/{library_id}/items`

**Description:** List media items in a library

**Query Parameters:**
- `limit` (default: 50, max: 500)
- `offset` (default: 0)
- `sort` (default: `added_at`, options: `title`, `rating`, `size`, `deletion_score`)
- `order` (default: `desc`, options: `asc`, `desc`)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "12345",
      "title": "Interstellar",
      "year": 2014,
      "type": "movie",
      "duration_minutes": 169,
      "size_gb": 4.2,
      "resolution": "1080p",
      "codec": "h264",
      "added_at": "2025-12-01T10:00:00Z",
      "view_count": 3,
      "last_viewed_at": "2025-12-05T20:15:00Z",
      "ratings": {
        "imdb": 8.7,
        "tmdb": 8.4,
        "rotten_tomatoes": 72
      },
      "deletion_score": 0.35,
      "deletion_recommended": false
    }
  ],
  "pagination": {
    "total": 450,
    "limit": 50,
    "offset": 0,
    "has_next": true
  }
}
```

#### GET `/api/v4/media/{item_id}`

**Description:** Get detailed media item information

**Response (200 OK):**
```json
{
  "id": "12345",
  "title": "Interstellar",
  "year": 2014,
  "type": "movie",
  "summary": "A team of explorers travel through a wormhole...",
  "duration_minutes": 169,
  "size_gb": 4.2,
  "file_path": "/media/movies/Interstellar (2014)/Interstellar.mkv",
  "media": {
    "resolution": "1080p",
    "video_codec": "h264",
    "audio_codec": "aac",
    "bitrate_kbps": 5000,
    "container": "mkv"
  },
  "plex": {
    "view_count": 3,
    "last_viewed_at": "2025-12-05T20:15:00Z",
    "added_at": "2025-12-01T10:00:00Z",
    "guid": "plex://movie/5d77683f46115600411f7d8c"
  },
  "ratings": {
    "imdb": 8.7,
    "tmdb": 8.4,
    "rotten_tomatoes": 72
  },
  "analysis": {
    "deletion_score": 0.35,
    "deletion_recommended": false,
    "rationale": [
      "Overall deletion score: 0.350/1.000",
      "Play count: 3 (occasional viewer) → low priority",
      "Ratings: IMDb 8.7, TMDb 8.4, RT 72% (avg 8.5/10) → PROTECTED",
      "Size: 4.20 GB (medium) → moderate space recovery",
      "Age: Last watched 2 days ago → very low priority",
      "Quality: 1080p, h264 → score 0.30"
    ]
  }
}
```

---

### 4. Analysis

#### POST `/api/v4/libraries/{library_id}/analyze`

**Description:** Run analysis on library items

**Request Body:**
```json
{
  "enrich_metadata": true,
  "force_refresh": false
}
```

**Response (202 Accepted):**
```json
{
  "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "message": "Analysis started",
  "estimated_duration_seconds": 120
}
```

#### GET `/api/v4/tasks/{task_id}`

**Description:** Get task status

**Response (200 OK):**
```json
{
  "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed",
  "progress_percent": 100,
  "started_at": "2025-12-07T12:00:00Z",
  "completed_at": "2025-12-07T12:02:30Z",
  "result": {
    "items_analyzed": 450,
    "recommended_deletions": 35,
    "space_recoverable_gb": 82.5
  }
}
```

---

### 5. Deletion

#### POST `/api/v4/media/delete`

**Description:** Delete media items (with dry-run support)

**Request Body:**
```json
{
  "item_ids": ["12345", "67890"],
  "dry_run": true,
  "confirm": false
}
```

**Response (200 OK - Dry Run):**
```json
{
  "dry_run": true,
  "items_to_delete": 2,
  "space_to_recover_gb": 8.5,
  "items": [
    {
      "id": "12345",
      "title": "Low-Rated Movie",
      "size_gb": 4.2,
      "will_delete": true,
      "reason": "Deletion score: 0.85"
    }
  ],
  "warnings": [],
  "protected_items": []
}
```

**Request Body (Execute):**
```json
{
  "item_ids": ["12345", "67890"],
  "dry_run": false,
  "confirm": true
}
```

**Response (200 OK - Executed):**
```json
{
  "dry_run": false,
  "items_deleted": 2,
  "space_recovered_gb": 8.5,
  "backup_file": "/home/user/.plexiq/backups/deletion_2025-12-07_120000.json",
  "items": [
    {
      "id": "12345",
      "title": "Low-Rated Movie",
      "size_gb": 4.2,
      "deleted": true
    }
  ]
}
```

---

## SickChill Integration Endpoints

### 6. SickChill Status

#### GET `/api/v4/automation/sickchill/status`

**Description:** Get SickChill service status

**Response (200 OK):**
```json
{
  "status": "running",
  "version": "2024.12.1",
  "url": "http://sickchill:8081",
  "uptime_seconds": 86400,
  "shows_count": 45,
  "episodes_downloaded_today": 12,
  "backlog_count": 50,
  "disk_space_gb": 500
}
```

---

### 7. Shows Management

#### GET `/api/v4/automation/sickchill/shows`

**Description:** List all tracked shows

**Query Parameters:**
- `status` (optional): Filter by status (`continuing`, `ended`)
- `paused` (optional): Filter by paused state (`true`, `false`)

**Response (200 OK):**
```json
{
  "shows": [
    {
      "id": 12345,
      "tvdb_id": 121361,
      "name": "Game of Thrones",
      "status": "ended",
      "paused": false,
      "quality": "HD 1080p",
      "next_episode": null,
      "total_episodes": 73,
      "downloaded_episodes": 73,
      "missing_episodes": 0,
      "last_update": "2025-12-07T10:00:00Z"
    },
    {
      "id": 67890,
      "tvdb_id": 328487,
      "name": "The Mandalorian",
      "status": "continuing",
      "paused": false,
      "quality": "HD 1080p",
      "next_episode": {
        "season": 4,
        "episode": 1,
        "airdate": "2025-12-15",
        "name": "Chapter 25"
      },
      "total_episodes": 24,
      "downloaded_episodes": 24,
      "missing_episodes": 0,
      "last_update": "2025-12-07T11:30:00Z"
    }
  ],
  "total_count": 45
}
```

#### GET `/api/v4/automation/sickchill/shows/{show_id}`

**Description:** Get detailed show information

**Response (200 OK):**
```json
{
  "id": 67890,
  "tvdb_id": 328487,
  "name": "The Mandalorian",
  "status": "continuing",
  "paused": false,
  "quality": "HD 1080p",
  "location": "/media/tv/The Mandalorian",
  "network": "Disney+",
  "genres": ["Action", "Sci-Fi", "Western"],
  "rating": 8.7,
  "summary": "The travels of a lone bounty hunter...",
  "seasons": [
    {
      "season": 1,
      "episodes": 8,
      "downloaded": 8,
      "missing": 0
    },
    {
      "season": 2,
      "episodes": 8,
      "downloaded": 8,
      "missing": 0
    },
    {
      "season": 3,
      "episodes": 8,
      "downloaded": 8,
      "missing": 0
    }
  ],
  "next_episode": {
    "season": 4,
    "episode": 1,
    "airdate": "2025-12-15",
    "name": "Chapter 25"
  }
}
```

---

### 8. Backlog Management

#### GET `/api/v4/automation/sickchill/backlog`

**Description:** Get backlog status

**Response (200 OK):**
```json
{
  "total_missing": 50,
  "last_search": "2025-12-06T22:00:00Z",
  "next_search": "2025-12-07T22:00:00Z",
  "search_running": false,
  "missing_by_show": [
    {
      "show_id": 12345,
      "show_name": "Older Show",
      "missing_episodes": 15,
      "oldest_missing": {
        "season": 5,
        "episode": 10,
        "airdate": "2020-03-15"
      }
    }
  ]
}
```

#### POST `/api/v4/automation/sickchill/backlog/search`

**Description:** Trigger manual backlog search

**Request Body:**
```json
{
  "show_id": 12345,
  "force": true
}
```

**Response (202 Accepted):**
```json
{
  "task_id": "backlog-search-12345",
  "status": "started",
  "message": "Backlog search initiated for show ID 12345"
}
```

---

### 9. Downloads

#### GET `/api/v4/automation/sickchill/downloads`

**Description:** Get active downloads

**Response (200 OK):**
```json
{
  "active_downloads": [
    {
      "id": "abc123",
      "show_name": "The Mandalorian",
      "season": 4,
      "episode": 1,
      "episode_name": "Chapter 25",
      "status": "downloading",
      "progress_percent": 45,
      "size_mb": 1500,
      "downloaded_mb": 675,
      "speed_mbps": 10.5,
      "eta_seconds": 120,
      "quality": "1080p WEB-DL"
    }
  ],
  "queued_downloads": 3,
  "total_downloads_today": 12
}
```

---

## Actions & Operations

### 10. Library Scan

#### POST `/api/v4/actions/scan`

**Description:** Trigger Plex library scan

**Request Body:**
```json
{
  "library_id": "1",
  "deep_scan": false
}
```

**Response (202 Accepted):**
```json
{
  "task_id": "scan-library-1-20251207",
  "status": "started",
  "message": "Library scan initiated for 'Movies'"
}
```

---

### 11. Force Refresh

#### POST `/api/v4/actions/refresh`

**Description:** Force metadata refresh for item(s)

**Request Body:**
```json
{
  "item_ids": ["12345", "67890"]
}
```

**Response (202 Accepted):**
```json
{
  "task_id": "refresh-items-20251207",
  "status": "started",
  "items_queued": 2
}
```

---

## Notifications

### 12. Notification History

#### GET `/api/v4/notifications`

**Description:** Get notification history

**Query Parameters:**
- `limit` (default: 50)
- `level` (optional): Filter by level (`info`, `warning`, `error`)

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "notif-12345",
      "timestamp": "2025-12-07T12:30:00Z",
      "level": "success",
      "title": "Download Complete",
      "message": "The Mandalorian S04E01 downloaded successfully",
      "category": "sickchill",
      "read": false
    },
    {
      "id": "notif-67890",
      "timestamp": "2025-12-07T10:00:00Z",
      "level": "warning",
      "title": "Low Disk Space",
      "message": "Available space: 50 GB (10% remaining)",
      "category": "system",
      "read": true
    }
  ],
  "total_count": 150,
  "unread_count": 5
}
```

#### PATCH `/api/v4/notifications/{notification_id}/read`

**Description:** Mark notification as read

**Response (200 OK):**
```json
{
  "id": "notif-12345",
  "read": true
}
```

---

## WebSocket API

### Connection

**Endpoint:** `ws://localhost:8000/api/v4/ws`

**Authentication:** Send token in first message
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Event Types

#### System Status Update
```json
{
  "type": "status_update",
  "timestamp": "2025-12-07T12:34:56Z",
  "data": {
    "service": "sickchill",
    "status": "running",
    "message": "Service healthy"
  }
}
```

#### Download Progress
```json
{
  "type": "download_progress",
  "timestamp": "2025-12-07T12:34:56Z",
  "data": {
    "download_id": "abc123",
    "show_name": "The Mandalorian",
    "progress_percent": 45,
    "speed_mbps": 10.5,
    "eta_seconds": 120
  }
}
```

#### New Episode Added
```json
{
  "type": "episode_added",
  "timestamp": "2025-12-07T12:34:56Z",
  "data": {
    "show_name": "The Mandalorian",
    "season": 4,
    "episode": 1,
    "title": "Chapter 25",
    "file_path": "/media/tv/The Mandalorian/Season 04/S04E01.mkv"
  }
}
```

#### Analysis Complete
```json
{
  "type": "analysis_complete",
  "timestamp": "2025-12-07T12:34:56Z",
  "data": {
    "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "items_analyzed": 450,
    "recommended_deletions": 35,
    "space_recoverable_gb": 82.5
  }
}
```

#### Log Entry
```json
{
  "type": "log_entry",
  "timestamp": "2025-12-07T12:34:56Z",
  "data": {
    "level": "info",
    "source": "plexiq_core",
    "message": "Starting library scan for 'Movies'",
    "details": {}
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Library with ID '999' not found",
    "details": {
      "library_id": "999"
    },
    "timestamp": "2025-12-07T12:34:56Z"
  }
}
```

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created
- **202 Accepted** - Async operation started
- **400 Bad Request** - Invalid request parameters
- **401 Unauthorized** - Missing or invalid auth token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., duplicate)
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - Service down or overloaded

---

## Rate Limiting

**Default:** 100 requests per minute per client

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638878400
```

**Exceeded Response (429):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "retry_after_seconds": 30
  }
}
```

---

## Pagination

**Query Parameters:**
- `limit` (default: 50, max: 500)
- `offset` (default: 0)

**Response Format:**
```json
{
  "items": [...],
  "pagination": {
    "total": 450,
    "limit": 50,
    "offset": 0,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Next: Dashboard Design

See `03_DASHBOARD_DESIGN.md` for UI/UX specifications.

---

**Document End**
