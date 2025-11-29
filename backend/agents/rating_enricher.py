"""
PlexIQ - Rating Enricher Agent
Enriches movie data with external ratings from OMDb and TMDb
"""

import requests
import time


class RatingEnricher:
    def __init__(self, omdb_key, tmdb_key):
        """Initialize with API keys"""
        self.omdb_key = omdb_key
        self.tmdb_key = tmdb_key
        self.omdb_url = "http://www.omdbapi.com/"
        self.tmdb_url = "https://api.themoviedb.org/3"

    def enrich_with_omdb(self, movie):
        """Get ratings from OMDb"""
        try:
            # Try IMDb ID first
            params = {'apikey': self.omdb_key}

            if movie.get('imdb_id'):
                params['i'] = movie['imdb_id']
            else:
                # Search by title and year
                params['t'] = movie['title']
                if movie.get('year'):
                    params['y'] = movie['year']

            response = requests.get(self.omdb_url, params=params, timeout=5)

            if response.status_code == 200:
                data = response.json()

                if data.get('Response') == 'True':
                    # Extract ratings
                    movie['omdb_imdb_rating'] = float(data.get('imdbRating', 0)) if data.get('imdbRating', 'N/A') != 'N/A' else 0
                    movie['omdb_imdb_votes'] = data.get('imdbVotes', '0').replace(',', '')
                    movie['omdb_metascore'] = int(data.get('Metascore', 0)) if data.get('Metascore', 'N/A') != 'N/A' else 0

                    # Rotten Tomatoes score
                    movie['omdb_rotten_tomatoes'] = 0
                    if data.get('Ratings'):
                        for rating in data['Ratings']:
                            if rating['Source'] == 'Rotten Tomatoes':
                                rt_score = rating['Value'].replace('%', '')
                                movie['omdb_rotten_tomatoes'] = int(rt_score)

                    # Store IMDb ID if found
                    if not movie.get('imdb_id') and data.get('imdbID'):
                        movie['imdb_id'] = data['imdbID']

                    return True

        except Exception as e:
            print(f"OMDb error for {movie['title']}: {e}")

        return False

    def enrich_with_tmdb(self, movie):
        """Get ratings from TMDb"""
        try:
            # Search for movie
            search_url = f"{self.tmdb_url}/search/movie"
            params = {
                'api_key': self.tmdb_key,
                'query': movie['title']
            }

            if movie.get('year'):
                params['year'] = movie['year']

            response = requests.get(search_url, params=params, timeout=5)

            if response.status_code == 200:
                data = response.json()

                if data.get('results'):
                    # Get first result
                    result = data['results'][0]
                    movie['tmdb_rating'] = result.get('vote_average', 0)
                    movie['tmdb_votes'] = result.get('vote_count', 0)
                    movie['tmdb_popularity'] = result.get('popularity', 0)

                    # Store TMDb ID
                    movie['tmdb_id'] = result.get('id')

                    return True

        except Exception as e:
            print(f"TMDb error for {movie['title']}: {e}")

        return False

    def enrich_movie(self, movie):
        """Enrich single movie with all available ratings"""
        # Try OMDb
        self.enrich_with_omdb(movie)
        time.sleep(0.1)  # Rate limiting

        # Try TMDb
        self.enrich_with_tmdb(movie)
        time.sleep(0.1)  # Rate limiting

        return movie

    def enrich_movies_batch(self, movies, progress_callback=None):
        """Enrich a batch of movies"""
        total = len(movies)
        enriched = []

        for i, movie in enumerate(movies):
            print(f"Enriching {i+1}/{total}: {movie['title']}")
            enriched_movie = self.enrich_movie(movie)
            enriched.append(enriched_movie)

            if progress_callback:
                progress_callback(i+1, total)

        return enriched


def test_enricher():
    """Test rating enrichment"""
    enricher = RatingEnricher(
        omdb_key="27d1a548",
        tmdb_key="a4af4f20738fafa880491ff093b98b58"
    )

    # Test movie
    test_movie = {
        'title': 'The Shawshank Redemption',
        'year': 1994,
        'imdb_id': 'tt0111161'
    }

    print(f"Testing with: {test_movie['title']}")
    enriched = enricher.enrich_movie(test_movie)

    print(f"OMDb IMDb Rating: {enriched.get('omdb_imdb_rating', 'N/A')}")
    print(f"OMDb Rotten Tomatoes: {enriched.get('omdb_rotten_tomatoes', 'N/A')}%")
    print(f"TMDb Rating: {enriched.get('tmdb_rating', 'N/A')}")


if __name__ == "__main__":
    test_enricher()
    