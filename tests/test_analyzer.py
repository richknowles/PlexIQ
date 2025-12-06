"""
PlexIQ v3 - Analyzer Tests
Author: Rich Knowles (via Claude-Code)
"""

import pytest
from datetime import datetime, timedelta
from plexiq.analyzer import MediaAnalyzer
from plexiq.config import Config


@pytest.fixture
def mock_config(tmp_path):
    """Create a mock config for testing."""
    env_file = tmp_path / ".env"
    env_file.write_text("PLEX_TOKEN=test_token\n")
    return Config(str(env_file))


@pytest.fixture
def analyzer(mock_config):
    """Create analyzer instance."""
    return MediaAnalyzer(mock_config)


@pytest.fixture
def sample_item():
    """Create a sample media item for testing."""
    return {
        'title': 'Test Movie',
        'year': 2020,
        'plex': {
            'added_at': (datetime.now() - timedelta(days=365)).isoformat(),
            'last_viewed_at': None,
            'view_count': 0,
        },
        'media': {
            'size_bytes': 5 * 1024 ** 3,  # 5 GB
            'resolution': '1080p',
        },
        'ratings': {
            'imdb': 5.0,
            'tmdb': 5.5,
            'rotten_tomatoes': 50,
        }
    }


class TestMediaAnalyzer:
    """Test media analyzer functionality."""

    def test_compute_deletion_score(self, analyzer, sample_item):
        """Test deletion score computation."""
        score, rationale = analyzer.compute_deletion_score(sample_item)

        assert 0.0 <= score <= 1.0
        assert isinstance(rationale, list)
        assert len(rationale) > 0

    def test_never_watched_gets_high_score(self, analyzer, sample_item):
        """Test that unwatched items get high deletion score."""
        sample_item['plex']['view_count'] = 0
        score, _ = analyzer.compute_deletion_score(sample_item)

        # Never watched should contribute to high score
        assert score > 0.5

    def test_frequently_watched_gets_low_score(self, analyzer, sample_item):
        """Test that frequently watched items get low deletion score."""
        sample_item['plex']['view_count'] = 10
        sample_item['plex']['last_viewed_at'] = datetime.now().isoformat()

        score, _ = analyzer.compute_deletion_score(sample_item)

        # Frequently watched should have lower score
        assert score < 0.7

    def test_highly_rated_never_recommended(self, analyzer, sample_item):
        """Test Rule #1: Never recommend deletion of highly rated content."""
        sample_item['ratings'] = {
            'imdb': 9.0,
            'tmdb': 9.0,
            'rotten_tomatoes': 90,
        }

        score, _ = analyzer.compute_deletion_score(sample_item)
        recommended = analyzer._should_recommend_deletion(sample_item, score)

        assert recommended is False  # Protected by high rating

    def test_large_files_get_higher_size_score(self, analyzer, sample_item):
        """Test that large files get higher size scores."""
        # Small file
        sample_item['media']['size_bytes'] = 500 * 1024 ** 2  # 500 MB
        small_score, _ = analyzer._score_size(sample_item)

        # Large file
        sample_item['media']['size_bytes'] = 15 * 1024 ** 3  # 15 GB
        large_score, _ = analyzer._score_size(sample_item)

        assert large_score > small_score

    def test_analyze_items_sorts_by_score(self, analyzer, sample_item):
        """Test that analyze_items sorts results by deletion score."""
        items = []

        # Create items with different characteristics
        for i in range(5):
            item = sample_item.copy()
            item['title'] = f"Movie {i}"
            item['plex'] = sample_item['plex'].copy()
            item['plex']['view_count'] = i  # Increasing view counts
            items.append(item)

        analyzed = analyzer.analyze_items(items, sort_by_score=True)

        # Check that scores are descending
        scores = [item['deletion_score'] for item in analyzed]
        assert scores == sorted(scores, reverse=True)

    def test_rationale_includes_all_factors(self, analyzer, sample_item):
        """Test that rationale includes all scoring factors."""
        _, rationale = analyzer.compute_deletion_score(sample_item)

        # Check that all factors are mentioned
        rationale_text = " ".join(rationale).lower()

        assert 'play count' in rationale_text or 'view' in rationale_text
        assert 'rating' in rationale_text
        assert 'size' in rationale_text or 'gb' in rationale_text
        assert 'age' in rationale_text or 'watched' in rationale_text

    def test_deletion_recommendation_threshold(self, analyzer, sample_item):
        """Test that deletion recommendation respects threshold."""
        # Low score item
        sample_item['plex']['view_count'] = 10
        sample_item['ratings']['imdb'] = 9.0
        low_score, _ = analyzer.compute_deletion_score(sample_item)
        low_recommended = analyzer._should_recommend_deletion(sample_item, low_score)

        # High score item
        sample_item['plex']['view_count'] = 0
        sample_item['ratings']['imdb'] = 3.0
        high_score, _ = analyzer.compute_deletion_score(sample_item)
        high_recommended = analyzer._should_recommend_deletion(sample_item, high_score)

        # High score item should be more likely recommended
        if high_recommended:
            assert high_score >= analyzer.thresholds.get('min_deletion_score', 0.7)
