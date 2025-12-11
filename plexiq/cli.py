"""
PlexIQ v3 CLI Engine
Unified command-line interface with dry-run-first architecture.
Author: Rich Knowles (via Claude-Code)
Safety: Rule #1 - All destructive operations default to dry-run mode.
"""

import sys
import click
from rich.console import Console
from rich.panel import Panel

from plexiq import __version__
from plexiq.config import get_config, reset_config
from plexiq.logger import get_logger, reset_logger


# Initialize Rich console for output
console = Console()


class PlexIQCLI(click.MultiCommand):
    """
    Custom CLI class that auto-discovers commands from commands/ directory.
    Implements command registry for CLI/GUI parity (Rule #2).
    """

    def list_commands(self, ctx):
        """List all available commands."""
        commands = [
            'analyze',
            'backup',
            'collect',
            'config',
            'delete',
            'gui',
            'setup',
            'web',
        ]
        return sorted(commands)

    def get_command(self, ctx, name):
        """Load command module dynamically."""
        try:
            if name == 'analyze':
                from plexiq.commands.analyze import analyze
                return analyze
            elif name == 'collect':
                from plexiq.commands.collect import collect
                return collect
            elif name == 'delete':
                from plexiq.commands.delete import delete
                return delete
            elif name == 'backup':
                from plexiq.commands.backup import backup
                return backup
            elif name == 'config':
                from plexiq.commands.config import config
                return config
            elif name == 'gui':
                from plexiq.commands.gui_cmd import gui
                return gui
            elif name == 'setup':
                from plexiq.commands.setup import setup
                return setup
            elif name == 'web':
                from plexiq.commands.web_cmd import web
                return web
        except ImportError as e:
            console.print(f"[red]Error loading command '{name}': {e}[/red]")
            return None


@click.command(cls=PlexIQCLI, context_settings={'help_option_names': ['-h', '--help']})
@click.version_option(version=__version__, prog_name='PlexIQ')
@click.option(
    '--config-file',
    type=click.Path(exists=True),
    help='Path to .env configuration file',
    envvar='PLEXIQ_CONFIG'
)
@click.option(
    '--log-level',
    type=click.Choice(['DEBUG', 'INFO', 'WARNING', 'ERROR'], case_sensitive=False),
    help='Override log level'
)
@click.pass_context
def cli(ctx, config_file, log_level):
    """
    PlexIQ v3.2 - Smart Plex Media Library Management

    A safety-first tool for analyzing and managing your Plex media library.

    Commands:
      setup     - Configure Plex authentication (run this first!)
      collect   - Collect metadata from Plex library
      analyze   - Analyze items and compute deletion scores
      delete    - Delete items (dry-run by default)
      backup    - Manage backups and operation records
      config    - View and validate configuration
      gui       - Launch GUI interface
      web       - Launch web interface

    Examples:
      plexiq setup                    # First-time setup
      plexiq collect Movies --enrich
      plexiq analyze Movies --show-recommended
      plexiq delete Movies --dry-run
      plexiq gui                       # Desktop GUI
      plexiq web                       # Web interface

    Safety Features (Rule #1):
      • All destructive operations default to --dry-run
      • Explicit --execute flag required for actual deletion
      • Automatic backups before any operation
      • Detailed logging and audit trail
    """
    # Ensure we have a context object
    ctx.ensure_object(dict)

    # Check if the command being run is 'setup' or 'web'
    is_setup_command = ctx.invoked_subcommand == 'setup'
    is_web_command = ctx.invoked_subcommand == 'web'

    try:
        # Load configuration (don't require token for setup/web commands)
        config = get_config(config_file, require_token=not (is_setup_command or is_web_command))

        # Check for token if not running setup/web command
        if not is_setup_command and not is_web_command:
            # Try to load token from ~/.plexiq/config.json first
            from plexiq.token_installer import TokenInstaller
            installer = TokenInstaller()
            has_token_in_file, _ = installer.check_existing_token()

            # Check if token exists in config or file
            has_token = config.has_valid_token() if hasattr(config, 'has_valid_token') else False

            if not has_token and not has_token_in_file:
                console.print(Panel(
                    "[yellow]⚠️  No Plex token configured![/yellow]\n\n"
                    "PlexIQ needs your Plex authentication token to access your library.\n\n"
                    "Run: [cyan]plexiq setup --execute[/cyan] to configure your token.",
                    title="Setup Required",
                    border_style="yellow"
                ))
                console.print("\n[dim]Tip: The setup wizard will guide you through the process.[/dim]\n")
                sys.exit(1)

        # Override log level if specified
        if log_level:
            config.set('app.log_level', log_level.upper())
            reset_logger()  # Reinitialize with new level

        logger = get_logger()

        # Store in context for subcommands
        ctx.obj['config'] = config
        ctx.obj['logger'] = logger

    except ValueError as e:
        # Check if this is the token error
        if "PLEX_TOKEN not set" in str(e):
            console.print(Panel(
                "[yellow]⚠️  No Plex token configured![/yellow]\n\n"
                "PlexIQ needs your Plex authentication token to access your library.\n\n"
                "Run: [cyan]plexiq setup --execute[/cyan] to configure your token.",
                title="Setup Required",
                border_style="yellow"
            ))
            console.print("\n[dim]Tip: The setup wizard will guide you through the process.[/dim]\n")
        else:
            console.print(Panel(
                f"[red]Configuration Error:[/red]\n{e}\n\n"
                "Please check your .env file. See .env.example for reference.",
                title="PlexIQ Configuration Error",
                border_style="red"
            ))
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]Initialization Error: {e}[/red]")
        sys.exit(1)


def main():
    """Main entry point for CLI."""
    try:
        cli(obj={})
    except KeyboardInterrupt:
        console.print("\n[yellow]Operation cancelled by user[/yellow]")
        sys.exit(130)
    except Exception as e:
        console.print(f"[red]Fatal error: {e}[/red]")
        sys.exit(1)


if __name__ == '__main__':
    main()