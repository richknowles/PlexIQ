"""
PlexIQ - Analyzer Agent
Analyzes movies and generates delete scores
"""

from datetime import datetime, timezone
import math


class Analyzer:
    def __init__(self):
        """Initialize analyzer with scoring weights"""
        self.weights = {
            'rating': 0.30,     # 30% - How bad are the ratings?
            'play_count': 0.30, # 30% - Never watched?
            'file_size': 0.20,  # 20% - How much space would we recover?
            'age': 0.10,        # 10% - How long since last watched?
            'quality': 0.10     # 10% - Combined quality indicators
        }

    def calculate_rating_score(self, movie):
        """Calculate score based on ratings (higher = worse ratings = delete)"""
        scores = []

        # OMDb IMDb rating (0-10 scale, invert it)
        if movie.get('omdb_imdb_rating'):
            # 10 = best, 0 = worst. We want: bad rating = high score
            imdb_score = (10 - movie['omdb_imdb_rating']) * 10 # Convert to 0-100
            scores.append(imdb_score)

        # Rotten Tomatoes (0-100 scale, invert it)
        if movie.get('omdb_rotten_tomatoes') is not None:
            rt_score = 100 - movie['omdb_rotten_tomatoes']
            scores.append(rt_score)

        # TMDb rating (0-10 scale, invert it)
        if movie.get('tmdb_rating'):
            tmdb_score = (10 - movie['tmdb_rating']) * 10
            scores.append(tmdb_score)

        # Plex rating (0-10 scale, invert it)
        if movie.get('plex_rating'):
            plex_score = (10 - movie['plex_rating']) * 10
            scores.append(plex_score)

        # If no ratings available, assume mediocre
        if not scores:
            return 50

        # Average of available ratings
        return sum(scores) / len(scores)

    def calculate_play_count_score(self, movie):
        """Calculate score based on play count (higher = less watched = delete)"""
        play_count = movie.get('view_count', 0)

        if play_count == 0:
            return 100 # Never watched = definitely consider deleting

        if play_count == 1:
            return 70 # Watched once, maybe didn't like it

        if play_count <= 3:
            return 40 # Watched a few times, maybe

        return 0 # Watched frequently, keep it

    def calculate_file_size_score(self, movie):
        """Calculate score based on file size (bigger = more space to recover)"""
        size_gb = movie.get('file_size_gb', 0)

        # Normalize to 0-100 scale
        # Assume max useful size for scoring is 20GB
        max_size = 20
        score = min((size_gb / max_size) * 100, 100)

        return score

    def calculate_age_score(self, movie):
        """Calculate score based on time since last watched"""
        last_viewed = movie.get('last_viewed')

        if not last_viewed:
            # Never watched - handled by play_count_score
            return 50

        try:
            last_viewed_date = datetime.fromisoformat(last_viewed.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            days_ago = (now - last_viewed_date).days

            # More than 2 years = high score
            if days_ago > 730:
                return 100

            # 1-2 years
            if days_ago > 365:
                return 70

            # 6-12 months
            if days_ago > 180:
                return 40

            # Recently watched
            return 0

        except:
            return 50

    def calculate_quality_score(self, movie):
        """Calculate quality score based on various factors"""
        scores = []

        # Content rating (prefer rated content)
        if movie.get('content_rating') in ['Not Rated', 'Unrated']:
            scores.append(30)
        else:
            scores.append(0)

        # Duration (very short or very long might be problematic)
        duration = movie.get('duration_minutes', 90)
        if duration < 60 or duration > 180:
            scores.append(20)
        else:
            scores.append(0)

        return sum(scores) / len(scores) if scores else 0

    def analyze_movie(self, movie):
        """Analyze a single movie and generate delete score"""
        # Calculate component scores
        rating_score = self.calculate_rating_score(movie)
        play_count_score = self.calculate_play_count_score(movie)
        file_size_score = self.calculate_file_size_score(movie)
        age_score = self.calculate_age_score(movie)
        quality_score = self.calculate_quality_score(movie)

        # Weighted total
        delete_score = (
            rating_score * self.weights['rating'] +
            play_count_score * self.weights['play_count'] +
            file_size_score * self.weights['file_size'] +
            age_score * self.weights['age'] +
            quality_score * self.weights['quality']
        )

        # Generate reasoning
        reasons = []

        if play_count_score > 80:
            reasons.append("Never watched")
        elif play_count_score > 50:
            reasons.append("Rarely watched")

        if rating_score > 70:
            reasons.append("Poor ratings")
        elif rating_score > 50:
            reasons.append("Below average ratings")

        if file_size_score > 60:
            reasons.append(f"Large file ({movie.get('file_size_gb', 0):.1f} GB)")

        if age_score > 70:
            reasons.append("Not watched in years")

        movie['delete_score'] = round(delete_score, 1)
        movie['delete_reason'] = ", ".join(reasons) if reasons else "Low priority"
        movie['component_scores'] = {
            'rating': round(rating_score, 1),
            'play_count': round(play_count_score, 1),
            'file_size': round(file_size_score, 1),
            'age': round(age_score, 1),
            'quality': round(quality_score, 1)
        }

        return movie

    def analyze_movies(self, movies):
        """Analyze multiple movies"""
        analyzed = []

        for movie in movies:
            analyzed_movie = self.analyze_movie(movie)
            analyzed.append(analyzed_movie)

        # Sort by delete score (highest first)
        analyzed.sort(key=lambda x: x['delete_score'], reverse=True)

        return analyzed

    def generate_report(self, analyzed_movies):
        """Generate deletion report"""
        total_movies = len(analyzed_movies)
        total_size_gb = sum(m.get('file_size_gb', 0) for m in analyzed_movies)

        # Calculate space recovery for different thresholds
        top_50 = analyzed_movies[:50] if len(analyzed_movies) >= 50 else analyzed_movies
        top_100 = analyzed_movies[:100] if len(analyzed_movies) >= 100 else analyzed_movies
        top_200 = analyzed_movies[:200] if len(analyzed_movies) >= 200 else analyzed_movies

        report = {
            'total_movies': total_movies,
            'total_size_gb': round(total_size_gb, 1),
            'never_watched': len([m for m in analyzed_movies if m.get('view_count', 0) == 0]),
            'low_rated': len([m for m in analyzed_movies if m.get('delete_score', 0) > 70]),
            'space_recovery': {
                'top_50': round(sum(m.get('file_size_gb', 0) for m in top_50), 1),
                'top_100': round(sum(m.get('file_size_gb', 0) for m in top_100), 1),
                'top_200': round(sum(m.get('file_size_gb', 0) for m in top_200), 1)
            },
            'top_candidates': analyzed_movies[:20] # Top 20 for quick display
        }

        return report


def test_analyzer():
    """Test analyzer"""
    analyzer = Analyzer()

    # Test movie (bad ratings, never watched, large file)
    test_movie = {
        'title': 'Test Bad Movie',
        'year': 2019,
        'file_size_gb': 8.5,
        'view_count': 0,
        'omdb_imdb_rating': 3.2,
        'omdb_rotten_tomatoes': 15,
        'tmdb_rating': 3.5,
        'last_viewed': None
    }

    analyzed = analyzer.analyze_movie(test_movie)

    print(f"Movie: {analyzed['title']}")
    print(f"Delete Score: {analyzed['delete_score']}/100")
    print(f"Reason: {analyzed['delete_reason']}")
    print(f"Component Scores: {analyzed['component_scores']}")


if __name__ == "__main__":
    test_analyzer()
