"""
PlexIQ v3 - Smart Plex Media Library Management
Author: Rich Knowles (via Claude-Code)

A safety-first tool for analyzing and managing Plex media libraries.
Implements dry-run-first architecture with CLI/GUI parity.
"""

__version__ = '3.0.0'
__author__ = 'Rich Knowles'
__description__ = 'Smart Plex Media Library Management with Safety-First Design'

# Core exports
from plexiq.config import get_config, Config
from plexiq.logger import get_logger, PlexIQLogger
from plexiq.collector import MetadataCollector
from plexiq.analyzer import MediaAnalyzer
from plexiq.backup import BackupManager

__all__ = [
    'get_config',
    'Config',
    'get_logger',
    'PlexIQLogger',
    'MetadataCollector',
    'MediaAnalyzer',
    'BackupManager',
]
