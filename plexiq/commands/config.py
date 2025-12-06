"""
PlexIQ v3 - Config Command
View and validate configuration settings.
Author: Rich Knowles (via Claude-Code)
"""

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.syntax import Syntax

from plexiq.config import get_config

console = Console()


@click.command()
@click.option(
    '--show-secrets/--hide-secrets',
    default=False,
    help='Show API keys and tokens (security warning!)'
)
@click.option(
    '--validate',
    is_flag=True,
    help='Validate configuration and test connections'
)
@click.pass_context
def config(ctx, show_secrets, validate):
    """
    View and validate configuration settings.

    Examples:
      plexiq config
      plexiq config --validate
      plexiq config --show-secrets  # Use with caution!
    """
    config = ctx.obj['config']
    logger = ctx.obj['logger']

    # Display configuration
    _display_config(config, show_secrets)

    # Validation
    if validate:
        console.print("\n[bold]Running validation checks...[/bold]\n")
        _validate_config(config, logger)


def _display_config(config, show_secrets):
    """Display configuration in organized panels."""

    # Plex Configuration
    plex_table = Table(show_header=False, box=None)
    plex_table.add_column("Setting", style="cyan")
    plex_table.add_column("Value", style="white")

    plex_table.add_row("URL", config.get('plex.url'))
    token_display = config.get('plex.token') if show_secrets else '***'
    plex_table.add_row("Token", token_display)

    console.print(Panel(plex_table, title="Plex Configuration", border_style="blue"))

    # API Configuration
    api_table = Table(show_header=False, box=None)
    api_table.add_column("API", style="cyan")
    api_table.add_column("Status", style="white")

    tmdb_status = "✓ Configured" if config.get('apis.tmdb_key') else "✗ Not configured"
    omdb_status = "✓ Configured" if config.get('apis.omdb_key') else "✗ Not configured"

    if show_secrets:
        tmdb_status += f" ({config.get('apis.tmdb_key')})"
        omdb_status += f" ({config.get('apis.omdb_key')})"

    api_table.add_row("TMDb", tmdb_status)
    api_table.add_row("OMDb", omdb_status)

    console.print(Panel(api_table, title="External APIs", border_style="green"))

    # Scoring Weights
    weights_table = Table(show_header=False, box=None)
    weights_table.add_column("Factor", style="cyan")
    weights_table.add_column("Weight", justify="right", style="yellow")

    weights = config.get('weights', {})
    for factor, weight in weights.items():
        weights_table.add_row(factor.replace('_', ' ').title(), f"{weight:.2f}")

    total_weight = sum(weights.values())
    weights_table.add_row("[bold]Total[/bold]", f"[bold]{total_weight:.2f}[/bold]")

    console.print(Panel(weights_table, title="Scoring Weights", border_style="yellow"))

    # Thresholds
    thresholds_table = Table(show_header=False, box=None)
    thresholds_table.add_column("Threshold", style="cyan")
    thresholds_table.add_column("Value", justify="right", style="red")

    thresholds = config.get('thresholds', {})
    thresholds_table.add_row("Min Deletion Score", f"{thresholds.get('min_deletion_score', 0):.2f}")
    thresholds_table.add_row("Never Delete Rating", f"{thresholds.get('never_delete_rating', 0):.1f}/10")

    console.print(Panel(thresholds_table, title="Safety Thresholds", border_style="red"))

    # Application Settings
    app_table = Table(show_header=False, box=None)
    app_table.add_column("Setting", style="cyan")
    app_table.add_column("Value", style="white")

    app_table.add_row("Log Level", config.get('app.log_level'))
    app_table.add_row("Dry-Run Default", str(config.get('app.dry_run_default')))
    app_table.add_row("Log Retention", f"{config.get('app.log_retention_days')} days")
    app_table.add_row("Backup Retention", f"{config.get('app.backup_retention_days')} days")

    console.print(Panel(app_table, title="Application Settings", border_style="magenta"))


def _validate_config(config, logger):
    """Run validation checks."""
    checks_passed = 0
    checks_failed = 0

    # Check 1: Plex connection
    console.print("[cyan]Checking Plex connection...[/cyan]")
    try:
        from plexapi.server import PlexServer
        plex = PlexServer(config.plex_url, config.plex_token)
        console.print(f"  [green]✓[/green] Connected to: {plex.friendlyName}")
        console.print(f"    Version: {plex.version}")
        checks_passed += 1
    except Exception as e:
        console.print(f"  [red]✗[/red] Failed: {e}")
        checks_failed += 1

    # Check 2: TMDb API
    if config.get('apis.tmdb_key'):
        console.print("[cyan]Checking TMDb API...[/cyan]")
        try:
            import tmdbsimple as tmdb
            tmdb.API_KEY = config.get('apis.tmdb_key')
            search = tmdb.Search()
            search.movie(query='Inception')
            console.print(f"  [green]✓[/green] TMDb API is working")
            checks_passed += 1
        except Exception as e:
            console.print(f"  [red]✗[/red] Failed: {e}")
            checks_failed += 1

    # Check 3: OMDb API
    if config.get('apis.omdb_key'):
        console.print("[cyan]Checking OMDb API...[/cyan]")
        try:
            import requests
            response = requests.get(
                'http://www.omdbapi.com/',
                params={'apikey': config.get('apis.omdb_key'), 't': 'Inception'},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            if data.get('Response') == 'True':
                console.print(f"  [green]✓[/green] OMDb API is working")
                checks_passed += 1
            else:
                console.print(f"  [red]✗[/red] Failed: {data.get('Error')}")
                checks_failed += 1
        except Exception as e:
            console.print(f"  [red]✗[/red] Failed: {e}")
            checks_failed += 1

    # Check 4: Directories
    console.print("[cyan]Checking directories...[/cyan]")
    all_dirs_ok = True
    for dir_name, dir_path in config.get('dirs', {}).items():
        if dir_path.exists():
            console.print(f"  [green]✓[/green] {dir_name}: {dir_path}")
        else:
            console.print(f"  [red]✗[/red] {dir_name}: {dir_path} (not found)")
            all_dirs_ok = False

    if all_dirs_ok:
        checks_passed += 1
    else:
        checks_failed += 1

    # Summary
    console.print(f"\n[bold]Validation Summary:[/bold]")
    console.print(f"  Passed: {checks_passed}")
    console.print(f"  Failed: {checks_failed}")

    if checks_failed == 0:
        console.print("\n[green]✓ All checks passed![/green]")
    else:
        console.print("\n[yellow]⚠ Some checks failed. Review configuration.[/yellow]")
