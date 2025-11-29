"""
PlexIQ - Plex Data Collector Agent
Connects to Plex server and collects movie metadata
"""

from plexapi.server import PlexServer
from typing import List, Dict, Optional
import json
from datetime import datetime


class PlexCollector:
    def __init__(self, plex_url: str, plex_token: str):
        """Initialize connection to Plex server"""
        self.plex_url = plex_url.rstrip("/")
        self.plex_token = plex_token
        self.server = None

    def connect(self) -> bool:
        """Connect to Plex server"""
        try:
            self.server = PlexServer(self.plex_url, self.plex_token)
            return True
        except Exception as e:
            print(f"Failed to connect to Plex: {e}")
            return False

    def get_movie_library(self, library_name: str = "Movies") -> Optional[object]:
        """Get the Movies library section"""
        if not self.server:
            return None

        try:
            return self.server.library.section(library_name)
        except Exception as e:
            print(f"Failed to get movie library '{library_name}': {e}")

        # Fallback: find any movie library
        for section in self.server.library.sections():
            if section.type == 'movie':
                print(f"Found movie library: {section.title}")
                return section
        return None

    def collect_all_movies(self) -> List[Dict]:
        """Collect metadata for all movies"""
        if not self.server and not self.connect():
            return []

        movies_lib = self.get_movie_library()
        if not movies_lib:
            print("No movie library found!")
            return []

        movies_data = []
        print(f"Collecting data from '{movies_lib.title}' library...")

        for movie in movies_lib.all():
            try:
                # Calculate total file size in bytes
                file_size = 0
                if movie.media:
                    for media in movie.media:
                        for part in media.parts:
                            if part.size:
                                file_size += part.size

                file_size_gb = round(file_size / (1024 ** 3), 2)

                # Dates
                last_viewed = movie.lastViewedAt.isoformat() if movie.lastViewedAt else None
                added_at = movie.addedAt.isoformat() if movie.addedAt else None

                # Extract IMDb ID from guids
                imdb_id = None
                for guid in movie.guids:
                    if 'imdb' in guid.id.lower():
                        imdb_id = guid.id.split('://')[-1]
                        break

                movie_data = {
                    'title': movie.title,
                    'year': movie.year,
                    'rating_key': movie.ratingKey,
                    'file_size_gb': file_size_gb,
                    'file_path': movie.media[0].parts[0].file if movie.media else None,
                    'view_count': movie.viewCount or 0,
                    'last_viewed': last_viewed,
                    'added_at': added_at,
                    'plex_rating': movie.rating or 0.0,
                    'audience_rating': getattr(movie, 'audienceRating', None) or 0.0,
                    'duration_minutes': round(movie.duration / 60000) if movie.duration else 0,
                    'content_rating': movie.contentRating or 'Not Rated',
                    'studio': movie.studio or 'Unknown',
                    'genres': [g.tag for g in movie.genres] if movie.genres else [],
                    'imdb_id': imdb_id,
                }

                movies_data.append(movie_data)

            except Exception as e:
                print(f"Error processing '{movie.title}': {e}")
                continue

        print(f"Successfully collected {len(movies_data)} movies.")
        return movies_data


def test_connection() -> bool:
    """Test Plex connection with hardcoded credentials (for demo only)"""
    collector = PlexCollector(
        plex_url="http://10.0.0.10:32400",
        plex_token="GifXg9g3Ao4LcRbpCzwZ"
    )

    if collector.connect():
        print(f"Connected to Plex server: {collector.server.friendlyName}")
        movies = collector.collect_all_movies()
        print(f"Found {len(movies)} movies")
        if movies:
            m = movies[0]
            print(f"Sample: {m['title']} ({m['year']}) — {m['file_size_gb']} GB")
        return True
    else:
        print("Failed to connect to Plex")
        return False


if __name__ == "__main__":
    test_connection()
    