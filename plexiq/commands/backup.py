"""
PlexIQ v3 - Backup Command
Manage backups and operation records.
Author: Rich Knowles (via Claude-Code)
"""

import click
from rich.console import Console
from rich.table import Table
from pathlib import Path

from plexiq.backup import BackupManager

console = Console()


@click.group()
@click.pass_context
def backup(ctx):
    """Manage backups and operation records."""
    pass


@backup.command()
@click.option(
    '--type',
    'backup_type',
    help='Filter by backup type'
)
@click.option(
    '--limit',
    type=int,
    default=20,
    help='Maximum number of backups to list'
)
@click.pass_context
def list(ctx, backup_type, limit):
    """List available backups."""
    config = ctx.obj['config']
    logger = ctx.obj['logger']

    backup_manager = BackupManager(config, logger)
    backups = backup_manager.list_backups(backup_type=backup_type, limit=limit)

    if not backups:
        console.print("[yellow]No backups found[/yellow]")
        return

    table = Table(title="Available Backups")
    table.add_column("Filename", style="cyan")
    table.add_column("Type", style="magenta")
    table.add_column("Created", style="green")
    table.add_column("Size", justify="right", style="yellow")
    table.add_column("Items", justify="right", style="blue")

    for backup in backups:
        size_kb = backup['size_bytes'] / 1024
        item_count = backup.get('metadata', {}).get('item_count', 'N/A')

        table.add_row(
            backup['filename'],
            backup.get('backup_type', 'unknown'),
            backup.get('created_at', 'N/A')[:19],  # Trim to datetime
            f"{size_kb:.1f} KB",
            str(item_count)
        )

    console.print(table)
    console.print(f"\nShowing {len(backups)} backup(s)")


@backup.command()
@click.argument('filename')
@click.option(
    '--output',
    type=click.Path(),
    help='Export to different location'
)
@click.pass_context
def restore(ctx, filename, output):
    """Restore data from a backup."""
    config = ctx.obj['config']
    logger = ctx.obj['logger']

    backup_manager = BackupManager(config, logger)
    backup_dir = config.get('dirs.backup')
    backup_path = backup_dir / filename

    if not backup_path.exists():
        raise click.ClickException(f"Backup not found: {filename}")

    content = backup_manager.restore_backup(backup_path, verify_checksum=True)

    console.print(f"[green]✓[/green] Backup restored successfully")
    console.print(f"  Type: {content.get('backup_type')}")
    console.print(f"  Created: {content.get('created_at')}")
    console.print(f"  Items: {len(content.get('data', []))}")

    if output:
        backup_manager.export_backup(backup_path, Path(output))


@backup.command()
@click.option(
    '--confirm/--no-confirm',
    default=True,
    help='Require confirmation'
)
@click.pass_context
def cleanup(ctx, confirm):
    """Remove old backups based on retention policy."""
    config = ctx.obj['config']
    logger = ctx.obj['logger']

    retention_days = config.get('app.backup_retention_days', 7)

    if confirm:
        from rich.prompt import Confirm
        confirmed = Confirm.ask(
            f"Delete backups older than {retention_days} days?",
            default=False
        )
        if not confirmed:
            console.print("[yellow]Cleanup cancelled[/yellow]")
            return

    backup_manager = BackupManager(config, logger)
    backup_manager.cleanup_old_backups()

    console.print("[green]✓[/green] Backup cleanup complete")
