"""
PlexIQ - Flask REST API
Orchestrates all agents and serves data to the dashboard
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
import time
from datetime import datetime, timedelta

# Import our agents
from agents.plex_collector import PlexCollector
from agents.rating_enricher import RatingEnricher
from agents.analyzer import Analyzer


app = Flask(__name__)
CORS(app)


# ==================== CONFIGURATION ====================
PLEX_URL = os.getenv('PLEX_URL', 'http://10.0.0.10:32400')
PLEX_TOKEN = os.getenv('PLEX_TOKEN', 'GifXg9g3Ao4LcRbpCzwZ')
OMDB_API_KEY = os.getenv('OMDB_API_KEY', '27d1a548')
TMDB_API_KEY = os.getenv('TMDB_API_KEY', 'a4af4f20738fafa880491ff093b98b58')

CACHE_FILE = '/tmp/plexiq_cache.json'
CACHE_DURATION_HOURS = 6


# ==================== GLOBAL STATE ====================
analysis_state = {
    'status': 'idle',           # idle, collecting, enriching, analyzing, complete, error
    'progress': 0,
    'total': 0,
    'current_step': '',
    'error': None,
    'last_updated': None
}

cached_results = None


# ==================== CACHE FUNCTIONS ====================
def load_cache():
    """Load cached results if available and fresh"""
    global cached_results

    if not os.path.exists(CACHE_FILE):
        return None

    try:
        with open(CACHE_FILE, 'r') as f:
            cache_data = json.load(f)

        cache_time = datetime.fromisoformat(cache_data['timestamp'])
        age = datetime.now() - cache_time

        if age < timedelta(hours=CACHE_DURATION_HOURS):
            cached_results = cache_data['results']
            analysis_state['last_updated'] = cache_data['timestamp']
            return cached_results

    except Exception as e:
        print(f"Error loading cache: {e}")

    return None


def save_cache(results):
    """Save results to cache"""
    global cached_results

    cache_data = {
        'timestamp': datetime.now().isoformat(),
        'results': results
    }

    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f, indent=2)

        cached_results = results
        analysis_state['last_updated'] = cache_data['timestamp']

    except Exception as e:
        print(f"Error saving cache: {e}")


# ==================== FULL ANALYSIS PIPELINE ====================
def run_full_analysis():
    """Run complete analysis pipeline"""
    global cached_results

    try:
        # Step 1: Collect from Plex
        analysis_state['status'] = 'collecting'
        analysis_state['current_step'] = 'Connecting to Plex server...'
        analysis_state['progress'] = 0

        collector = PlexCollector(PLEX_URL, PLEX_TOKEN)
        if not collector.connect():
            raise Exception("Failed to connect to Plex server")

        movies = collector.collect_all_movies()

        if not movies:
            raise Exception("No movies found in library")

        analysis_state['total'] = len(movies)
        analysis_state['current_step'] = f'Collected {len(movies)} movies'
        analysis_state['progress'] = 15

        # Step 2: Enrich with external ratings
        analysis_state['status'] = 'enriching'
        analysis_state['current_step'] = 'Fetching ratings from OMDb and TMDb...'

        enricher = RatingEnricher(OMDB_API_KEY, TMDB_API_KEY)

        for i, movie in enumerate(movies):
            enricher.enrich_movie(movie)

            progress = 15 + int((i + 1) / len(movies) * 45)
            analysis_state['progress'] = progress
            analysis_state['current_step'] = f'Enriching: {movie["title"]} ({i+1}/{len(movies)})'

            # Be respectful to APIs
            if i % 10 == 9:
                time.sleep(1)

        # Step 3: Analyze and score
        analysis_state['status'] = 'analyzing'
        analysis_state['current_step'] = 'Calculating delete scores...'
        analysis_state['progress'] = 65

        analyzer = Analyzer()
        analyzed_movies = analyzer.analyze_movies(movies)

        analysis_state['progress'] = 85
        analysis_state['current_step'] = 'Generating final report...'

        # Step 4: Generate report
        report = analyzer.generate_report(analyzed_movies)

        results = {
            'movies': analyzed_movies,
            'report': report,
            'generated_at': datetime.now().isoformat()
        }

        # Save to cache
        save_cache(results)

        analysis_state['status'] = 'complete'
        analysis_state['progress'] = 100
        analysis_state['current_step'] = 'Analysis complete!'
        analysis_state['last_updated'] = datetime.now().isoformat()

        return results

    except Exception as e:
        analysis_state['status'] = 'error'
        analysis_state['error'] = str(e)
        analysis_state['current_step'] = f'Error: {str(e)}'
        analysis_state['progress'] = 0
        raise


# ==================== ROUTES ====================
@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current analysis status"""
    return jsonify(analysis_state)


