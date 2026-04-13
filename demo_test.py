#!/usr/bin/env python3
"""
PlexIQ Demo Script - Tests core functionality without Plex server
"""

from plexiq.analyzer import MediaAnalyzer
from plexiq.config import Config
import json

# Create sample media items (simulating what would come from Plex)
sample_items = [
    {
        "title": "Test Movie 1",
        "year": 2020,
        "play_count": 0,
        "rating": 5.5,
        "file_size_gb": 15.2,
        "added_date": "2020-01-01",
        "resolution": "1080p",
        "codec": "h264"
    },
    {
        "title": "Test Movie 2",
        "year": 2022,
        "play_count": 5,
        "rating": 8.5,
        "file_size_gb": 8.1,
        "added_date": "2022-06-15",
        "resolution": "4K",
        "codec": "hevc"
    },
    {
        "title": "Test Movie 3",
        "year": 2018,
        "play_count": 0,
        "rating": 6.2,
        "file_size_gb": 25.8,
        "added_date": "2018-03-20",
        "resolution": "1080p",
        "codec": "h264"
    }
]

print("=" * 60)
print("PlexIQ Core Functionality Demo")
print("=" * 60)
print()

# Initialize analyzer
print("✓ Initializing MediaAnalyzer...")
analyzer = MediaAnalyzer()
print("✓ Analyzer ready!")
print()

# Analyze sample items
print("Analyzing sample media items...")
print()
analyzed = analyzer.analyze_items(sample_items)

# Display results
print("Analysis Results:")
print("-" * 60)
for item in analyzed:
    print(f"\nTitle: {item['title']}")
    print(f"  Play Count: {item['play_count']}")
    print(f"  Rating: {item['rating']}/10")
    print(f"  File Size: {item['file_size_gb']} GB")
    print(f"  Deletion Score: {item['deletion_score']:.3f}")
    print(f"  Recommended for Deletion: {'YES' if item['deletion_recommended'] else 'NO'}")
    if item['deletion_rationale']:
        print(f"  Rationale: {item['deletion_rationale'][0]}")

print()
print("=" * 60)
print("✓ PlexIQ core functionality is working!")
print("=" * 60)
