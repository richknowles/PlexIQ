"""
PlexIQ v3 Logging System
Handles structured logging with rotation, retention, and multiple output formats.
Author: Rich Knowles (via Claude-Code)
Safety: All operations are logged for audit trail.
"""

import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

from rich.console import Console
from rich.logging import RichHandler

from plexiq.config import get_config


class PlexIQLogger:
    """
    Custom logger for PlexIQ with both console (Rich) and file output.
    Implements log rotation and retention policies.
    """

    def __init__(self, name: str = "plexiq", config=None):
        """
        Initialize PlexIQ logger.

        Args:
            name: Logger name
            config: Config instance (uses global if not provided)
        """
        self.config = config or get_config()
        self.logger = logging.getLogger(name)
        self.console = Console()

        # Prevent duplicate handlers
        if not self.logger.handlers:
            self._setup_logger()

    def _setup_logger(self) -> None:
        """Configure logger with console and file handlers."""
        level = getattr(logging, self.config.log_level.upper(), logging.INFO)
        self.logger.setLevel(level)

        # Console handler with Rich formatting
        console_handler = RichHandler(
            console=self.console,
            show_time=True,
            show_path=False,
            markup=True,
            rich_tracebacks=True,
        )
        console_handler.setLevel(level)
        console_formatter = logging.Formatter('%(message)s')
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)

        # File handler with rotation
        log_dir = self.config.get('dirs.log')
        log_dir.mkdir(parents=True, exist_ok=True)

        log_file = log_dir / f"plexiq_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = TimedRotatingFileHandler(
            filename=log_file,
            when='midnight',
            interval=1,
            backupCount=self.config.get('app.log_retention_days', 30),
            encoding='utf-8',
        )
        file_handler.setLevel(logging.DEBUG)  # Always log everything to file
        file_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        self.logger.addHandler(file_handler)

        # Prevent propagation to root logger
        self.logger.propagate = False

    def debug(self, msg: str, **kwargs) -> None:
        """Log debug message."""
        self.logger.debug(msg, **kwargs)

    def info(self, msg: str, **kwargs) -> None:
        """Log info message."""
        self.logger.info(msg, **kwargs)

    def warning(self, msg: str, **kwargs) -> None:
        """Log warning message."""
        self.logger.warning(msg, **kwargs)

    def error(self, msg: str, **kwargs) -> None:
        """Log error message."""
        self.logger.error(msg, **kwargs)

    def critical(self, msg: str, **kwargs) -> None:
        """Log critical message."""
        self.logger.critical(msg, **kwargs)

    def success(self, msg: str) -> None:
        """Log success message (custom level)."""
        self.logger.info(f"[green]✓[/green] {msg}", extra={"markup": True})

    def dry_run(self, msg: str) -> None:
        """Log dry-run action (Rule #1: Safety First)."""
        self.logger.info(f"[yellow]DRY-RUN:[/yellow] {msg}", extra={"markup": True})

    def action(self, msg: str) -> None:
        """Log actual (non-dry-run) action."""
        self.logger.warning(f"[red]ACTION:[/red] {msg}", extra={"markup": True})

    def cleanup_old_logs(self) -> None:
        """
        Remove log files older than retention period.
        Implements automatic log cleanup (Rule #3: Clarity & Feedback).
        """
        log_dir = self.config.get('dirs.log')
        retention_days = self.config.get('app.log_retention_days', 30)
        cutoff_date = datetime.now() - timedelta(days=retention_days)

        deleted_count = 0
        for log_file in log_dir.glob('plexiq_*.log*'):
            if log_file.is_file():
                file_time = datetime.fromtimestamp(log_file.stat().st_mtime)
                if file_time < cutoff_date:
                    try:
                        log_file.unlink()
                        deleted_count += 1
                        self.debug(f"Deleted old log: {log_file.name}")
                    except Exception as e:
                        self.error(f"Failed to delete log {log_file.name}: {e}")

        if deleted_count > 0:
            self.info(f"Cleaned up {deleted_count} old log file(s)")


# Global logger instance
_logger_instance: Optional[PlexIQLogger] = None


def get_logger(name: str = "plexiq") -> PlexIQLogger:
    """
    Get or create global logger instance.

    Args:
        name: Logger name

    Returns:
        Global PlexIQLogger instance
    """
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = PlexIQLogger(name)
    return _logger_instance


def reset_logger() -> None:
    """Reset global logger (mainly for testing)."""
    global _logger_instance
    _logger_instance = None
