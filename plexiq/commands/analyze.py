"""
PlexIQ v3 - Analyze Command
Analyze media and compute deletion scores with rationale.
Author: Rich Knowles (via Claude-Code)
"""

import json
import click
from rich.table import Table
from rich.console import Console
from rich.panel import Panel

from plexiq.collector import MetadataCollector
from plexiq.analyzer import MediaAnalyzer
from plexiq.backup import BackupManager

console = Console()


@click.command()
@click.argument('library_name')
@click.option(
    '--input',
    type=click.Path(exists=True),
    help='Use existing metadata JSON file instead of collecting'
)
@click.option(
    '--show-all/--show-recommended',
    default=False,
    help='Show all items or only recommended deletions'
)
@click.option(
    '--output',
    type=click.Path(),
    help='Save analysis results to JSON file'
)
@click.option(
    '--limit',
    type=int,
    help='Limit number of results to display'
)
@click.option(
    '--format',
    type=click.Choice(['table', 'report', 'json'], case_sensitive=False),
    default='table',
    help='Output format'
)
@click.pass_context
def analyze(ctx, library_name, input, show_all, output, limit, format):
    """
    Analyze media items and compute deletion scores.

    LIBRARY_NAME: Name of the Plex library to analyze

    Examples:
      plexiq analyze Movies
      plexiq analyze Movies --show-recommended
      plexiq analyze Movies --input movies.json --format report
      plexiq analyze Movies --limit 20 --output analysis.json
    """
    config = ctx.obj['config']
    logger = ctx.obj['logger']

    logger.info(f"Starting analysis for library: {library_name}")

    try:
        # Load or collect metadata
        if input:
            logger.info(f"Loading metadata from: {input}")
            with open(input, 'r', encoding='utf-8') as f:
                items = json.load(f)
        else:
            logger.info("Collecting metadata from Plex...")
            collector = MetadataCollector(config, logger)
            items = collector.collect_and_enrich(library_name, enrich=True)

        # Analyze items
        analyzer = MediaAnalyzer(config, logger)
        analyzed_items = analyzer.analyze_items(items, sort_by_score=True)

        # Filter if showing only recommended
        display_items = analyzed_items
        if not show_all:
            display_items = [
                item for item in analyzed_items
                if item.get('deletion_recommended', False)
            ]

        # Apply limit
        if limit:
            display_items = display_items[:limit]

        # Save to file if requested
        if output:
            with open(output, 'w', encoding='utf-8') as f:
                json.dump(analyzed_items, f, indent=2, default=str)
            logger.success(f"Analysis saved to: {output}")

        # Create backup of analysis
        backup_manager = BackupManager(config, logger)
        backup_manager.create_backup(
            data=analyzed_items,
            backup_type='analysis',
            metadata={
                'library_name': library_name,
                'total_items': len(analyzed_items),
                'recommended_deletions': sum(
                    1 for item in analyzed_items
                    if item.get('deletion_recommended', False)
                )
            }
        )

        # Display results
        if format == 'table':
            _display_table(display_items, show_all)
        elif format == 'report':
            report = analyzer.generate_report(analyzed_items, show_all)
            console.print(report)
        elif format == 'json':
            console.print_json(data=display_items)

        # Summary
        recommended_count = sum(
            1 for item in analyzed_items
            if item.get('deletion_recommended', False)
        )

        console.print(f"\n[bold]Analysis Summary:[/bold]")
        console.print(f"  Total items: {len(analyzed_items)}")
        console.print(f"  Recommended for deletion: {recommended_count}")

        if recommended_count > 0:
            total_size = sum(
                item.get('media', {}).get('size_bytes', 0)
                for item in analyzed_items
                if item.get('deletion_recommended', False)
            )
            size_gb = total_size / (1024 ** 3)
            console.print(f"  Potential space recovery: {size_gb:.2f} GB")

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise click.ClickException(str(e))


def _display_table(items, show_all):
    """Display analysis results as a Rich table."""
    table = Table(title="PlexIQ Analysis Results", show_lines=True)

    table.add_column("#", justify="right", style="cyan")
    table.add_column("Title", style="white")
    table.add_column("Year", justify="center", style="dim")
    table.add_column("Score", justify="center", style="yellow")
    table.add_column("Size (GB)", justify="right", style="blue")
    table.add_column("Views", justify="center", style="green")
    table.add_column("Rating", justify="center", style="magenta")
    table.add_column("Recommended", justify="center", style="red")

    for idx, item in enumerate(items, 1):
        size_gb = item.get('media', {}).get('size_bytes', 0) / (1024 ** 3)
        view_count = item.get('plex', {}).get('view_count', 0)

        # Get best available rating
        ratings = item.get('ratings', {})
        rating_str = "N/A"
        if ratings.get('imdb'):
            rating_str = f"{ratings['imdb']:.1f}"
        elif ratings.get('tmdb'):
            rating_str = f"{ratings['tmdb']:.1f}"

        recommended = "✓" if item.get('deletion_recommended', False) else ""

        # Color code score
        score = item['deletion_score']
        if score >= 0.7:
            score_str = f"[red]{score:.3f}[/red]"
        elif score >= 0.5:
            score_str = f"[yellow]{score:.3f}[/yellow]"
        else:
            score_str = f"[green]{score:.3f}[/green]"

        table.add_row(
            str(idx),
            item['title'],
            str(item.get('year', 'N/A')),
            score_str,
            f"{size_gb:.2f}",
            str(view_count),
            rating_str,
            recommended
        )

    console.print(table)
