"""
PlexIQ v3.1 Setup Command
Interactive CLI for guided token installation.
Author: Rich Knowles (via Claude-Code)
Safety: Dry-run mode until token validated.
"""

import sys
import webbrowser
from typing import Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt
from rich.markdown import Markdown

from plexiq.token_installer import TokenInstaller


console = Console()


@click.command()
@click.option(
    '--dry-run',
    is_flag=True,
    default=True,
    help='Dry-run mode (default: enabled for safety)'
)
@click.option(
    '--execute',
    is_flag=True,
    help='Execute mode - actually save the token'
)
@click.option(
    '--validate-only',
    is_flag=True,
    help='Only validate existing token, do not install'
)
@click.option(
    '--force',
    is_flag=True,
    help='Force reinstallation even if valid token exists'
)
@click.pass_context
def setup(ctx, dry_run, execute, validate_only, force):
    """
    Guided Plex token installation and validation.

    This command helps you securely configure PlexIQ with your Plex
    authentication token. It provides multiple methods:

    1. Interactive browser-based token retrieval (recommended)
    2. Manual token input with validation
    3. Validation of existing tokens

    Examples:
      plexiq setup                    # Dry-run mode (safe preview)
      plexiq setup --execute          # Actually save the token
      plexiq setup --validate-only    # Check existing token
      plexiq setup --force --execute  # Reinstall token

    Safety Features:
      • Dry-run mode by default
      • Token validation before saving
      • Secure file permissions (600)
      • Never exposes tokens in logs
    """
    # Determine actual dry-run state
    actual_dry_run = dry_run and not execute

    console.print("\n")
    console.print(Panel.fit(
        "[bold cyan]PlexIQ v3.1 Guided Token Installer[/bold cyan]\n"
        "Secure Plex authentication setup",
        border_style="cyan"
    ))

    installer = TokenInstaller(dry_run=actual_dry_run)

    # Validate-only mode
    if validate_only:
        _validate_existing_token(installer)
        return

    # Check for existing token
    if not force:
        is_valid, result = installer.check_existing_token()
        if is_valid:
            console.print(Panel(
                f"[green]✅ Valid token already configured![/green]\n\n"
                f"Token validation: {result}\n"
                f"Config location: {installer.CONFIG_FILE}\n\n"
                "Use --force to reinstall or --validate-only to revalidate.",
                title="Token Already Configured",
                border_style="green"
            ))
            return
        else:
            console.print(f"[yellow]⚠️  {result}[/yellow]")

    # Show mode
    if actual_dry_run:
        console.print("[yellow]🔒 DRY-RUN MODE[/yellow] - No changes will be saved")
        console.print("Use --execute to actually save the token\n")

    # Installation workflow
    success = _run_installation_workflow(installer, actual_dry_run)

    if success:
        console.print("\n")
        console.print(Panel(
            "[green]✅ Token installation successful![/green]\n\n"
            "You can now use PlexIQ commands:\n"
            "  • plexiq collect Movies --enrich\n"
            "  • plexiq analyze Movies --show-recommended\n"
            "  • plexiq gui",
            title="Setup Complete",
            border_style="green"
        ))
        sys.exit(0)
    else:
        console.print("\n")
        console.print(Panel(
            "[red]❌ Token installation failed[/red]\n\n"
            "Please try again or contact support if the issue persists.",
            title="Setup Failed",
            border_style="red"
        ))
        sys.exit(1)


def _validate_existing_token(installer: TokenInstaller) -> None:
    """Validate existing token and display results."""
    console.print("\n[cyan]🔍 Checking existing token...[/cyan]\n")

    is_valid, result = installer.check_existing_token()

    if is_valid:
        console.print(Panel(
            f"[green]✅ Token is valid![/green]\n\n"
            f"Validation result: {result}\n"
            f"Config location: {installer.CONFIG_FILE}",
            title="Token Validation Success",
            border_style="green"
        ))
    else:
        console.print(Panel(
            f"[red]❌ Token validation failed[/red]\n\n"
            f"Error: {result}\n\n"
            "Run 'plexiq setup --execute' to install a new token.",
            title="Token Validation Failed",
            border_style="red"
        ))
        sys.exit(1)


def _run_installation_workflow(installer: TokenInstaller, dry_run: bool) -> bool:
    """
    Run the interactive token installation workflow.

    Args:
        installer: TokenInstaller instance
        dry_run: Whether in dry-run mode

    Returns:
        True if installation successful
    """
    console.print("\n[cyan]Choose installation method:[/cyan]\n")
    console.print("1. Browser-based token retrieval (recommended)")
    console.print("2. Manual token input")
    console.print("3. View manual instructions")
    console.print("4. Cancel\n")

    choice = Prompt.ask(
        "Select method",
        choices=["1", "2", "3", "4"],
        default="1"
    )

    if choice == "1":
        return _browser_based_installation(installer, dry_run)
    elif choice == "2":
        return _manual_token_installation(installer)
    elif choice == "3":
        _show_manual_instructions(installer)
        # After showing instructions, prompt for manual input
        if Confirm.ask("\nWould you like to enter your token now?"):
            return _manual_token_installation(installer)
        return False
    else:
        console.print("[yellow]Setup cancelled[/yellow]")
        return False


