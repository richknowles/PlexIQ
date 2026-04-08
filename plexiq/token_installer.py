"""
PlexIQ v3.1 Guided Token Installer
Secure token acquisition, validation, and storage system.
Author: Rich Knowles (via Claude-Code)
Safety: Dry-run mode until token is validated. No destructive operations.
"""

import json
import os
import re
import stat
from pathlib import Path
from typing import Dict, Optional, Tuple
from urllib.parse import parse_qs, urlparse

import requests
from plexapi.server import PlexServer


class TokenInstaller:
    """
    Manages Plex token acquisition, validation, and secure storage.
    Implements dry-run-first approach - no operations until token validated.
    """

    PLEX_TV_LOGIN_URL = "https://app.plex.tv/auth#!"
    PLEX_API_VALIDATE_URL = "https://plex.tv/api/v2/user"
    CONFIG_DIR = Path.home() / ".plexiq"
    CONFIG_FILE = CONFIG_DIR / "config.json"

    def __init__(self, dry_run: bool = True):
        """
        Initialize token installer.

        Args:
            dry_run: Enable dry-run mode (default True for safety)
        """
        self.dry_run = dry_run
        self._ensure_config_dir()

    def _ensure_config_dir(self) -> None:
        """Create config directory if it doesn't exist."""
        self.CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        # Set restrictive permissions (700 - owner only)
        os.chmod(self.CONFIG_DIR, stat.S_IRWXU)

    def check_existing_token(self) -> Tuple[bool, Optional[str]]:
        """
        Check if valid token exists in config.

        Returns:
            Tuple of (is_valid, token_or_error_message)
        """
        if not self.CONFIG_FILE.exists():
            return False, "No configuration file found"

        try:
            with open(self.CONFIG_FILE, 'r') as f:
                config = json.load(f)

            token = config.get('plex', {}).get('token')
            if not token:
                return False, "No token in configuration"

            # Validate token
            is_valid, message = self.validate_token(token)
            return is_valid, token if is_valid else message

        except (json.JSONDecodeError, IOError) as e:
            return False, f"Error reading config: {e}"

    def validate_token(self, token: str, plex_url: str = None) -> Tuple[bool, str]:
        """
        Validate Plex token via lightweight API call.

        Args:
            token: Plex authentication token
            plex_url: Optional Plex server URL (defaults to plex.tv)

        Returns:
            Tuple of (is_valid, message)
        """
        if not token or len(token) < 10:
            return False, "Token appears invalid (too short)"

        try:
            # Method 1: Validate against plex.tv API
            headers = {
                'X-Plex-Token': token,
                'Accept': 'application/json'
            }
            response = requests.get(
                self.PLEX_API_VALIDATE_URL,
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                user_data = response.json()
                username = user_data.get('username', 'Unknown')
                email = user_data.get('email', 'Unknown')
                return True, f"Valid token for user: {username} ({email})"

            elif response.status_code == 401:
                return False, "Token is invalid or expired"
            else:
                return False, f"Validation failed with status {response.status_code}"

        except requests.RequestException as e:
            # If plex.tv is unreachable, try local server if URL provided
            if plex_url:
                try:
                    server = PlexServer(plex_url, token)
                    return True, f"Valid token for server: {server.friendlyName}"
                except Exception as server_error:
                    return False, f"Token validation failed: {server_error}"

            return False, f"Network error during validation: {e}"

    def extract_token_from_url(self, url: str) -> Optional[str]:
        """
        Extract Plex token from callback URL.

        Args:
            url: Callback URL from Plex login

        Returns:
            Extracted token or None
        """
        # Try to extract from URL fragments or query parameters
        parsed = urlparse(url)

        # Check query parameters
        query_params = parse_qs(parsed.query)
        if 'authToken' in query_params:
            return query_params['authToken'][0]

        # Check fragment (after #)
        if parsed.fragment:
            fragment_params = parse_qs(parsed.fragment)
            if 'authToken' in fragment_params:
                return fragment_params['authToken'][0]

        # Try regex pattern matching for token-like strings (20 chars alphanumeric)
        token_pattern = r'[a-zA-Z0-9_-]{20,}'
        matches = re.findall(token_pattern, url)
        if matches:
            # Return longest match (likely the token)
            return max(matches, key=len)

        return None

    def save_token(
        self,
        token: str,
        plex_url: str = "http://localhost:32400",
        validate: bool = True
    ) -> Tuple[bool, str]:
        """
        Save token to secure config file.

        Args:
            token: Plex authentication token
            plex_url: Plex server URL
            validate: Validate token before saving

        Returns:
            Tuple of (success, message)
        """
        # Validate token if requested
        if validate:
            is_valid, message = self.validate_token(token, plex_url)
            if not is_valid:
                return False, f"Token validation failed: {message}"

        # Dry-run check
        if self.dry_run:
            return True, f"[DRY-RUN] Would save token to {self.CONFIG_FILE}"

        try:
            # Load existing config or create new
            config = {}
            if self.CONFIG_FILE.exists():
                with open(self.CONFIG_FILE, 'r') as f:
                    config = json.load(f)

            # Update Plex configuration
            if 'plex' not in config:
                config['plex'] = {}

            config['plex']['token'] = token
            config['plex']['url'] = plex_url

            # Write config with secure permissions
            with open(self.CONFIG_FILE, 'w') as f:
                json.dump(config, f, indent=2)

            # Set restrictive file permissions (600 - owner read/write only)
            os.chmod(self.CONFIG_FILE, stat.S_IRUSR | stat.S_IWUSR)

            return True, f"Token saved successfully to {self.CONFIG_FILE}"

        except (IOError, json.JSONDecodeError) as e:
            return False, f"Error saving token: {e}"

    def get_manual_instructions(self) -> str:
        """
        Get manual token retrieval instructions.

        Returns:
            Formatted instructions for manual token retrieval
        """
        return """
 ╔══════════════════════════════════════════════════════════════════╗
 ║          Manual Plex Token Retrieval Instructions                ║
 ╚══════════════════════════════════════════════════════════════════╝

EASY METHOD - After signing in to Plex in your browser:
─────────────────────────────────────────────
1. Go to: https://app.plex.tv/desktop
2. Sign in if needed
3. Look at the URL in your browser's address bar
4. The token is the long string after 'token=' in the URL
5. Copy just the token part (letters and numbers only)

ALTERNATIVE - Via Browser Developer Tools
────────────────────────────────────
1. While signed in to Plex, press F12 (or Ctrl+Shift+I)
2. Click on "Application" tab (Chrome/Edge) or "Storage" (Firefox)
3. Click "Cookies" → "https://app.plex.tv"
4. Find and click on "X-Plex-Token" cookie
5. Copy the value shown in the right panel

ALTERNATIVE - Via Plex XML
──────────────────────
1. Visit: https://plex.tv/pms/servers.xml
2. Look for the "authToken" attribute in the XML
3. Copy the token value between the quotes

NEED HELP? Try this:
─────────────────
• Visit: https://support.plex.tv/articles/ obtaining-your-plex-token/
• Search: "how to find my Plex token" on Google

⚠️  Security Note:
   Your Plex token provides full access to your account.
   Never share it publicly or commit it to version control.

Once you have your token, paste it when prompted.
"""

    def load_config(self) -> Optional[Dict]:
        """
        Load existing configuration.

        Returns:
            Configuration dict or None if not found
        """
        if not self.CONFIG_FILE.exists():
            return None

        try:
            with open(self.CONFIG_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None

    def get_token_from_env(self) -> Optional[str]:
        """
        Check for token in environment variables.

        Returns:
            Token from PLEX_TOKEN env var or None
        """
        return os.getenv('PLEX_TOKEN')

    def interactive_token_input(self, max_attempts: int = 3) -> Tuple[bool, str]:
        """
        Prompt user for manual token input with validation.

        Args:
            max_attempts: Maximum number of input attempts

        Returns:
            Tuple of (success, token_or_message)
        """
        print("\n" + "="*70)
        print("  Plex Token Required")
        print("="*70)
        print("\nPlexIQ needs your Plex authentication token to access your library.")
        print("This token will be stored securely in ~/.plexiq/config.json")

        for attempt in range(1, max_attempts + 1):
            print(f"\nAttempt {attempt}/{max_attempts}")
            token = input("Enter your Plex token (or 'help' for instructions, 'quit' to exit): ").strip()

            if token.lower() == 'quit':
                return False, "Setup cancelled by user"

            if token.lower() == 'help':
                print(self.get_manual_instructions())
                continue

            if not token:
                print("❌ Token cannot be empty")
                continue

            # Validate token
            print(f"\n🔍 Validating token...")
            is_valid, message = self.validate_token(token)

            if is_valid:
                print(f"✅ {message}")

                # Ask for Plex server URL
                default_url = "http://localhost:32400"
                plex_url = input(f"\nEnter your Plex server URL [{default_url}]: ").strip()
                if not plex_url:
                    plex_url = default_url

                # Save token
                success, save_message = self.save_token(token, plex_url, validate=False)
                if success:
                    print(f"✅ {save_message}")
                    return True, token
                else:
                    print(f"❌ {save_message}")
                    return False, save_message
            else:
                print(f"❌ {message}")

        return False, "Maximum attempts exceeded"


# Convenience functions for easy integration

def check_token_or_install(dry_run: bool = True) -> bool:
    """
    Check for valid token, trigger installer if missing.

    Args:
        dry_run: Enable dry-run mode

    Returns:
        True if valid token exists/installed, False otherwise
    """
    installer = TokenInstaller(dry_run=dry_run)

    # Check existing token
    is_valid, message = installer.check_existing_token()

    if is_valid:
        return True

    # Token missing/invalid - trigger installer
    return False


def get_valid_token() -> Optional[str]:
    """
    Get valid Plex token from config or environment.

    Returns:
        Valid token or None
    """
    installer = TokenInstaller()

    # Check config file first
    is_valid, result = installer.check_existing_token()
    if is_valid:
        return result

    # Check environment variable
    env_token = installer.get_token_from_env()
    if env_token:
        is_valid, _ = installer.validate_token(env_token)
        if is_valid:
            return env_token

    return None
