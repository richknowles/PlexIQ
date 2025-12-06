"""
PlexIQ v3 Configuration Management
Handles environment variables, defaults, and validation.
Author: Rich Knowles (via Claude-Code)
Safety: All defaults favor dry-run and conservative behavior.
"""

import os
from pathlib import Path
from typing import Any, Dict, Optional
from dotenv import load_dotenv


class Config:
    """
    Central configuration management for PlexIQ.
    Loads from .env file with safe defaults.
    """

    def __init__(self, env_file: Optional[str] = None):
        """
        Initialize configuration from environment.

        Args:
            env_file: Path to .env file (defaults to .env in project root)
        """
        if env_file:
            load_dotenv(env_file)
        else:
            # Try to find .env in current directory or parent directories
            load_dotenv()

        self._config = self._load_config()
        self._validate_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables with defaults."""
        config = {
            # Plex Configuration
            'plex': {
                'url': os.getenv('PLEX_URL', 'http://localhost:32400'),
                'token': os.getenv('PLEX_TOKEN', ''),
            },

            # External APIs
            'apis': {
                'tmdb_key': os.getenv('TMDB_API_KEY', ''),
                'omdb_key': os.getenv('OMDB_API_KEY', ''),
            },

            # Application Settings
            'app': {
                'log_level': os.getenv('LOG_LEVEL', 'INFO'),
                'log_retention_days': int(os.getenv('LOG_RETENTION_DAYS', '30')),
                'backup_retention_days': int(os.getenv('BACKUP_RETENTION_DAYS', '7')),
                'dry_run_default': os.getenv('DRY_RUN_DEFAULT', 'true').lower() == 'true',
            },

            # Scoring Weights (must sum to ~1.0)
            'weights': {
                'play_count': float(os.getenv('WEIGHT_PLAY_COUNT', '0.3')),
                'ratings': float(os.getenv('WEIGHT_RATINGS', '0.25')),
                'size': float(os.getenv('WEIGHT_SIZE', '0.2')),
                'age': float(os.getenv('WEIGHT_AGE', '0.15')),
                'quality': float(os.getenv('WEIGHT_QUALITY', '0.1')),
            },

            # Deletion Thresholds
            'thresholds': {
                'min_deletion_score': float(os.getenv('MIN_DELETION_SCORE', '0.7')),
                'never_delete_rating': float(os.getenv('NEVER_DELETE_RATING_THRESHOLD', '8.0')),
            },

            # GUI Settings
            'gui': {
                'theme': os.getenv('GUI_THEME', 'dark'),
                'progress_bar_color': os.getenv('PROGRESS_BAR_COLOR', '#F4A940'),  # Mustard
                'animation_duration_ms': int(os.getenv('ANIMATION_DURATION_MS', '200')),
            },

            # Directories
            'dirs': {
                'data': Path(os.getenv('DATA_DIR', './data')),
                'backup': Path(os.getenv('BACKUP_DIR', './data/backups')),
                'log': Path(os.getenv('LOG_DIR', './data/logs')),
                'cache': Path(os.getenv('CACHE_DIR', './data/cache')),
            }
        }

        return config

    def _validate_config(self) -> None:
        """
        Validate configuration values and create necessary directories.
        Raises ValueError for invalid configurations.
        """
        # Validate Plex token exists
        if not self._config['plex']['token']:
            raise ValueError(
                "PLEX_TOKEN not set. Please configure .env file. "
                "See .env.example for reference."
            )

        # Validate scoring weights sum to approximately 1.0
        weights = self._config['weights']
        total_weight = sum(weights.values())
        if not (0.95 <= total_weight <= 1.05):
            raise ValueError(
                f"Scoring weights must sum to ~1.0, got {total_weight:.2f}. "
                f"Current weights: {weights}"
            )

        # Validate thresholds are in valid range
        min_score = self._config['thresholds']['min_deletion_score']
        if not (0.0 <= min_score <= 1.0):
            raise ValueError(
                f"MIN_DELETION_SCORE must be between 0.0 and 1.0, got {min_score}"
            )

        never_delete = self._config['thresholds']['never_delete_rating']
        if not (0.0 <= never_delete <= 10.0):
            raise ValueError(
                f"NEVER_DELETE_RATING_THRESHOLD must be between 0.0 and 10.0, got {never_delete}"
            )

        # Create necessary directories
        for dir_path in self._config['dirs'].values():
            dir_path.mkdir(parents=True, exist_ok=True)

    def get(self, key_path: str, default: Any = None) -> Any:
        """
        Get configuration value by dot-separated path.

        Args:
            key_path: Dot-separated path (e.g., 'plex.url', 'weights.play_count')
            default: Default value if not found

        Returns:
            Configuration value

        Example:
            >>> config.get('plex.url')
            'http://localhost:32400'
        """
        keys = key_path.split('.')
        value = self._config

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value

    def set(self, key_path: str, value: Any) -> None:
        """
        Set configuration value by dot-separated path (runtime only).

        Args:
            key_path: Dot-separated path
            value: Value to set
        """
        keys = key_path.split('.')
        config = self._config

        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]

        config[keys[-1]] = value

    @property
    def plex_url(self) -> str:
        """Get Plex server URL."""
        return self.get('plex.url')

    @property
    def plex_token(self) -> str:
        """Get Plex authentication token."""
        return self.get('plex.token')

    @property
    def dry_run_default(self) -> bool:
        """Get default dry-run setting (Rule #1: Safety First)."""
        return self.get('app.dry_run_default', True)

    @property
    def log_level(self) -> str:
        """Get logging level."""
        return self.get('app.log_level', 'INFO')

    def __repr__(self) -> str:
        """String representation (hides sensitive data)."""
        safe_config = self._config.copy()
        safe_config['plex']['token'] = '***' if safe_config['plex']['token'] else ''
        safe_config['apis']['tmdb_key'] = '***' if safe_config['apis']['tmdb_key'] else ''
        safe_config['apis']['omdb_key'] = '***' if safe_config['apis']['omdb_key'] else ''
        return f"Config({safe_config})"


# Global configuration instance
_config_instance: Optional[Config] = None


def get_config(env_file: Optional[str] = None) -> Config:
    """
    Get or create global configuration instance.

    Args:
        env_file: Path to .env file (only used on first call)

    Returns:
        Global Config instance
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = Config(env_file)
    return _config_instance


def reset_config() -> None:
    """Reset global configuration (mainly for testing)."""
    global _config_instance
    _config_instance = None
