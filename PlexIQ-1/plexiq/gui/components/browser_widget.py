"""
PlexIQ v3.1 Browser Widget for Token Capture
Embedded browser for secure Plex authentication.
Author: Rich Knowles (via Claude-Code)
Safety: Captures token securely without exposing credentials.
"""

from typing import Optional, Callable

from PyQt6.QtCore import QUrl, pyqtSignal
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton, QMessageBox
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEnginePage, QWebEngineProfile

from plexiq.token_installer import TokenInstaller


class PlexBrowserWidget(QWidget):
    """
    Embedded browser widget for Plex authentication.
    Monitors URL changes and cookies to capture authentication token.
    """

    # Signal emitted when token is captured
    token_captured = pyqtSignal(str)  # Emits the token

    # Signal emitted when user cancels
    cancelled = pyqtSignal()

    def __init__(self, parent: Optional[QWidget] = None):
        """
        Initialize browser widget.

        Args:
            parent: Parent widget
        """
        super().__init__(parent)
        self.installer = TokenInstaller()
        self.captured_token: Optional[str] = None
        self._init_ui()

    def _init_ui(self) -> None:
        """Initialize user interface."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Instructions label
        instructions = QLabel(
            "<b>Plex Authentication</b><br>"
            "Sign in with your Plex account. The token will be captured automatically."
        )
        instructions.setStyleSheet("padding: 10px; background-color: #2c3e50; color: white;")
        layout.addWidget(instructions)

        # Web browser view
        self.browser = QWebEngineView()
        self.browser.setMinimumSize(800, 600)

        # Custom page to intercept cookies and URLs
        self.page = TokenCapturePage(self.browser.profile(), self.browser)
        self.browser.setPage(self.page)

        # Connect signals
        self.page.urlChanged.connect(self._on_url_changed)
        self.page.token_found.connect(self._on_token_found)

        layout.addWidget(self.browser)

        # Control buttons
        button_layout = QVBoxLayout()

        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.clicked.connect(self._on_cancel)
        button_layout.addWidget(self.cancel_button)

        self.manual_button = QPushButton("Manual Token Entry")
        self.manual_button.clicked.connect(self._on_manual_entry)
        button_layout.addWidget(self.manual_button)

        layout.addLayout(button_layout)

        # Load Plex login page
        self.browser.load(QUrl(self.installer.PLEX_TV_LOGIN_URL))

    def _on_url_changed(self, url: QUrl) -> None:
        """
        Handle URL changes to detect token in redirect URLs.

        Args:
            url: New URL
        """
        url_string = url.toString()

        # Try to extract token from URL
        token = self.installer.extract_token_from_url(url_string)

        if token and not self.captured_token:
            self._validate_and_emit_token(token)

    def _on_token_found(self, token: str) -> None:
        """
        Handle token found in cookies.

        Args:
            token: Captured token
        """
        if token and not self.captured_token:
            self._validate_and_emit_token(token)

    def _validate_and_emit_token(self, token: str) -> None:
        """
        Validate and emit captured token.

        Args:
            token: Token to validate
        """
        # Validate token
        is_valid, message = self.installer.validate_token(token)

        if is_valid:
            self.captured_token = token
            QMessageBox.information(
                self,
                "Token Captured",
                f"✅ Valid token captured!\n\n{message}"
            )
            self.token_captured.emit(token)
        else:
            QMessageBox.warning(
                self,
                "Invalid Token",
                f"❌ Token validation failed:\n\n{message}"
            )

    def _on_cancel(self) -> None:
        """Handle cancel button click."""
        reply = QMessageBox.question(
            self,
            "Cancel Setup",
            "Are you sure you want to cancel token installation?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            self.cancelled.emit()

    def _on_manual_entry(self) -> None:
        """Handle manual entry button click."""
        from PyQt6.QtWidgets import QInputDialog

        token, ok = QInputDialog.getText(
            self,
            "Manual Token Entry",
            "Paste your Plex authentication token:",
        )

        if ok and token:
            self._validate_and_emit_token(token.strip())


class TokenCapturePage(QWebEnginePage):
    """
    Custom web page that monitors cookies and URLs for token capture.
    """

    # Signal emitted when token is found in cookies
    token_found = pyqtSignal(str)

    def __init__(self, profile: QWebEngineProfile, parent: Optional[QWidget] = None):
        """
        Initialize custom page.

        Args:
            profile: Web engine profile
            parent: Parent widget
        """
        super().__init__(profile, parent)
        self.profile = profile
        self._monitoring = True

        # Monitor cookies
        self._setup_cookie_monitoring()

    def _setup_cookie_monitoring(self) -> None:
        """Set up cookie monitoring for token capture."""
        # Use cookie store to monitor cookies
        cookie_store = self.profile.cookieStore()
        cookie_store.cookieAdded.connect(self._on_cookie_added)

    def _on_cookie_added(self, cookie) -> None:
        """
        Handle new cookie added.

        Args:
            cookie: QNetworkCookie object
        """
        if not self._monitoring:
            return

        # Check for Plex token cookies
        cookie_name = cookie.name().data().decode('utf-8')
        cookie_value = cookie.value().data().decode('utf-8')

        # Common Plex token cookie names
        token_cookie_names = [
            'X-Plex-Token',
            'auth_token',
            'authToken',
            'plex_token'
        ]

        if cookie_name in token_cookie_names and len(cookie_value) > 10:
            self._monitoring = False  # Stop monitoring after first token
            self.token_found.emit(cookie_value)

    def stop_monitoring(self) -> None:
        """Stop cookie monitoring."""
        self._monitoring = False


class SimpleBrowserWidget(QWidget):
    """
    Simplified browser widget that just opens system browser.
    Fallback for when PyQtWebEngine is not available.
    """

    token_captured = pyqtSignal(str)
    cancelled = pyqtSignal()

    def __init__(self, parent: Optional[QWidget] = None):
        """
        Initialize simple browser widget.

        Args:
            parent: Parent widget
        """
        super().__init__(parent)
        self.installer = TokenInstaller()
        self._init_ui()

    def _init_ui(self) -> None:
        """Initialize user interface."""
        import webbrowser

        layout = QVBoxLayout(self)

        # Instructions
        instructions = QLabel(
            "<h2>Browser-Based Token Retrieval</h2>"
            "<p>Click the button below to open Plex login in your system browser.</p>"
            "<p>After signing in, copy the token and paste it below.</p>"
        )
        instructions.setWordWrap(True)
        layout.addWidget(instructions)

        # Open browser button
        open_button = QPushButton("Open Plex Login in Browser")
        open_button.clicked.connect(
            lambda: webbrowser.open(self.installer.PLEX_TV_LOGIN_URL)
        )
        layout.addWidget(open_button)

        # Manual instructions
        from PyQt6.QtWidgets import QTextEdit
        manual_instructions = QTextEdit()
        manual_instructions.setReadOnly(True)
        manual_instructions.setPlainText(self.installer.get_manual_instructions())
        manual_instructions.setMaximumHeight(200)
        layout.addWidget(manual_instructions)

        # Token input
        from PyQt6.QtWidgets import QLineEdit, QHBoxLayout

        input_layout = QHBoxLayout()
        self.token_input = QLineEdit()
        self.token_input.setPlaceholderText("Paste your Plex token here...")
        self.token_input.setEchoMode(QLineEdit.EchoMode.Password)
        input_layout.addWidget(self.token_input)

        validate_button = QPushButton("Validate & Use")
        validate_button.clicked.connect(self._validate_token)
        input_layout.addWidget(validate_button)

        layout.addLayout(input_layout)

        # Cancel button
        cancel_button = QPushButton("Cancel")
        cancel_button.clicked.connect(lambda: self.cancelled.emit())
        layout.addWidget(cancel_button)

        layout.addStretch()

    def _validate_token(self) -> None:
        """Validate entered token."""
        token = self.token_input.text().strip()

        if not token:
            QMessageBox.warning(self, "No Token", "Please enter a token first.")
            return

        # Validate
        is_valid, message = self.installer.validate_token(token)

        if is_valid:
            QMessageBox.information(self, "Valid Token", f"✅ {message}")
            self.token_captured.emit(token)
        else:
            QMessageBox.warning(self, "Invalid Token", f"❌ {message}")
