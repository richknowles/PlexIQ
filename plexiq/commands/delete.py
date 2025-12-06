"""
PlexIQ v3 - Delete Command
Delete media items with dry-run-first safety (Rule #1).
Author: Rich Knowles (via Claude-Code)
Safety: Defaults to dry-run; requires explicit --execute for actual deletion.
"""

import json
import click
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm
from rich.table import Table

from plexiq.collector import MetadataCollector
from plexiq.analyzer import MediaAnalyzer
from plexiq.backup import BackupManager
from plexapi.server import PlexServer

console = Console()


@click.command()
@click.argument('library_name')
@click.option(
    '--input',
    type=click.Path(exists=True),
    help='Use existing analysis JSON file'
)
@click.option(
    '--min-score',
    type=float,
    help='Minimum deletion score threshold (overrides config)'
)
@click.option(
    '--dry-run/--execute',
    default=True,
    help='Dry-run mode (default) vs actual execution'
)
@click.option(
    '--confirm/--no-confirm',
    default=True,
    help='Require confirmation before deletion (even with --execute)'
)
@click.option(
    '--auto-analyze/--no-auto-analyze',
    default=True,
    help='Automatically analyze if no input file provided'
)
@click.pass_context
def delete(ctx, library_name, input, min_score, dry_run, confirm, auto_analyze):
    """
    Delete media items based on analysis scores.

    LIBRARY_NAME: Name of the Plex library

    SAFETY (Rule #1):
      • Defaults to --dry-run mode (no actual deletion)
      • Requires explicit --execute flag for actual deletion
      • Requires confirmation prompt even with --execute
      • Creates backup before any operation
      • Logs all actions for audit trail

    Examples:
      plexiq delete Movies --dry-run
      plexiq delete Movies --execute --confirm
      plexiq delete Movies --input analysis.json --min-score 0.8 --execute
    """
    config = ctx.obj['config']
    logger = ctx.obj['logger']

    # Safety banner
    if dry_run:
        console.print(Panel(
            "[yellow]DRY-RUN MODE[/yellow]\n"
            "No items will be deleted. This is a simulation only.\n"
            "Use --execute to perform actual deletion.",
            title="Safety Mode Active",
            border_style="yellow"
        ))
    else:
        console.print(Panel(
            "[red]EXECUTE MODE[/red]\n"
            "This will DELETE items from your Plex library!\n"
            "Backups will be created, but use with caution.",
            title="⚠️  WARNING: Live Deletion Mode  ⚠️",
            border_style="red"
        ))

    try:
        # Load or analyze items
        if input:
            logger.info(f"Loading analysis from: {input}")
            with open(input, 'r', encoding='utf-8') as f:
                analyzed_items = json.load(f)
        elif auto_analyze:
            logger.info("Auto-analyzing library...")
            collector = MetadataCollector(config, logger)
            items = collector.collect_and_enrich(library_name, enrich=True)

            analyzer = MediaAnalyzer(config, logger)
            analyzed_items = analyzer.analyze_items(items)
        else:
            raise click.ClickException(
                "No input file provided and auto-analyze disabled. "
                "Use --input or enable --auto-analyze."
            )

        # Apply score threshold
        threshold = min_score if min_score is not None else config.get('thresholds.min_deletion_score')

        items_to_delete = [
            item for item in analyzed_items
            if item.get('deletion_score', 0) >= threshold
            and item.get('deletion_recommended', False)
        ]

        if not items_to_delete:
            console.print("[green]No items meet deletion criteria.[/green]")
            return

        # Display deletion plan
        _display_deletion_plan(items_to_delete)

        # Calculate total space recovery
        total_size = sum(
            item.get('media', {}).get('size_bytes', 0)
            for item in items_to_delete
        )
        size_gb = total_size / (1024 ** 3)

        console.print(f"\n[bold]Deletion Summary:[/bold]")
        console.print(f"  Items to delete: {len(items_to_delete)}")
        console.print(f"  Space to recover: {size_gb:.2f} GB")
        console.print(f"  Threshold used: {threshold:.2f}")

        # Create backup of deletion plan
        backup_manager = BackupManager(config, logger)
        backup_path = backup_manager.create_operation_record(
            operation='delete',
            items=items_to_delete,
            dry_run=dry_run,
            library_name=library_name,
            threshold=threshold
        )
        logger.info(f"Deletion plan backed up: {backup_path.name}")

        # Confirmation check
        if not dry_run and confirm:
            console.print()
            confirmed = Confirm.ask(
                f"[red]Are you sure you want to delete {len(items_to_delete)} items?[/red]",
                default=False
            )
            if not confirmed:
                console.print("[yellow]Deletion cancelled by user[/yellow]")
                return

        # Perform deletion (or dry-run)
        if dry_run:
            logger.dry_run(f"Would delete {len(items_to_delete)} items")
            for item in items_to_delete:
                logger.dry_run(f"  • {item['title']} ({item.get('year', 'N/A')})")
        else:
            logger.action(f"Deleting {len(items_to_delete)} items from Plex")
            _perform_deletion(items_to_delete, config, logger)

        console.print(f"\n[green]✓[/green] Operation complete")

    except Exception as e:
        logger.error(f"Delete operation failed: {e}")
        raise click.ClickException(str(e))


def _display_deletion_plan(items):
    """Display planned deletions in a table."""
    table = Table(title="Deletion Plan", show_lines=True)

    table.add_column("#", justify="right", style="cyan")
    table.add_column("Title", style="white")
    table.add_column("Year", justify="center", style="dim")
    table.add_column("Score", justify="center", style="red")
    table.add_column("Size (GB)", justify="right", style="yellow")
    table.add_column("Top Reason", style="magenta")

    for idx, item in enumerate(items, 1):
        size_gb = item.get('media', {}).get('size_bytes', 0) / (1024 ** 3)

        # Get top rationale (skip the summary line)
        rationale_lines = item.get('deletion_rationale', [])
        top_reason = rationale_lines[1] if len(rationale_lines) > 1 else "N/A"

        # Truncate reason if too long
        if len(top_reason) > 50:
            top_reason = top_reason[:47] + "..."

        table.add_row(
            str(idx),
            item['title'],
            str(item.get('year', 'N/A')),
            f"{item['deletion_score']:.3f}",
            f"{size_gb:.2f}",
            top_reason
        )

    console.print(table)


def _perform_deletion(items, config, logger):
    """
    Perform actual deletion of items from Plex.

    Args:
        items: List of items to delete
        config: Config instance
        logger: Logger instance
    """
    plex = PlexServer(config.plex_url, config.plex_token)

    deleted_count = 0
    failed_count = 0

    for item in items:
        try:
            # Fetch item from Plex by rating key
            rating_key = item.get('rating_key')
            if not rating_key:
                logger.warning(f"No rating key for '{item['title']}', skipping")
                failed_count += 1
                continue

            plex_item = plex.fetchItem(rating_key)
            plex_item.delete()

            logger.action(f"Deleted: {item['title']} ({item.get('year', 'N/A')})")
            deleted_count += 1

        except Exception as e:
            logger.error(f"Failed to delete '{item['title']}': {e}")
            failed_count += 1

    logger.info(f"Deletion complete: {deleted_count} deleted, {failed_count} failed")
