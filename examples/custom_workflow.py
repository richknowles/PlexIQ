#!/usr/bin/env python3
"""
PlexIQ v3 - Custom Workflow Example
Demonstrates how to use PlexIQ programmatically for custom automation.
Author: Rich Knowles (via Claude-Code)
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from plexiq import get_config, MetadataCollector, MediaAnalyzer, BackupManager, get_logger


def example_1_collect_and_analyze():
    """
    Example 1: Basic collection and analysis workflow.
    """
    print("Example 1: Basic Collection and Analysis")
    print("=" * 60)

    # Get configuration and logger
    config = get_config()
    logger = get_logger()

    # Initialize components
    collector = MetadataCollector(config, logger)
    analyzer = MediaAnalyzer(config, logger)

    # Collect metadata
    logger.info("Collecting metadata from Movies library...")
    items = collector.collect_and_enrich("Movies", enrich=True)

    # Analyze items
    logger.info("Analyzing items...")
    analyzed = analyzer.analyze_items(items, sort_by_score=True)

    # Get recommendations
    recommended = [item for item in analyzed if item.get('deletion_recommended', False)]

    # Display results
    print(f"\nTotal items: {len(analyzed)}")
    print(f"Recommended for deletion: {len(recommended)}")

    if recommended:
        print("\nTop 5 recommendations:")
        for i, item in enumerate(recommended[:5], 1):
            print(f"{i}. {item['title']} - Score: {item['deletion_score']:.3f}")


def example_2_custom_filtering():
    """
    Example 2: Custom filtering for specific criteria.
    """
    print("\nExample 2: Custom Filtering")
    print("=" * 60)

    config = get_config()
    logger = get_logger()

    collector = MetadataCollector(config, logger)
    analyzer = MediaAnalyzer(config, logger)

    # Collect metadata
    items = collector.collect_and_enrich("Movies", enrich=True)

    # Custom filter: Large files that are unwatched
    large_unwatched = [
        item for item in items
        if item['plex']['view_count'] == 0
        and item['media']['size_bytes'] > 10 * (1024 ** 3)  # >10GB
    ]

    print(f"\nFound {len(large_unwatched)} large unwatched files")

    if large_unwatched:
        # Analyze these specific items
        analyzed = analyzer.analyze_items(large_unwatched)

        # Calculate potential space savings
        total_size = sum(item['media']['size_bytes'] for item in analyzed)
        size_gb = total_size / (1024 ** 3)

        print(f"Total size: {size_gb:.2f} GB")
        print("\nItems:")
        for item in analyzed[:10]:
            size_gb = item['media']['size_bytes'] / (1024 ** 3)
            print(f"  • {item['title']} - {size_gb:.2f} GB - Score: {item['deletion_score']:.3f}")


def example_3_quality_analysis():
    """
    Example 3: Analyze by quality metrics.
    """
    print("\nExample 3: Quality Analysis")
    print("=" * 60)

    config = get_config()
    logger = get_logger()

    collector = MetadataCollector(config, logger)

    # Collect metadata
    items = collector.collect_and_enrich("Movies", enrich=True)

    # Group by resolution
    by_quality = {}
    for item in items:
        resolution = item.get('media', {}).get('resolution', 'unknown')
        if resolution not in by_quality:
            by_quality[resolution] = []
        by_quality[resolution].append(item)

    print("\nLibrary breakdown by quality:")
    for quality, quality_items in sorted(by_quality.items()):
        count = len(quality_items)
        total_size = sum(item['media']['size_bytes'] for item in quality_items)
        size_gb = total_size / (1024 ** 3)

        print(f"  {quality}: {count} items, {size_gb:.2f} GB")

    # Find candidates for quality upgrade
    sd_items = by_quality.get('sd', []) + by_quality.get('480', [])
    if sd_items:
        print(f"\nFound {len(sd_items)} SD/480p items candidates for upgrade")


def example_4_automated_report():
    """
    Example 4: Generate automated monthly report.
    """
    print("\nExample 4: Automated Monthly Report")
    print("=" * 60)

    config = get_config()
    logger = get_logger()
    backup_manager = BackupManager(config, logger)

    collector = MetadataCollector(config, logger)
    analyzer = MediaAnalyzer(config, logger)

    # Collect and analyze
    items = collector.collect_and_enrich("Movies", enrich=True)
    analyzed = analyzer.analyze_items(items, sort_by_score=True)

    # Generate report
    report = {
        'date': datetime.now().isoformat(),
        'library': 'Movies',
        'total_items': len(analyzed),
        'total_size_gb': sum(item['media']['size_bytes'] for item in analyzed) / (1024 ** 3),
        'recommended_deletions': sum(1 for item in analyzed if item.get('deletion_recommended')),
        'potential_space_recovery_gb': sum(
            item['media']['size_bytes'] for item in analyzed
            if item.get('deletion_recommended')
        ) / (1024 ** 3),
        'never_watched': sum(1 for item in analyzed if item['plex']['view_count'] == 0),
        'highly_rated': sum(
            1 for item in analyzed
            if any(r and r >= 8.0 for r in item.get('ratings', {}).values() if r)
        ),
    }

    print("\nMonthly Report Summary:")
    print(f"  Total items: {report['total_items']}")
    print(f"  Total size: {report['total_size_gb']:.2f} GB")
    print(f"  Never watched: {report['never_watched']}")
    print(f"  Highly rated (≥8.0): {report['highly_rated']}")
    print(f"  Recommended for deletion: {report['recommended_deletions']}")
    print(f"  Potential space recovery: {report['potential_space_recovery_gb']:.2f} GB")

    # Save report
    report_file = f"monthly_report_{datetime.now().strftime('%Y%m')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\nReport saved to: {report_file}")

    # Create backup
    backup_manager.create_backup(
        data=analyzed,
        backup_type='monthly_analysis',
        metadata={'report': report}
    )


def example_5_safe_deletion():
    """
    Example 5: Safe deletion workflow with multiple checks.
    """
    print("\nExample 5: Safe Deletion Workflow")
    print("=" * 60)

    config = get_config()
    logger = get_logger()
    backup_manager = BackupManager(config, logger)

    collector = MetadataCollector(config, logger)
    analyzer = MediaAnalyzer(config, logger)

    # Collect and analyze
    items = collector.collect_and_enrich("Movies", enrich=True)
    analyzed = analyzer.analyze_items(items, sort_by_score=True)

    # Get deletion candidates
    candidates = [
        item for item in analyzed
        if item.get('deletion_recommended')
        and item['deletion_score'] >= 0.85  # Very high threshold
    ]

    print(f"\nFound {len(candidates)} high-confidence deletion candidates")

    if candidates:
        # Additional safety checks
        safe_to_delete = []

        for item in candidates:
            # Check 1: Never delete highly rated
            ratings = [r for r in item.get('ratings', {}).values() if r]
            if ratings and max(ratings) >= 8.0:
                logger.info(f"Skipping {item['title']} - highly rated")
                continue

            # Check 2: Never delete recently added (< 30 days)
            from datetime import datetime, timedelta
            added_at = datetime.fromisoformat(item['plex']['added_at'].replace('Z', '+00:00'))
            if (datetime.now(added_at.tzinfo) - added_at).days < 30:
                logger.info(f"Skipping {item['title']} - recently added")
                continue

            # Check 3: Custom business rules
            # (Add your own criteria here)

            safe_to_delete.append(item)

        print(f"After safety checks: {len(safe_to_delete)} items ready for deletion")

        # Create backup before deletion
        if safe_to_delete:
            backup_path = backup_manager.create_operation_record(
                operation='delete',
                items=safe_to_delete,
                dry_run=True,  # Change to False for actual deletion
                additional_checks='passed'
            )

            print(f"\nBackup created: {backup_path.name}")
            print("\nDRY-RUN: No items were actually deleted")
            print("To execute, modify script and set dry_run=False")


def main():
    """Run all examples."""
    print("PlexIQ v3 - Custom Workflow Examples")
    print("=" * 60)
    print()

    try:
        # Run examples
        example_1_collect_and_analyze()
        print("\n" + "=" * 60 + "\n")

        example_2_custom_filtering()
        print("\n" + "=" * 60 + "\n")

        example_3_quality_analysis()
        print("\n" + "=" * 60 + "\n")

        example_4_automated_report()
        print("\n" + "=" * 60 + "\n")

        example_5_safe_deletion()

        print("\n" + "=" * 60)
        print("All examples completed successfully!")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
