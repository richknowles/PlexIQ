"""
PlexIQ v3 - GUI Launch Command
Launch the PyQt GUI interface.
Author: Rich Knowles (via Claude-Code)
"""

import sys
import click
from rich.console import Console

console = Console()


@click.command()
@click.option(
    '--library',
    help='Auto-select library on startup'
)
@click.pass_context
def gui(ctx, library):
    """
    Launch the PlexIQ GUI interface.

    The GUI provides full feature parity with CLI commands (Rule #2).

    Examples:
      plexiq gui
      plexiq gui --library Movies
    """
    config = ctx.obj['config']
    logger = ctx.obj['logger']

    try:
        # Import PyQt6 components
        from PyQt6.QtWidgets import QApplication
        from plexiq.gui.main_window import PlexIQMainWindow

        # Create Qt application
        app = QApplication(sys.argv)
        app.setApplicationName("PlexIQ v3")
        app.setOrganizationName("PlexIQ")

        # Create main window
        window = PlexIQMainWindow(config=config, logger=logger, initial_library=library)
        window.show()

        # Run application
        sys.exit(app.exec())

    except ImportError as e:
        console.print(f"[red]GUI dependencies not installed: {e}[/red]")
        console.print("\nInstall GUI dependencies with:")
        console.print("  pip install PyQt6")
        raise click.ClickException("GUI dependencies missing")
    except Exception as e:
        logger.error(f"Failed to launch GUI: {e}")
        raise click.ClickException(str(e))
