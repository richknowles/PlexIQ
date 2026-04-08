"""
PlexIQ v3 - Untouchables Command
Manage protected movies that should never be recommended for deletion.
Author: Rich Knowles (via Claude-Code)
"""

import click
from datetime import datetime
from rich.console import Console
from rich.table import Table

from plexiq.untouchables import load_untouchables, save_untouchables

console = Console()


@click.group(invoke_without_command=True)
@click.pass_context
def untouchables_group(ctx):
    """Manage protected movies that should never be recommended for deletion."""
    if ctx.invoked_subcommand is None:
        _list()


@untouchables_group.command(name='add')
@click.argument('movie_id', type=str)
@click.option('--title', '-t', help='Movie title for reference')
@click.pass_context
def add(ctx, movie_id, title):
    """Add a movie to the protected list."""
    untouchables = load_untouchables()

    if any(m['id'] == movie_id for m in untouchables):
        console.print(f"[yellow]Movie {movie_id} is already protected[/yellow]")
        return

    untouchables.append({
        'id': movie_id,
        'title': title or 'Unknown',
        'added_at': datetime.now().isoformat()
    })

    save_untouchables(untouchables)
    console.print(f"[green]✓[/green] Added movie [bold]{movie_id}[/bold] to protected list")
    if title:
        console.print(f"  Title: {title}")


@untouchables_group.command(name='remove')
@click.argument('movie_id', type=str)
@click.pass_context
def remove(ctx, movie_id):
    """Remove a movie from the protected list."""
    untouchables = load_untouchables()

    original_count = len(untouchables)
    untouchables = [m for m in untouchables if m['id'] != movie_id]

    if len(untouchables) == original_count:
        console.print(f"[yellow]Movie {movie_id} is not in the protected list[/yellow]")
        return

    save_untouchables(untouchables)
    console.print(f"[green]✓[/green] Removed movie [bold]{movie_id}[/bold] from protected list")


@untouchables_group.command(name='list')
def _list():
    """List all protected movies."""
    untouchables = load_untouchables()

    if not untouchables:
        console.print("[yellow]No protected movies[/yellow]")
        return

    table = Table(title="Protected Movies")
    table.add_column("ID", style="cyan")
    table.add_column("Title", style="white")

    for movie in untouchables:
        table.add_row(movie['id'], movie.get('title', 'Unknown'))

    console.print(table)
    console.print(f"\nTotal: [bold]{len(untouchables)}[/bold] protected movies")