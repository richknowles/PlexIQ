"""
PlexIQ v3 - Collect Command
Collect metadata from Plex libraries with optional enrichment.
Author: Rich Knowles (via Claude-Code)
"""

import json
import click
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.console import Console

from plexiq.collector import MetadataCollector
from plexiq.backup import BackupManager

console = Console()


@click.command()
@click.argument('library_name')
@click.option(
    '--enrich/--no-enrich',
    default=True,
    help='Enrich with external metadata (TMDb, IMDb, RT)'
)
@click.option(
    '--media-type',
    type=click.Choice(['movie', 'show'], case_sensitive=False),
    default='movie',
    help='Type of media to collect'
)
@click.option(
    '--output',
    type=click.Path(),
    help='Save results to JSON file'
)
@click.option(
    '--backup/--no-backup',
    default=True,
    help='Create backup of collected data'
)
@click.pass_context
def collect(ctx, library_name, enrich, media_type, output, backup):
    """
    Collect metadata from Plex library.

    LIBRARY_NAME: Name of the Plex library to collect from

    Examples:
      plexiq collect Movies
      plexiq collect "TV Shows" --media-type show --enrich
      plexiq collect Movies --output movies_metadata.json
    """
    config = ctx.obj['config']
    logger = ctx.obj['logger']

    logger.info(f"Starting metadata collection for library: {library_name}")

    try:
        collector = MetadataCollector(config, logger)

        # Collect and optionally enrich
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            console=console
        ) as progress:
            task = progress.add_task(
                f"Collecting from {library_name}...",
                total=None
            )

            items = collector.collect_and_enrich(
                library_name=library_name,
                media_type=media_type,
                enrich=enrich
            )

            progress.update(task, completed=True)

        logger.success(f"Collected {len(items)} items from {library_name}")

        # Create backup if requested
        if backup:
            backup_manager = BackupManager(config, logger)
            backup_path = backup_manager.create_backup(
                data=items,
                backup_type='collection',
                metadata={
                    'library_name': library_name,
                    'media_type': media_type,
                    'enriched': enrich,
                    'item_count': len(items)
                }
            )
            logger.info(f"Backup created: {backup_path.name}")

        # Save to file if requested
        if output:
            with open(output, 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2, default=str)
            logger.success(f"Results saved to: {output}")

        # Display summary
        console.print(f"\n[green]✓[/green] Collected [bold]{len(items)}[/bold] items")

        if enrich:
            enriched_count = sum(
                1 for item in items
                if any(item.get('ratings', {}).values())
            )
            console.print(f"[green]✓[/green] Enriched [bold]{enriched_count}[/bold] items with external ratings")

    except Exception as e:
        logger.error(f"Collection failed: {e}")
        raise click.ClickException(str(e))
