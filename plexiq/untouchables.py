"""
PlexIQ v3 - Untouchables Module
Manages protected movies that should never be recommended for deletion.
"""

import json
from pathlib import Path
from typing import List, Dict, Any


def get_untouchables_path() -> Path:
    """Get the path to the untouchables data file."""
    data_dir = Path(__file__).parent / 'data'
    data_dir.mkdir(exist_ok=True)
    return data_dir / 'untouchables.json'


def load_untouchables() -> List[Dict[str, Any]]:
    """Load the list of protected movie IDs."""
    path = get_untouchables_path()
    if not path.exists():
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_untouchables(untouchables: List[Dict[str, Any]]) -> None:
    """Save the list of protected movie IDs."""
    path = get_untouchables_path()
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(untouchables, f, indent=2)


def is_untouchable(movie_id: str) -> bool:
    """
    Check if a movie is protected (untouchable).
    
    Args:
        movie_id: The Plex rating key of the movie
        
    Returns:
        True if the movie is protected
    """
    untouchables = load_untouchables()
    return any(m['id'] == str(movie_id) for m in untouchables)


def get_untouchable_ids() -> set:
    """
    Get all untouchable movie IDs as a set for efficient lookup.
    
    Returns:
        Set of protected movie IDs
    """
    untouchables = load_untouchables()
    return {str(m['id']) for m in untouchables}