def _browser_based_installation(installer: TokenInstaller, dry_run: bool) -> bool:
    """
    Browser-based token retrieval workflow.

    Args:
        installer: TokenInstaller instance
        dry_run: Whether in dry-run mode

    Returns:
        True if successful
    """
    console.print("\n[cyan]📱 Browser-Based Token Retrieval[/cyan]\n")
    console.print("This will open Plex login page in your browser.")
    console.print("After signing in, you'll need to copy the authentication token.\n")

    if not Confirm.ask("Open browser now?", default=True):
        console.print("[yellow]Browser launch cancelled[/yellow]")
        return _manual_token_installation(installer)

    # Open Plex login page
    login_url = installer.PLEX_TV_LOGIN_URL
    console.print(f"\n[cyan]Opening:[/cyan] {login_url}")

    try:
        webbrowser.open(login_url)
        console.print("[green]✅ Browser opened successfully[/green]\n")
    except Exception as e:
        console.print(f"[red]❌ Failed to open browser: {e}[/red]\n")
        return _manual_token_installation(installer)

    # Instructions for retrieving token from browser
    console.print(Panel(
        "[bold]After signing in to Plex:[/bold]\n\n"
        "1. Open Developer Tools (F12 or Ctrl+Shift+I)\n"
        "2. Go to 'Application' or 'Storage' tab\n"
        "3. Look for Cookies → https://app.plex.tv\n"
        "4. Find cookie named 'X-Plex-Token'\n"
        "5. Copy the token value\n\n"
        "[yellow]Alternative:[/yellow] Copy the full URL after redirect",
        title="Token Retrieval Instructions",
        border_style="cyan"
    ))

    # Prompt for token or URL
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        console.print(f"\n[cyan]Attempt {attempt}/{max_attempts}[/cyan]")

        token_input = Prompt.ask(
            "Paste your token or callback URL",
            default=""
        ).strip()

        if not token_input:
            if not Confirm.ask("No input provided. Try again?", default=True):
                return False
            continue

        # Try to extract token from URL if needed
        if "http" in token_input or "/" in token_input:
            console.print("[cyan]Detected URL, extracting token...[/cyan]")
            extracted_token = installer.extract_token_from_url(token_input)
            if extracted_token:
                token = extracted_token
                console.print(f"[green]✅ Extracted token: {token[:8]}...{token[-4:]}[/green]")
            else:
                console.print("[red]❌ Could not extract token from URL[/red]")
                continue
        else:
            token = token_input

        # Validate token
        console.print("\n[cyan]🔍 Validating token...[/cyan]")
        is_valid, message = installer.validate_token(token)

        if is_valid:
            console.print(f"[green]✅ {message}[/green]\n")

            # Get Plex server URL
            default_url = "http://localhost:32400"
            plex_url = Prompt.ask(
                "Enter your Plex server URL",
                default=default_url
            )

            # Save token
            success, save_message = installer.save_token(
                token,
                plex_url,
                validate=False
            )

            if success:
                console.print(f"[green]✅ {save_message}[/green]")
                return True
            else:
                console.print(f"[red]❌ {save_message}[/red]")
                return False
        else:
            console.print(f"[red]❌ {message}[/red]")
            if not Confirm.ask("Try again?", default=True):
                return False

    console.print("[red]❌ Maximum attempts exceeded[/red]")
    return False


def _manual_token_installation(installer: TokenInstaller) -> bool:
    """
    Manual token input workflow.

    Args:
        installer: TokenInstaller instance

    Returns:
        True if successful
    """
    console.print("\n[cyan]🔑 Manual Token Installation[/cyan]\n")
    console.print("Enter your Plex authentication token.")
    console.print("Type 'help' for retrieval instructions or 'cancel' to quit.\n")

    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        console.print(f"[cyan]Attempt {attempt}/{max_attempts}[/cyan]")

        token = Prompt.ask("Plex token").strip()

        if token.lower() == 'cancel':
            console.print("[yellow]Installation cancelled[/yellow]")
            return False

        if token.lower() == 'help':
            _show_manual_instructions(installer)
            continue

        if not token:
            console.print("[red]❌ Token cannot be empty[/red]")
            continue

        # Validate token
        console.print("\n[cyan]🔍 Validating token...[/cyan]")
        is_valid, message = installer.validate_token(token)

        if is_valid:
            console.print(f"[green]✅ {message}[/green]\n")

            # Get Plex server URL
            default_url = "http://localhost:32400"
            plex_url = Prompt.ask(
                "Enter your Plex server URL",
                default=default_url
            )

            # Save token
            success, save_message = installer.save_token(
                token,
                plex_url,
                validate=False
            )

            if success:
                console.print(f"[green]✅ {save_message}[/green]")
                return True
            else:
                console.print(f"[red]❌ {save_message}[/red]")
                return False
        else:
            console.print(f"[red]❌ {message}[/red]")

    console.print("[red]❌ Maximum attempts exceeded[/red]")
    return False


def _show_manual_instructions(installer: TokenInstaller) -> None:
    """Display manual token retrieval instructions."""
    instructions = installer.get_manual_instructions()
    console.print(instructions)