@app.route('/api/analyze', methods=['POST'])
def trigger_analysis():
    """Trigger a new analysis (or use cached results)"""
    force_refresh = request.json.get('force_refresh', False) if request.json else False

    # Return cached results if available and not forced
    if not force_refresh and cached_results:
        return jsonify({
            'status': 'complete',
            'cached': True,
            'results': cached_results
        })

    # Prevent multiple runs
    if analysis_state['status'] in ['collecting', 'enriching', 'analyzing']:
        return jsonify({
            'status': 'running',
            'message': 'Analysis already in progress'
        }), 409

    # Run analysis
    try:
        results = run_full_analysis()
        return jsonify({
            'status': 'complete',
            'cached': False,
            'results': results
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/api/movies', methods=['GET'])
def get_movies():
    """Get all analyzed movies with optional filtering"""
    if not cached_results:
        load_cache()

    if not cached_results:
        return jsonify({'error': 'No analysis data available. Run analysis first.'}), 404

    min_score = request.args.get('min_score', type=float)
    max_score = request.args.get('max_score', type=float)
    limit = request.args.get('limit', type=int)

    movies = cached_results.get('movies', [])

    if min_score is not None:
        movies = [m for m in movies if m.get('delete_score', 0) >= min_score]

    if max_score is not None:
        movies = [m for m in movies if m.get('delete_score', 0) <= max_score]

    if limit:
        movies = movies[:limit]

    return jsonify({
        'movies': movies,
        'count': len(movies),
        'total_available': len(cached_results.get('movies', []))
    })


@app.route('/api/report', methods=['GET'])
def get_report():
    """Get analysis report summary"""
    if not cached_results:
        load_cache()

    if not cached_results:
        return jsonify({'error': 'No analysis data available.'}), 404

    return jsonify(cached_results.get('report', {}))


@app.route('/api/movie/<int:movie_id>', methods=['GET'])
def get_movie_detail(movie_id):
    """Get detailed information about a specific movie by index"""
    if not cached_results:
        load_cache()

    if not cached_results:
        return jsonify({'error': 'No analysis data available'}), 404

    movies = cached_results.get('movies', [])

    if 0 <= movie_id < len(movies):
        return jsonify(movies[movie_id])
    else:
        return jsonify({'error': 'Movie not found'}), 404


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get overall statistics"""
    if not cached_results:
        load_cache()

    if not cached_results:
        return jsonify({'error': 'No analysis data available'}), 404

    movies = cached_results.get('movies', [])

    total_movies = len(movies)
    total_size_gb = sum(m.get('file_size_gb', 0) for m in movies)
    never_watched = len([m for m in movies if m.get('view_count', 0) == 0])
    high_score = len([m for m in movies if m.get('delete_score', 0) >= 70])
    medium_score = len([m for m in movies if 40 <= m.get('delete_score', 0) < 70])
    low_score = len([m for m in movies if m.get('delete_score', 0) < 40])

    top_50_size = sum(m.get('file_size_gb', 0) for m in movies[:50])
    top_100_size = sum(m.get('file_size_gb', 0) for m in movies[:100])

    return jsonify({
        'total_movies': total_movies,
        'total_size_gb': round(total_size_gb, 2),
        'never_watched': never_watched,
        'delete_candidates': {
            'high_priority': high_score,
            'medium_priority': medium_score,
            'low_priority': low_score
        },
        'space_recovery': {
            'top_50_gb': round(top_50_size, 2),
            'top_100_gb': round(top_100_size, 2)
        },
        'last_updated': analysis_state.get('last_updated')
    })


@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear cached results"""
    global cached_results

    if os.path.exists(CACHE_FILE):
        os.remove(CACHE_FILE)

    cached_results = None
    analysis_state['last_updated'] = None

    return jsonify({
        'status': 'success',
        'message': 'Cache cleared successfully'
    })


# ==================== STARTUP ====================
if __name__ == '__main__':
    print("PlexIQ API Starting...")
    load_cache()

    if cached_results:
        print(f"Loaded cached analysis from {analysis_state['last_updated']}")
    else:
        print("No cache found — run /api/analyze to generate data")

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
	