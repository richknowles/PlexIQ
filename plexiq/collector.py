"""
PlexIQ v3 Metadata Collector
Aggregates data from Plex and enriches with external sources (IMDb, TMDb, RT).
Author: Rich Knowles (via Claude-Code)
Safety: Read-only operations; all API errors are handled gracefully.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
import time

from plexapi.server import PlexServer
from plexapi.exceptions import PlexApiException
import requests
import tmdbsimple as tmdb

from plexiq.config import get_config
from plexiq.logger import get_logger


class MetadataCollector:
    """
    Collects and enriches media metadata from multiple sources.
    Primary: Plex Server
    Enrichment: TMDb, OMDb (IMDb), Rotten Tomatoes (via OMDb)
    """

    def __init__(self, config=None, logger=None):
        """
        Initialize metadata collector.

        Args:
            config: Config instance (uses global if not provided)
            logger: Logger instance (uses global if not provided)
        """
        self.config = config or get_config()
        self.logger = logger or get_logger()

        # Initialize Plex connection
        self.plex = None
        self._connect_plex()

        # Configure external APIs
        tmdb_key = self.config.get('apis.tmdb_key')
        if tmdb_key:
            tmdb.API_KEY = tmdb_key
            self.logger.debug("TMDb API configured")

        self.omdb_key = self.config.get('apis.omdb_key')
        if self.omdb_key:
            self.logger.debug("OMDb API configured")

        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 0.25  # 250ms between requests

    def _connect_plex(self) -> None:
        """Establish connection to Plex server."""
        try:
            self.plex = PlexServer(
                self.config.plex_url,
                self.config.plex_token
            )
            self.logger.success(f"Connected to Plex: {self.plex.friendlyName}")
        except Exception as e:
            self.logger.error(f"Failed to connect to Plex: {e}")
            raise

    def _rate_limit(self) -> None:
        """Enforce rate limiting for external API calls."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_request_interval:
            time.sleep(self.min_request_interval - elapsed)
        self.last_request_time = time.time()

    def collect_library_items(
        self,
        library_name: str,
        media_type: str = 'movie'
    ) -> List[Dict[str, Any]]:
        """
        Collect all items from a Plex library.

        Args:
            library_name: Name of Plex library
            media_type: Type of media ('movie', 'show', etc.)

        Returns:
            List of metadata dictionaries
        """
        try:
            library = self.plex.library.section(library_name)
            items = library.all()

            self.logger.info(f"Found {len(items)} items in '{library_name}'")

            metadata_list = []
            for idx, item in enumerate(items, 1):
                self.logger.debug(f"Processing {idx}/{len(items)}: {item.title}")

                metadata = self._extract_plex_metadata(item, media_type)
                metadata_list.append(metadata)

                # Progress feedback (Rule #3: Clarity & Feedback)
                if idx % 10 == 0:
                    self.logger.info(f"Processed {idx}/{len(items)} items...")

            self.logger.success(f"Collected metadata for {len(metadata_list)} items")
            return metadata_list

        except Exception as e:
            self.logger.error(f"Failed to collect library items: {e}")
            raise

    def _extract_plex_metadata(
        self,
        item: Any,
        media_type: str
    ) -> Dict[str, Any]:
        """
        Extract metadata from Plex item.

        Args:
            item: Plex media item
            media_type: Type of media

        Returns:
            Metadata dictionary
        """
        metadata = {
            # Core identification
            'title': item.title,
            'year': getattr(item, 'year', None),
            'type': media_type,
            'guid': item.guid,
            'rating_key': item.ratingKey,

            # Plex-specific data
            'plex': {
                'added_at': item.addedAt.isoformat() if hasattr(item, 'addedAt') else None,
                'updated_at': item.updatedAt.isoformat() if hasattr(item, 'updatedAt') else None,
                'last_viewed_at': item.lastViewedAt.isoformat() if hasattr(item, 'lastViewedAt') else None,
                'view_count': getattr(item, 'viewCount', 0),
                'rating': getattr(item, 'rating', None),
                'audience_rating': getattr(item, 'audienceRating', None),
            },

            # Media info
            'media': {
                'duration': getattr(item, 'duration', 0),  # milliseconds
                'size_bytes': self._get_total_size(item),
                'resolution': self._get_resolution(item),
                'video_codec': self._get_video_codec(item),
            },

            # External ratings (to be enriched)
            'ratings': {
                'imdb': None,
                'tmdb': None,
                'rotten_tomatoes': None,
            },

            # Metadata
            'summary': getattr(item, 'summary', ''),
            'genres': [genre.tag for genre in getattr(item, 'genres', [])],
            'directors': [director.tag for director in getattr(item, 'directors', [])],
            'actors': [actor.tag for actor in getattr(item, 'roles', [])][:5],  # Top 5

            # Collection timestamp
            'collected_at': datetime.now().isoformat(),
        }

        return metadata

    def _get_total_size(self, item: Any) -> int:
        """Calculate total file size for media item."""
        total_size = 0
        try:
            for media in item.media:
                for part in media.parts:
                    total_size += getattr(part, 'size', 0)
        except Exception as e:
            self.logger.debug(f"Could not calculate size: {e}")
        return total_size

    def _get_resolution(self, item: Any) -> Optional[str]:
        """Get video resolution."""
        try:
            if hasattr(item, 'media') and item.media:
                return item.media[0].videoResolution
        except Exception:
            pass
        return None

    def _get_video_codec(self, item: Any) -> Optional[str]:
        """Get video codec."""
        try:
            if hasattr(item, 'media') and item.media:
                return item.media[0].videoCodec
        except Exception:
            pass
        return None

    def enrich_with_tmdb(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich metadata with TMDb data.

        Args:
            metadata: Existing metadata dictionary

        Returns:
            Enriched metadata
        """
        if not tmdb.API_KEY:
            self.logger.debug("TMDb API key not configured, skipping enrichment")
            return metadata

        try:
            self._rate_limit()

            search = tmdb.Search()
            response = search.movie(query=metadata['title'], year=metadata.get('year'))

            if search.results:
                result = search.results[0]
                metadata['ratings']['tmdb'] = result.get('vote_average')
                metadata['tmdb_id'] = result.get('id')
                metadata['tmdb_popularity'] = result.get('popularity')

                self.logger.debug(f"TMDb rating for '{metadata['title']}': {result.get('vote_average')}")

        except Exception as e:
            self.logger.debug(f"TMDb enrichment failed for '{metadata['title']}': {e}")

        return metadata

    def enrich_with_omdb(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich metadata with OMDb data (IMDb + Rotten Tomatoes).

        Args:
            metadata: Existing metadata dictionary

        Returns:
            Enriched metadata
        """
        if not self.omdb_key:
            self.logger.debug("OMDb API key not configured, skipping enrichment")
            return metadata

        try:
            self._rate_limit()

            params = {
                'apikey': self.omdb_key,
                't': metadata['title'],
                'type': 'movie',
            }

            if metadata.get('year'):
                params['y'] = metadata['year']

            response = requests.get('http://www.omdbapi.com/', params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get('Response') == 'True':
                # IMDb rating
                imdb_rating = data.get('imdbRating')
                if imdb_rating and imdb_rating != 'N/A':
                    metadata['ratings']['imdb'] = float(imdb_rating)

                # Rotten Tomatoes rating
                ratings_list = data.get('Ratings', [])
                for rating in ratings_list:
                    if rating.get('Source') == 'Rotten Tomatoes':
                        rt_value = rating.get('Value', '').replace('%', '')
                        if rt_value and rt_value != 'N/A':
                            metadata['ratings']['rotten_tomatoes'] = int(rt_value)

                self.logger.debug(
                    f"OMDb ratings for '{metadata['title']}': "
                    f"IMDb={metadata['ratings']['imdb']}, RT={metadata['ratings']['rotten_tomatoes']}"
                )

        except Exception as e:
            self.logger.debug(f"OMDb enrichment failed for '{metadata['title']}': {e}")

        return metadata

    def enrich_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich metadata with all available external sources.

        Args:
            metadata: Base metadata from Plex

        Returns:
            Fully enriched metadata
        """
        metadata = self.enrich_with_tmdb(metadata)
        metadata = self.enrich_with_omdb(metadata)
        return metadata

    def collect_and_enrich(
        self,
        library_name: str,
        media_type: str = 'movie',
        enrich: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Collect and optionally enrich metadata for entire library.

        Args:
            library_name: Name of Plex library
            media_type: Type of media
            enrich: Whether to enrich with external APIs

        Returns:
            List of (enriched) metadata dictionaries
        """
        items = self.collect_library_items(library_name, media_type)

        if enrich:
            self.logger.info(f"Enriching {len(items)} items with external data...")
            for idx, item in enumerate(items, 1):
                item = self.enrich_metadata(item)
                if idx % 5 == 0:
                    self.logger.info(f"Enriched {idx}/{len(items)} items...")

            self.logger.success(f"Enrichment complete for {len(items)} items")

        return items
