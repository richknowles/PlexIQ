"""
PlexIQ v3 Analyzer & Scoring Engine
Computes deletion scores with detailed rationale.
Author: Rich Knowles (via Claude-Code)
Safety: Scoring is read-only; never deletes without explicit confirmation.
"""

from typing import Any, Dict, List, Tuple
from datetime import datetime, timedelta
import statistics

from plexiq.config import get_config
from plexiq.logger import get_logger


class MediaAnalyzer:
    """
    Analyzes media items and computes deletion scores.
    Implements weighted scoring based on multiple factors.
    """

    def __init__(self, config=None, logger=None):
        """
        Initialize analyzer.

        Args:
            config: Config instance (uses global if not provided)
            logger: Logger instance (uses global if not provided)
        """
        self.config = config or get_config()
        self.logger = logger or get_logger()

        # Load scoring weights
        self.weights = self.config.get('weights', {})
        self.thresholds = self.config.get('thresholds', {})

    def analyze_items(
        self,
        items: List[Dict[str, Any]],
        sort_by_score: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Analyze all items and compute deletion scores.

        Args:
            items: List of metadata dictionaries
            sort_by_score: Sort results by deletion score (descending)

        Returns:
            List of items with scores and rationale
        """
        self.logger.info(f"Analyzing {len(items)} items...")

        analyzed_items = []
        for item in items:
            score, rationale = self.compute_deletion_score(item)

            item['deletion_score'] = score
            item['deletion_rationale'] = rationale
            item['deletion_recommended'] = self._should_recommend_deletion(item, score)

            analyzed_items.append(item)

        if sort_by_score:
            analyzed_items.sort(key=lambda x: x['deletion_score'], reverse=True)

        # Summary statistics
        scores = [item['deletion_score'] for item in analyzed_items]
        recommended_count = sum(1 for item in analyzed_items if item['deletion_recommended'])

        self.logger.info(f"Analysis complete:")
        self.logger.info(f"  Average score: {statistics.mean(scores):.3f}")
        self.logger.info(f"  Median score: {statistics.median(scores):.3f}")
        self.logger.info(f"  Recommended for deletion: {recommended_count}/{len(items)}")

        return analyzed_items

    def compute_deletion_score(
        self,
        item: Dict[str, Any]
    ) -> Tuple[float, List[str]]:
        """
        Compute deletion score for a single item.

        Args:
            item: Metadata dictionary

        Returns:
            Tuple of (score, rationale_list)
            Score is 0.0-1.0 where 1.0 = highest priority for deletion
        """
        rationale = []
        component_scores = {}

        # Component 1: Play count (low = higher deletion score)
        play_score, play_rationale = self._score_play_count(item)
        component_scores['play_count'] = play_score
        rationale.append(play_rationale)

        # Component 2: Ratings (low = higher deletion score)
        rating_score, rating_rationale = self._score_ratings(item)
        component_scores['ratings'] = rating_score
        rationale.append(rating_rationale)

        # Component 3: File size (large = higher deletion score)
        size_score, size_rationale = self._score_size(item)
        component_scores['size'] = size_score
        rationale.append(size_rationale)

        # Component 4: Age/staleness (old + unwatched = higher deletion score)
        age_score, age_rationale = self._score_age(item)
        component_scores['age'] = age_score
        rationale.append(age_rationale)

        # Component 5: Quality (low quality = higher deletion score)
        quality_score, quality_rationale = self._score_quality(item)
        component_scores['quality'] = quality_score
        rationale.append(quality_rationale)

        # Compute weighted total
        total_score = (
            component_scores['play_count'] * self.weights.get('play_count', 0.3) +
            component_scores['ratings'] * self.weights.get('ratings', 0.25) +
            component_scores['size'] * self.weights.get('size', 0.2) +
            component_scores['age'] * self.weights.get('age', 0.15) +
            component_scores['quality'] * self.weights.get('quality', 0.1)
        )

        # Add summary to rationale
        rationale.insert(0, f"Overall deletion score: {total_score:.3f}/1.000")

        return total_score, rationale

    def _score_play_count(self, item: Dict[str, Any]) -> Tuple[float, str]:
        """Score based on play count (0 plays = 1.0, frequent plays = 0.0)."""
        view_count = item.get('plex', {}).get('view_count', 0)

        if view_count == 0:
            return 1.0, "Play count: 0 (never watched) → high deletion priority"
        elif view_count == 1:
            return 0.7, "Play count: 1 (watched once) → moderate priority"
        elif view_count <= 3:
            return 0.4, f"Play count: {view_count} (occasional viewer) → low priority"
        else:
            return 0.1, f"Play count: {view_count} (frequently watched) → very low priority"

    def _score_ratings(self, item: Dict[str, Any]) -> Tuple[float, str]:
        """Score based on external ratings (low rating = higher deletion score)."""
        ratings = item.get('ratings', {})

        # Aggregate available ratings
        available_ratings = []
        rating_sources = []

        if ratings.get('imdb') is not None:
            available_ratings.append(ratings['imdb'])
            rating_sources.append(f"IMDb {ratings['imdb']:.1f}")

        if ratings.get('tmdb') is not None:
            available_ratings.append(ratings['tmdb'])
            rating_sources.append(f"TMDb {ratings['tmdb']:.1f}")

        if ratings.get('rotten_tomatoes') is not None:
            # Convert RT percentage to 0-10 scale
            rt_normalized = ratings['rotten_tomatoes'] / 10.0
            available_ratings.append(rt_normalized)
            rating_sources.append(f"RT {ratings['rotten_tomatoes']}%")

        if not available_ratings:
            return 0.5, "Ratings: No external ratings available → neutral score"

        avg_rating = statistics.mean(available_ratings)
        sources_str = ", ".join(rating_sources)

        # Never delete threshold protection (Rule #1: Safety First)
        never_delete_threshold = self.thresholds.get('never_delete_rating', 8.0)
        if avg_rating >= never_delete_threshold:
            return 0.0, f"Ratings: {sources_str} (avg {avg_rating:.1f}/10) → PROTECTED (highly rated)"

        # Score inversely proportional to rating
        # 10.0 → 0.0, 0.0 → 1.0
        score = 1.0 - (avg_rating / 10.0)

        if avg_rating >= 7.0:
            priority = "low"
        elif avg_rating >= 5.0:
            priority = "moderate"
        else:
            priority = "high"

        return score, f"Ratings: {sources_str} (avg {avg_rating:.1f}/10) → {priority} priority"

    def _score_size(self, item: Dict[str, Any]) -> Tuple[float, str]:
        """Score based on file size (larger = higher deletion score for space recovery)."""
        size_bytes = item.get('media', {}).get('size_bytes', 0)
        size_gb = size_bytes / (1024 ** 3)

        if size_gb < 1.0:
            return 0.2, f"Size: {size_gb:.2f} GB (small) → low space recovery"
        elif size_gb < 5.0:
            return 0.4, f"Size: {size_gb:.2f} GB (medium) → moderate space recovery"
        elif size_gb < 10.0:
            return 0.7, f"Size: {size_gb:.2f} GB (large) → good space recovery"
        else:
            return 1.0, f"Size: {size_gb:.2f} GB (very large) → excellent space recovery"

    def _score_age(self, item: Dict[str, Any]) -> Tuple[float, str]:
        """Score based on age and last viewed (old + unwatched = higher score)."""
        plex_data = item.get('plex', {})

        # Parse dates
        added_at_str = plex_data.get('added_at')
        last_viewed_str = plex_data.get('last_viewed_at')

        if not added_at_str:
            return 0.5, "Age: Unknown add date → neutral score"

        added_at = datetime.fromisoformat(added_at_str.replace('Z', '+00:00'))
        days_since_added = (datetime.now(added_at.tzinfo) - added_at).days

        # If never viewed
        if not last_viewed_str:
            if days_since_added > 365:
                return 1.0, f"Age: Added {days_since_added} days ago, never watched → very high priority"
            elif days_since_added > 180:
                return 0.8, f"Age: Added {days_since_added} days ago, never watched → high priority"
            else:
                return 0.6, f"Age: Added {days_since_added} days ago, never watched → moderate priority"

        # If viewed, check last viewed date
        last_viewed = datetime.fromisoformat(last_viewed_str.replace('Z', '+00:00'))
        days_since_viewed = (datetime.now(last_viewed.tzinfo) - last_viewed).days

        if days_since_viewed > 730:  # 2 years
            return 0.9, f"Age: Last watched {days_since_viewed} days ago → very high priority"
        elif days_since_viewed > 365:  # 1 year
            return 0.6, f"Age: Last watched {days_since_viewed} days ago → moderate priority"
        elif days_since_viewed > 180:  # 6 months
            return 0.4, f"Age: Last watched {days_since_viewed} days ago → low priority"
        else:
            return 0.1, f"Age: Last watched {days_since_viewed} days ago → very low priority"

    def _score_quality(self, item: Dict[str, Any]) -> Tuple[float, str]:
        """Score based on media quality (lower quality = higher deletion score)."""
        media = item.get('media', {})
        resolution = media.get('resolution', '').lower()
        codec = media.get('video_codec', '').lower()

        # Resolution scoring
        if 'sd' in resolution or '480' in resolution:
            res_score = 1.0
            res_label = "SD/480p"
        elif '720' in resolution:
            res_score = 0.6
            res_label = "720p"
        elif '1080' in resolution:
            res_score = 0.3
            res_label = "1080p"
        elif '4k' in resolution or '2160' in resolution:
            res_score = 0.0
            res_label = "4K"
        else:
            res_score = 0.5
            res_label = "unknown"

        # Codec scoring (older codecs = higher score)
        codec_penalty = 0.0
        if 'mpeg2' in codec or 'h263' in codec:
            codec_penalty = 0.3
            codec_label = f"{codec} (old codec)"
        elif codec:
            codec_label = codec
        else:
            codec_label = "unknown codec"

        final_score = min(1.0, res_score + codec_penalty)

        return final_score, f"Quality: {res_label}, {codec_label} → score {final_score:.2f}"

    def _should_recommend_deletion(self, item: Dict[str, Any], score: float) -> bool:
        """
        Determine if item should be recommended for deletion.
        Implements safety checks per Rule #1.

        Args:
            item: Metadata dictionary
            score: Computed deletion score

        Returns:
            True if deletion is recommended
        """
        min_score = self.thresholds.get('min_deletion_score', 0.7)

        # Score threshold check
        if score < min_score:
            return False

        # Never delete highly rated content
        ratings = item.get('ratings', {})
        available_ratings = [
            r for r in [
                ratings.get('imdb'),
                ratings.get('tmdb'),
                ratings.get('rotten_tomatoes', 0) / 10.0
            ] if r is not None
        ]

        if available_ratings:
            avg_rating = statistics.mean(available_ratings)
            never_delete_threshold = self.thresholds.get('never_delete_rating', 8.0)
            if avg_rating >= never_delete_threshold:
                return False

        return True

    def generate_report(
        self,
        items: List[Dict[str, Any]],
        show_all: bool = False
    ) -> str:
        """
        Generate human-readable analysis report.

        Args:
            items: Analyzed items
            show_all: Show all items or just recommended deletions

        Returns:
            Formatted report string
        """
        lines = []
        lines.append("=" * 80)
        lines.append("PlexIQ Deletion Analysis Report")
        lines.append("=" * 80)
        lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")

        # Filter items if needed
        display_items = items
        if not show_all:
            display_items = [item for item in items if item.get('deletion_recommended', False)]

        lines.append(f"Showing: {len(display_items)} items")
        lines.append("")

        for idx, item in enumerate(display_items, 1):
            lines.append(f"[{idx}] {item['title']} ({item.get('year', 'Unknown')})")
            lines.append(f"    Score: {item['deletion_score']:.3f}")
            lines.append(f"    Recommended: {'YES' if item['deletion_recommended'] else 'NO'}")
            lines.append("    Rationale:")

            for rationale_line in item['deletion_rationale']:
                lines.append(f"      • {rationale_line}")

            lines.append("")

        lines.append("=" * 80)

        return "\n".join(lines)
