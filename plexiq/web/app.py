"""
PlexIQ Web Application - FastAPI Backend
Modern REST API with WebSocket support for real-time updates
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import json
import asyncio
from pathlib import Path

from plexiq.config import get_config
from plexiq.logger import get_logger
from plexiq.collector import MetadataCollector
from plexiq.analyzer import MediaAnalyzer
from plexiq.backup import BackupManager

app = FastAPI(title="PlexIQ Web", version="3.2.0")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
config = None
logger = None
collector = None
analyzer = None
backup_manager = None
active_connections: List[WebSocket] = []


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    global config, logger, collector, analyzer, backup_manager
    try:
        config = get_config(require_token=False)  # Don't require token at startup
        logger = get_logger()
        collector = MetadataCollector(config, logger)
        analyzer = MediaAnalyzer(config, logger)
        backup_manager = BackupManager(config, logger)
    except Exception as e:
        logger = get_logger() if logger is None else logger
        if logger:
            logger.error(f"Startup error: {e}")


@app.get("/")
async def read_root():
    """Serve the main web interface."""
    # Try multiple possible paths
    possible_paths = [
        Path(__file__).parent.parent.parent / "web" / "static" / "index.html",
        Path(__file__).parent.parent / "web" / "static" / "index.html",
        Path("web") / "static" / "index.html",
    ]
    
    for index_file in possible_paths:
        if index_file.exists():
            return FileResponse(index_file)
    
    return HTMLResponse("<h1>PlexIQ Web - Static files not found</h1><p>Please ensure web/static/index.html exists</p>")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "3.2.0"}


@app.get("/api/config")
async def get_configuration():
    """Get current configuration (sanitized)."""
    if config is None:
        raise HTTPException(status_code=503, detail="Configuration not initialized")
    return {
        "plex_url": config.plex_url,
        "has_token": config.has_valid_token(),
        "dry_run_default": config.dry_run_default,
        "weights": config.get("weights"),
        "thresholds": config.get("thresholds"),
    }


@app.get("/api/libraries")
async def get_libraries():
    """Get list of available Plex libraries."""
    if collector is None:
        raise HTTPException(status_code=503, detail="Collector not initialized")
    try:
        sections = collector.plex.library.sections()
        return {
            "libraries": [
                {
                    "title": section.title,
                    "type": section.type,
                    "key": section.key,
                }
                for section in sections
            ]
        }
    except Exception as e:
        if logger:
            logger.error(f"Failed to load libraries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/collect")
async def collect_metadata(
    library_name: str = Query(...),
    media_type: str = Query("movie"),
    enrich: bool = Query(True)
):
    """Collect metadata from a library."""
    if collector is None:
        raise HTTPException(status_code=503, detail="Collector not initialized")
    try:
        await broadcast_progress("collect", {"status": "starting", "library": library_name})
        
        items = collector.collect_and_enrich(
            library_name=library_name,
            media_type=media_type,
            enrich=enrich
        )
        
        await broadcast_progress("collect", {
            "status": "complete",
            "count": len(items),
        })
        
        return {
            "success": True,
            "count": len(items),
            "items": items
        }
    except Exception as e:
        if logger:
            logger.error(f"Collection failed: {e}")
        await broadcast_progress("collect", {"status": "error", "error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_items(items: List[Dict], sort_by_score: bool = True):
    """Analyze collected items."""
    if analyzer is None:
        raise HTTPException(status_code=503, detail="Analyzer not initialized")
    try:
        await broadcast_progress("analyze", {"status": "starting", "count": len(items)})
        
        analyzed = analyzer.analyze_items(items, sort_by_score=sort_by_score)
        
        recommended = sum(1 for item in analyzed if item.get('deletion_recommended', False))
        
        await broadcast_progress("analyze", {
            "status": "complete",
            "count": len(analyzed),
            "recommended": recommended
        })
        
        return {
            "success": True,
            "count": len(analyzed),
            "recommended": recommended,
            "items": analyzed
        }
    except Exception as e:
        if logger:
            logger.error(f"Analysis failed: {e}")
        await broadcast_progress("analyze", {"status": "error", "error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/delete")
async def delete_items(
    items: List[Dict],
    execute: bool = False,
    confirm: bool = False
):
    """Delete items (dry-run by default)."""
    if config is None or logger is None:
        raise HTTPException(status_code=503, detail="Services not initialized")
    
    if execute and not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required for execution")
    
    try:
        # Filter recommended items
        recommended = [item for item in items if item.get('deletion_recommended', False)]
        
        if not recommended:
            return {"success": True, "message": "No items recommended for deletion", "count": 0}
        
        if execute:
            # Actual deletion - use the delete command logic
            from plexapi.server import PlexServer
            from plexiq.backup import BackupManager
            
            plex = PlexServer(config.plex_url, config.plex_token)
            backup_mgr = BackupManager(config, logger)
            
            # Create backup first
            backup_mgr.create_backup(recommended, backup_type="deletion_executed")
            
            deleted_count = 0
            for item in recommended:
                try:
                    # Find the media item in Plex
                    library = plex.library.section(item.get('library_name', ''))
                    media_item = library.get(item.get('title'))
                    if media_item:
                        media_item.delete()
                        deleted_count += 1
                except Exception as e:
                    if logger:
                        logger.error(f"Failed to delete {item.get('title')}: {e}")
            
            return {
                "success": True,
                "executed": True,
                "count": deleted_count,
                "message": f"Deleted {deleted_count} items"
            }
        else:
            # Dry-run
            return {
                "success": True,
                "executed": False,
                "dry_run": True,
                "count": len(recommended),
                "message": f"Dry-run: {len(recommended)} items would be deleted"
            }
    except Exception as e:
        if logger:
            logger.error(f"Deletion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/backups")
async def list_backups():
    """List all backups."""
    if backup_manager is None:
        raise HTTPException(status_code=503, detail="Backup manager not initialized")
    try:
        backups = backup_manager.list_backups()
        return {"success": True, "backups": backups}
    except Exception as e:
        if logger:
            logger.error(f"Failed to list backups: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/backups/restore")
async def restore_backup(filename: str = Query(...)):
    """Restore a backup."""
    if backup_manager is None:
        raise HTTPException(status_code=503, detail="Backup manager not initialized")
    try:
        result = backup_manager.restore_backup(filename)
        return {"success": True, "result": result}
    except Exception as e:
        if logger:
            logger.error(f"Restore failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process messages
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        active_connections.remove(websocket)


async def broadcast_progress(task: str, data: Dict):
    """Broadcast progress to all connected WebSocket clients."""
    message = json.dumps({"task": task, "data": data})
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except:
            disconnected.append(connection)
    
    for conn in disconnected:
        if conn in active_connections:
            active_connections.remove(conn)


# Mount static files - try multiple possible paths
possible_static_dirs = [
    Path(__file__).parent.parent.parent / "web" / "static",
    Path(__file__).parent.parent / "web" / "static",
    Path("web") / "static",
]

for static_dir in possible_static_dirs:
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
        break

