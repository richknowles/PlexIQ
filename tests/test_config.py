"""
PlexIQ v3 - Configuration Tests
Author: Rich Knowles (via Claude-Code)
"""

import pytest
import os
from pathlib import Path
from plexiq.config import Config, get_config, reset_config


class TestConfig:
    """Test configuration management."""

    def setup_method(self):
        """Reset config before each test."""
        reset_config()

    def test_config_loads_defaults(self, tmp_path):
        """Test that config loads with safe defaults."""
        # Create minimal .env file
        env_file = tmp_path / ".env"
        env_file.write_text("PLEX_TOKEN=test_token_123\n")

        config = Config(str(env_file))

        assert config.plex_token == "test_token_123"
        assert config.dry_run_default is True  # Rule #1: Safety First
        assert config.log_level == "INFO"

    def test_config_validates_plex_token(self, tmp_path):
        """Test that config requires Plex token."""
        env_file = tmp_path / ".env"
        env_file.write_text("")  # Empty config

        with pytest.raises(ValueError, match="PLEX_TOKEN not set"):
            Config(str(env_file))

    def test_scoring_weights_sum_to_one(self, tmp_path):
        """Test that scoring weights sum to approximately 1.0."""
        env_file = tmp_path / ".env"
        env_file.write_text("PLEX_TOKEN=test_token\n")

        config = Config(str(env_file))
        weights = config.get('weights')
        total = sum(weights.values())

        assert 0.95 <= total <= 1.05

    def test_config_creates_directories(self, tmp_path):
        """Test that config creates necessary directories."""
        env_file = tmp_path / ".env"
        env_file.write_text(
            f"PLEX_TOKEN=test_token\n"
            f"DATA_DIR={tmp_path}/data\n"
        )

        config = Config(str(env_file))

        # Check directories were created
        assert (tmp_path / "data" / "backups").exists()
        assert (tmp_path / "data" / "logs").exists()
        assert (tmp_path / "data" / "cache").exists()

    def test_config_get_method(self, tmp_path):
        """Test config.get() method with dot notation."""
        env_file = tmp_path / ".env"
        env_file.write_text("PLEX_TOKEN=test_token\n")

        config = Config(str(env_file))

        assert config.get('plex.token') == 'test_token'
        assert config.get('app.dry_run_default') is True
        assert config.get('nonexistent.key', 'default') == 'default'

    def test_global_config_instance(self, tmp_path):
        """Test global config singleton."""
        env_file = tmp_path / ".env"
        env_file.write_text("PLEX_TOKEN=test_token\n")

        reset_config()
        config1 = get_config(str(env_file))
        config2 = get_config()

        assert config1 is config2  # Same instance
