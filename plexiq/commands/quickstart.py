"""
PlexIQ v3.1 Quickstart Command
Streamlined first-run setup for non-technical users.
Author: Rich Knowles (via Claude-Code)
"""

import sys
import webbrowser

import click
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt

from plexiq.token_installer import TokenInstaller


console = Console()


@click.command()
@click.option(
    '--skip-browser',
    is_flag=True,
    help='Skip browser opening, use manual entry'
)
@click.pass_context
def quickstart(ctx, skip_browser):
    """
    PlexIQ Quickstart - Get started in under 2 minutes!
    
    This command provides a streamlined first-run experience:
    1. Opens Plex login in your browser
    2. Captures your token automatically
    3. Validates and saves configuration
    
    Perfect for first-time users or after a fresh install.
    
    Examples:
      plexiq quickstart           # Recommended (opens browser)
      plexiq quickstart --skip-browser  # Manual token entry
    """
    console.print("\n")
    console.print(Panel.fit(
        "[bold cyan]PlexIQ Quickstart[/bold cyan]\n"
        "Let's get you up and running in under 2 minutes!",
        border_style="cyan"
    ))
    
    installer = TokenInstaller(dry_run=False)
    
    # Check for existing valid token
    is_valid, result = installer.check_existing_token()
    if is_valid:
        console.print(Panel(
            f"[green]✅ You already have a valid token![/green]\n\n"
            f"Current token: {result}\n\n"
            "Ready to use PlexIQ:\n"
            "  • plexiq collect Movies\n"
            "  • plexiq analyze Movies\n"
            "  • plexiq gui",
            title="Already Configured",
            border_style="green"
        ))
        return
    
    # Run quickstart workflow
    success = _run_quickstart_workflow(installer, skip_browser=skip_browser)
    
    if success:
        console.print(Panel(
            "[green]🎉 You're all set![/green]\n\n"
            "PlexIQ is ready to use. Try these commands:\n\n"
            "1. [cyan]plexiq collect Movies[/cyan]\n"
            "   Collect metadata from your Plex library\n\n"
            "2. [cyan]plexiq analyze Movies[/cyan]\n"
            "   See which files can be safely removed\n\n"
            "3. [cyan]plexiq gui[/cyan]\n"
            "   Open the graphical interface",
            title="Quickstart Complete!",
            border_style="green"
        ))
        console.print("\n[dim]Tip: All delete operations are dry-run by default.[/dim]\n")
        sys.exit(0)
    else:
        console.print("\n")
        console.print(Panel(
            "[red]❌ Quickstart incomplete[/red]\n\n"
            "Run 'plexiq quickstart' to try again, or\n"
            "run 'plexiq setup --execute' for more options.",
            title="Setup Incomplete",
            border_style="red"
        ))
        sys.exit(1)


def _run_quickstart_workflow(installer: TokenInstaller, skip_browser: bool = False) -> bool:
    """
    Run the streamlined quickstart workflow.
    
    Args:
        installer: TokenInstaller instance
        skip_browser: Whether to skip browser opening
    
    Returns:
        True if successful
    """
    if not skip_browser:
        console.print("\n[cyan]Step 1:[/cyan] Opening Plex login in your browser...")
        
        login_url = installer.PLEX_TV_LOGIN_URL
        try:
            webbrowser.open(login_url)
            console.print(f"[green]✓[/green] Opened {login_url}\n")
        except Exception as e:
            console.print(f"[yellow]⚠[/yellow] Couldn't open browser: {e}\n")
            console.print("I'll show you manual instructions instead.\n")
    
    console.print("[cyan]Step 2:[/cyan] Get your Plex token")
    
    if not skip_browser:
        console.print(Panel(
            "[bold]In your browser:[/bold]\n\n"
            "1. Sign in to Plex (if not already signed in)\n"
            "2. After signing in, look at the address bar\n"
            "3. You'll see a URL with 'authToken=' in it\n"
            "4. Copy the token value (the long string of letters/numbers)\n\n"
            "[dim]For more help, see: https://support.plex.tv/articles/ obtaining-play-methods/[ /dim]",
            title="Token Instructions",
            border_style="cyan"
        ))
    else:
        console.print(Panel(
            "[bold]Manual Token Retrieval:[/bold]\n\n"
            "Option 1: Via browser DevTools\n"
            "  • Press F12 → Application tab\n"
            "  → Cookies → app.plex.tv\n"
            "  → Find 'X-Plex-Token' cookie\n\n"
            "Option 2: Visit https://plex.tv/pms/servers.xml\n"
            "  → Find 'authToken' in the XML",
            title="How to Get Your Token",
            border_style="cyan"
        ))
    
    # Simple prompt for token
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        console.print(f"\n[cyan]Attempt {attempt}/{max_attempts}[/cyan]")
        
        token = Prompt.ask(
            "Paste your Plex token (or press Enter to open instructions)",
            default=""
        ).strip()
        
        if not token:
            console.print("\n[yellow]Here's how to find your token:[/yellow]")
            console.print(installer.get_manual_instructions())
            continue
        
        # Try extracting from URL if it's a URL
        if "http" in token or "plex" in token:
            extracted = installer.extract_token_from_url(token)
            if extracted:
                token = extracted
                console.print(f"[green]✓[/green] Extracted token")
        
        # Validate
        console.print("[cyan]Validating token...[/cyan]")
        is_valid, message = installer.validate_token(token)
        
        if is_valid:
            console.print(f"[green]✓[/green] {message}")
            
            # Quick save with default server URL
            success, save_msg = installer.save_token(token, "http://localhost:32400", validate=False)
            
            if success:
                console.print(f"[green]✓[/green] {save_msg}")
                return True
            else:
                console.print(f"[red]✗[/red] {save_msg}")
                return False
        else:
            console.print(f"[red]✗[/red] {message}")
            if attempt < max_attempts:
                if not Confirm.ask("Try again?", default=True):
                    return False
    
    return False