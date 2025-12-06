"""
PlexIQ v3.1 GUI Setup Wizard
Modal wizard for guided token installation with step-by-step guidance.
Author: Rich Knowles (via Claude-Code)
Safety: Dry-run mode until token validated. Live validation feedback.
"""

from typing import Optional

from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QStackedWidget, QWidget, QLineEdit, QTextEdit, QMessageBox,
    QRadioButton, QButtonGroup, QProgressBar
)
from PyQt6.QtGui import QFont

from plexiq.token_installer import TokenInstaller

# Try to import browser widget, fallback to simple version
try:
    from plexiq.gui.components.browser_widget import PlexBrowserWidget
    BROWSER_AVAILABLE = True
except ImportError:
    from plexiq.gui.components.browser_widget import SimpleBrowserWidget
    BROWSER_AVAILABLE = False


class SetupWizard(QDialog):
    """
    Multi-step wizard for guided Plex token installation.
    Implements Rule #3 (Clarity & Feedback) with live validation.
    """

    # Signal emitted when setup is complete
    setup_complete = pyqtSignal(str)  # Emits the validated token

    # Pages
    PAGE_WELCOME = 0
    PAGE_METHOD_SELECTION = 1
    PAGE_BROWSER_AUTH = 2
    PAGE_MANUAL_INPUT = 3
    PAGE_SERVER_CONFIG = 4
    PAGE_COMPLETE = 5

    def __init__(self, dry_run: bool = True, parent: Optional[QWidget] = None):
        """
        Initialize setup wizard.

        Args:
            dry_run: Enable dry-run mode (default True)
            parent: Parent widget
        """
        super().__init__(parent)
        self.dry_run = dry_run
        self.installer = TokenInstaller(dry_run=dry_run)
        self.captured_token: Optional[str] = None
        self.plex_url: str = "http://localhost:32400"

        self._init_ui()
        self._apply_styles()

    def _init_ui(self) -> None:
        """Initialize user interface."""
        self.setWindowTitle("PlexIQ Setup Wizard")
        self.setModal(True)
        self.setMinimumSize(700, 500)

        layout = QVBoxLayout(self)

        # Title
        title = QLabel("PlexIQ v3.1 Setup Wizard")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_font = QFont()
        title_font.setPointSize(18)
        title_font.setBold(True)
        title.setFont(title_font)
        layout.addWidget(title)

        # Subtitle
        subtitle = QLabel("Secure Plex Authentication Configuration")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(subtitle)

        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setMaximum(5)
        self.progress_bar.setValue(0)
        self.progress_bar.setStyleSheet(
            "QProgressBar::chunk { background-color: #F4A940; }"  # Mustard color
        )
        layout.addWidget(self.progress_bar)

        # Stacked widget for pages
        self.pages = QStackedWidget()

        # Create pages
        self.pages.addWidget(self._create_welcome_page())
        self.pages.addWidget(self._create_method_selection_page())
        self.pages.addWidget(self._create_browser_auth_page())
        self.pages.addWidget(self._create_manual_input_page())
        self.pages.addWidget(self._create_server_config_page())
        self.pages.addWidget(self._create_complete_page())

        layout.addWidget(self.pages)

        # Navigation buttons
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        self.back_button = QPushButton("← Back")
        self.back_button.clicked.connect(self._go_back)
        self.back_button.setEnabled(False)
        button_layout.addWidget(self.back_button)

        self.next_button = QPushButton("Next →")
        self.next_button.clicked.connect(self._go_next)
        button_layout.addWidget(self.next_button)

        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.clicked.connect(self._on_cancel)
        button_layout.addWidget(self.cancel_button)

        layout.addLayout(button_layout)

        # Start on welcome page
        self._update_navigation()

    def _create_welcome_page(self) -> QWidget:
        """Create welcome page."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Welcome message
        welcome_text = QLabel(
            "<h2>Welcome to PlexIQ!</h2>"
            "<p>This wizard will help you securely configure PlexIQ with your Plex "
            "authentication token.</p>"
            "<h3>What you'll need:</h3>"
            "<ul>"
            "<li>Access to your Plex account</li>"
            "<li>Your Plex server URL (optional, defaults to localhost)</li>"
            "</ul>"
            "<h3>Safety Features:</h3>"
            "<ul>"
            "<li>🔒 Dry-run mode enabled (no changes until validated)</li>"
            "<li>✅ Token validation before saving</li>"
            "<li>🔐 Secure file permissions (600)</li>"
            "<li>🛡️ Never exposes tokens in logs</li>"
            "</ul>"
            "<p><b>Click 'Next' to begin setup.</b></p>"
        )
        welcome_text.setWordWrap(True)
        welcome_text.setTextFormat(Qt.TextFormat.RichText)
        layout.addWidget(welcome_text)

        layout.addStretch()

        return widget

    def _create_method_selection_page(self) -> QWidget:
        """Create method selection page."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Instructions
        instructions = QLabel(
            "<h3>Choose Installation Method</h3>"
            "<p>Select how you'd like to provide your Plex authentication token:</p>"
        )
        instructions.setWordWrap(True)
        instructions.setTextFormat(Qt.TextFormat.RichText)
        layout.addWidget(instructions)

        # Radio buttons for method selection
        self.method_group = QButtonGroup()

        self.browser_radio = QRadioButton(
            "Browser-Based Retrieval (Recommended)\n"
            "Automatically captures token from Plex login"
        )
        self.browser_radio.setChecked(True)
        self.method_group.addButton(self.browser_radio, 0)
        layout.addWidget(self.browser_radio)

        self.manual_radio = QRadioButton(
            "Manual Token Entry\n"
            "Enter token manually with step-by-step instructions"
        )
        self.method_group.addButton(self.manual_radio, 1)
        layout.addWidget(self.manual_radio)

        layout.addStretch()

        return widget

    def _create_browser_auth_page(self) -> QWidget:
        """Create browser authentication page."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Instructions
        instructions = QLabel(
            "<h3>Browser-Based Token Retrieval</h3>"
            "<p>Sign in to your Plex account below. The token will be captured automatically.</p>"
        )
        instructions.setWordWrap(True)
        layout.addWidget(instructions)

        # Browser widget
        try:
            if BROWSER_AVAILABLE:
                self.browser_widget = PlexBrowserWidget()
            else:
                from plexiq.gui.components.browser_widget import SimpleBrowserWidget
                self.browser_widget = SimpleBrowserWidget()

            self.browser_widget.token_captured.connect(self._on_token_captured)
            layout.addWidget(self.browser_widget)

        except Exception as e:
            error_label = QLabel(
                f"<p style='color: red;'>❌ Browser widget error: {e}</p>"
                "<p>Please use manual token entry instead.</p>"
            )
            error_label.setWordWrap(True)
            layout.addWidget(error_label)

        return widget

    def _create_manual_input_page(self) -> QWidget:
        """Create manual input page."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Instructions
        instructions = QLabel(
            "<h3>Manual Token Entry</h3>"
            "<p>Follow the instructions below to retrieve your Plex token, "
            "then paste it in the field below.</p>"
        )
        instructions.setWordWrap(True)
        layout.addWidget(instructions)

        # Manual instructions
        instructions_text = QTextEdit()
        instructions_text.setReadOnly(True)
        instructions_text.setPlainText(self.installer.get_manual_instructions())
        instructions_text.setMaximumHeight(250)
        layout.addWidget(instructions_text)

        # Token input
        token_layout = QHBoxLayout()
        token_layout.addWidget(QLabel("Plex Token:"))

        self.token_input = QLineEdit()
        self.token_input.setPlaceholderText("Paste your Plex token here...")
        self.token_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.token_input.textChanged.connect(self._on_token_input_changed)
        token_layout.addWidget(self.token_input)

        self.show_token_button = QPushButton("👁")
        self.show_token_button.setMaximumWidth(40)
        self.show_token_button.setCheckable(True)
        self.show_token_button.toggled.connect(self._toggle_token_visibility)
        token_layout.addWidget(self.show_token_button)

        layout.addLayout(token_layout)

        # Validation button and status
        validate_layout = QHBoxLayout()

        self.validate_button = QPushButton("Validate Token")
        self.validate_button.clicked.connect(self._validate_manual_token)
        self.validate_button.setEnabled(False)
        validate_layout.addWidget(self.validate_button)

        self.validation_status = QLabel("")
        validate_layout.addWidget(self.validation_status)
        validate_layout.addStretch()

        layout.addLayout(validate_layout)

        layout.addStretch()

        return widget

    def _create_server_config_page(self) -> QWidget:
        """Create server configuration page."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Instructions
        instructions = QLabel(
            "<h3>Plex Server Configuration</h3>"
            "<p>Enter your Plex server URL. If you're running Plex locally, "
            "the default value should work.</p>"
        )
        instructions.setWordWrap(True)
        layout.addWidget(instructions)

        # Server URL input
        url_layout = QHBoxLayout()
        url_layout.addWidget(QLabel("Plex Server URL:"))

        self.url_input = QLineEdit()
        self.url_input.setText("http://localhost:32400")
        self.url_input.setPlaceholderText("http://localhost:32400")
        url_layout.addWidget(self.url_input)

        layout.addLayout(url_layout)

        # Examples
        examples = QLabel(
            "<p><b>Examples:</b></p>"
            "<ul>"
            "<li>Local server: <code>http://localhost:32400</code></li>"
            "<li>Network server: <code>http://192.168.1.100:32400</code></li>"
            "<li>Remote server: <code>https://plex.example.com</code></li>"
            "</ul>"
        )
        examples.setWordWrap(True)
        examples.setTextFormat(Qt.TextFormat.RichText)
        layout.addWidget(examples)

        layout.addStretch()

        return widget

    def _create_complete_page(self) -> QWidget:
        """Create completion page."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Success message
        self.complete_message = QLabel()
        self.complete_message.setWordWrap(True)
        self.complete_message.setTextFormat(Qt.TextFormat.RichText)
        layout.addWidget(self.complete_message)

        layout.addStretch()

        return widget

    def _apply_styles(self) -> None:
        """Apply custom styles."""
        self.setStyleSheet("""
            QDialog {
                background-color: #2c3e50;
                color: #ecf0f1;
            }
            QLabel {
                color: #ecf0f1;
            }
            QPushButton {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #2980b9;
            }
            QPushButton:disabled {
                background-color: #7f8c8d;
            }
            QLineEdit {
                padding: 6px;
                border: 1px solid #7f8c8d;
                border-radius: 4px;
                background-color: #34495e;
                color: #ecf0f1;
            }
            QTextEdit {
                border: 1px solid #7f8c8d;
                border-radius: 4px;
                background-color: #34495e;
                color: #ecf0f1;
            }
            QRadioButton {
                color: #ecf0f1;
                padding: 8px;
            }
            QRadioButton::indicator {
                width: 16px;
                height: 16px;
            }
        """)

    def _update_navigation(self) -> None:
        """Update navigation button states."""
        current_page = self.pages.currentIndex()

        # Update progress bar
        self.progress_bar.setValue(current_page)

        # Update back button
        self.back_button.setEnabled(current_page > 0)

        # Update next button
        if current_page == self.PAGE_COMPLETE:
            self.next_button.setText("Finish")
            self.next_button.setEnabled(True)
        elif current_page == self.PAGE_BROWSER_AUTH:
            self.next_button.setEnabled(self.captured_token is not None)
        elif current_page == self.PAGE_MANUAL_INPUT:
            self.next_button.setEnabled(self.captured_token is not None)
        else:
            self.next_button.setText("Next →")
            self.next_button.setEnabled(True)

        # Update cancel button
        self.cancel_button.setEnabled(current_page < self.PAGE_COMPLETE)

    def _go_next(self) -> None:
        """Navigate to next page."""
        current_page = self.pages.currentIndex()

        if current_page == self.PAGE_COMPLETE:
            # Finish setup
            self._finish_setup()
            return

        if current_page == self.PAGE_METHOD_SELECTION:
            # Route to appropriate page based on selection
            if self.browser_radio.isChecked():
                self.pages.setCurrentIndex(self.PAGE_BROWSER_AUTH)
            else:
                self.pages.setCurrentIndex(self.PAGE_MANUAL_INPUT)
        elif current_page in [self.PAGE_BROWSER_AUTH, self.PAGE_MANUAL_INPUT]:
            # Go to server config if token captured
            if self.captured_token:
                self.pages.setCurrentIndex(self.PAGE_SERVER_CONFIG)
        elif current_page == self.PAGE_SERVER_CONFIG:
            # Save configuration and go to complete page
            self._save_configuration()
        else:
            # Standard next
            self.pages.setCurrentIndex(current_page + 1)

        self._update_navigation()

    def _go_back(self) -> None:
        """Navigate to previous page."""
        current_page = self.pages.currentIndex()

        if current_page == self.PAGE_SERVER_CONFIG:
            # Go back to method selection
            self.pages.setCurrentIndex(self.PAGE_METHOD_SELECTION)
        elif current_page > 0:
            self.pages.setCurrentIndex(current_page - 1)

        self._update_navigation()

    def _on_cancel(self) -> None:
        """Handle cancel button click."""
        reply = QMessageBox.question(
            self,
            "Cancel Setup",
            "Are you sure you want to cancel the setup wizard?\n"
            "PlexIQ will not work without a valid token.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            self.reject()

    def _on_token_captured(self, token: str) -> None:
        """
        Handle token captured from browser.

        Args:
            token: Captured token
        """
        self.captured_token = token
        self._update_navigation()

        # Auto-advance to server config
        QMessageBox.information(
            self,
            "Token Captured",
            "✅ Token captured and validated successfully!\n\n"
            "Click Next to configure your Plex server URL."
        )

    def _on_token_input_changed(self, text: str) -> None:
        """Handle token input text changed."""
        self.validate_button.setEnabled(len(text.strip()) > 0)
        self.validation_status.setText("")

    def _toggle_token_visibility(self, checked: bool) -> None:
        """Toggle token visibility."""
        if checked:
            self.token_input.setEchoMode(QLineEdit.EchoMode.Normal)
        else:
            self.token_input.setEchoMode(QLineEdit.EchoMode.Password)

    def _validate_manual_token(self) -> None:
        """Validate manually entered token."""
        token = self.token_input.text().strip()

        if not token:
            self.validation_status.setText("❌ Token cannot be empty")
            self.validation_status.setStyleSheet("color: #e74c3c;")
            return

        # Validate
        self.validation_status.setText("🔍 Validating...")
        self.validation_status.setStyleSheet("color: #f39c12;")

        is_valid, message = self.installer.validate_token(token)

        if is_valid:
            self.captured_token = token
            self.validation_status.setText(f"✅ {message}")
            self.validation_status.setStyleSheet("color: #2ecc71;")
            self._update_navigation()
        else:
            self.validation_status.setText(f"❌ {message}")
            self.validation_status.setStyleSheet("color: #e74c3c;")

    def _save_configuration(self) -> None:
        """Save token and configuration."""
        self.plex_url = self.url_input.text().strip()

        if not self.plex_url:
            self.plex_url = "http://localhost:32400"

        # Save token
        success, message = self.installer.save_token(
            self.captured_token,
            self.plex_url,
            validate=False  # Already validated
        )

        if success:
            # Update complete message
            if self.dry_run:
                self.complete_message.setText(
                    "<h2 style='color: #f39c12;'>🔒 Dry-Run Mode</h2>"
                    f"<p>{message}</p>"
                    "<p>To actually save the token, restart setup without dry-run mode.</p>"
                )
            else:
                self.complete_message.setText(
                    "<h2 style='color: #2ecc71;'>✅ Setup Complete!</h2>"
                    f"<p>{message}</p>"
                    "<h3>Next Steps:</h3>"
                    "<ul>"
                    "<li>Collect metadata: <code>plexiq collect Movies --enrich</code></li>"
                    "<li>Analyze items: <code>plexiq analyze Movies --show-recommended</code></li>"
                    "<li>Launch GUI: <code>plexiq gui</code></li>"
                    "</ul>"
                    "<p><b>Click Finish to close this wizard.</b></p>"
                )

            # Go to complete page
            self.pages.setCurrentIndex(self.PAGE_COMPLETE)
            self._update_navigation()

        else:
            QMessageBox.critical(
                self,
                "Save Failed",
                f"❌ Failed to save configuration:\n\n{message}"
            )

    def _finish_setup(self) -> None:
        """Finish setup and close wizard."""
        if self.captured_token:
            self.setup_complete.emit(self.captured_token)

        self.accept()


def run_setup_wizard(dry_run: bool = True, parent: Optional[QWidget] = None) -> Optional[str]:
    """
    Run setup wizard and return captured token.

    Args:
        dry_run: Enable dry-run mode
        parent: Parent widget

    Returns:
        Captured token or None if cancelled
    """
    wizard = SetupWizard(dry_run=dry_run, parent=parent)
    result = wizard.exec()

    if result == QDialog.DialogCode.Accepted:
        return wizard.captured_token

    return None
