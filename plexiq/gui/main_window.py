"""
PlexIQ v3 - Main GUI Window
PyQt6-based GUI with full CLI parity (Rule #2).
Author: Rich Knowles (via Claude-Code)
Safety: All operations default to dry-run with explicit confirmations.
"""

from typing import Optional
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QComboBox, QTabWidget, QTableWidget, QTableWidgetItem,
    QMessageBox, QFileDialog, QMenuBar, QMenu, QStatusBar, QGroupBox
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QAction, QIcon

from plexiq.config import Config
from plexiq.logger import PlexIQLogger
from plexiq.collector import MetadataCollector
from plexiq.analyzer import MediaAnalyzer
from plexiq.backup import BackupManager
from plexiq.gui.components.progress_bar import MustardProgressBar
from plexiq.gui.components.table_widget import AnalysisTableWidget
from plexiq.gui.components.dialogs import ConfirmationDialog, DryRunWarningDialog


class CollectionThread(QThread):
    """Background thread for metadata collection."""
    progress = pyqtSignal(int, int)  # current, total
    finished = pyqtSignal(list)
    error = pyqtSignal(str)

    def __init__(self, collector, library_name, media_type, enrich):
        super().__init__()
        self.collector = collector
        self.library_name = library_name
        self.media_type = media_type
        self.enrich = enrich

    def run(self):
        try:
            items = self.collector.collect_and_enrich(
                library_name=self.library_name,
                media_type=self.media_type,
                enrich=self.enrich
            )
            self.finished.emit(items)
        except Exception as e:
            self.error.emit(str(e))


class AnalysisThread(QThread):
    """Background thread for analysis."""
    progress = pyqtSignal(int, int)
    finished = pyqtSignal(list)
    error = pyqtSignal(str)

    def __init__(self, analyzer, items):
        super().__init__()
        self.analyzer = analyzer
        self.items = items

    def run(self):
        try:
            analyzed_items = self.analyzer.analyze_items(self.items, sort_by_score=True)
            self.finished.emit(analyzed_items)
        except Exception as e:
            self.error.emit(str(e))


class PlexIQMainWindow(QMainWindow):
    """
    Main application window for PlexIQ v3.
    Implements Rules #1-5 with full CLI/GUI parity.
    """

    def __init__(
        self,
        config: Config,
        logger: PlexIQLogger,
        initial_library: Optional[str] = None
    ):
        super().__init__()
        self.config = config
        self.logger = logger
        self.initial_library = initial_library

        # Data
        self.collected_items = []
        self.analyzed_items = []
        self.plex_libraries = []

        # Components
        self.collector = MetadataCollector(config, logger)
        self.analyzer = MediaAnalyzer(config, logger)
        self.backup_manager = BackupManager(config, logger)

        # Initialize UI
        self._init_ui()
        self._setup_connections()
        self._load_libraries()

    def _init_ui(self):
        """Initialize user interface (Rule #5: Aesthetic & Delight)."""
        self.setWindowTitle("PlexIQ v3 - Smart Plex Media Management")
        self.setMinimumSize(1200, 800)

        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)

        # Menu bar
        self._create_menu_bar()

        # Top controls
        controls_group = self._create_controls_group()
        main_layout.addWidget(controls_group)

        # Tab widget
        self.tabs = QTabWidget()
        main_layout.addWidget(self.tabs)

        # Analysis tab
        self.analysis_tab = self._create_analysis_tab()
        self.tabs.addTab(self.analysis_tab, "Analysis")

        # Backups tab
        self.backups_tab = self._create_backups_tab()
        self.tabs.addTab(self.backups_tab, "Backups")

        # Settings tab
        self.settings_tab = self._create_settings_tab()
        self.tabs.addTab(self.settings_tab, "Settings")

        # Status bar (Rule #3: Clarity & Feedback)
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready")

        # Apply theme
        self._apply_theme()

    def _create_menu_bar(self):
        """Create application menu bar."""
        menubar = self.menuBar()

        # File menu
        file_menu = menubar.addMenu("&File")

        import_action = QAction("&Import Analysis...", self)
        import_action.triggered.connect(self._import_analysis)
        file_menu.addAction(import_action)

        export_action = QAction("&Export Analysis...", self)
        export_action.triggered.connect(self._export_analysis)
        file_menu.addAction(export_action)

        file_menu.addSeparator()

        exit_action = QAction("E&xit", self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # Tools menu
        tools_menu = menubar.addMenu("&Tools")

        validate_action = QAction("&Validate Configuration", self)
        validate_action.triggered.connect(self._validate_config)
        tools_menu.addAction(validate_action)

        cleanup_action = QAction("&Cleanup Old Backups", self)
        cleanup_action.triggered.connect(self._cleanup_backups)
        tools_menu.addAction(cleanup_action)

        # Help menu
        help_menu = menubar.addMenu("&Help")

        about_action = QAction("&About PlexIQ", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)

    def _create_controls_group(self) -> QGroupBox:
        """Create control panel."""
        group = QGroupBox("Library Controls")
        layout = QHBoxLayout()

        # Library selection
        layout.addWidget(QLabel("Library:"))
        self.library_combo = QComboBox()
        self.library_combo.setMinimumWidth(200)
        layout.addWidget(self.library_combo)

        # Action buttons
        self.collect_btn = QPushButton("Collect Metadata")
        self.collect_btn.clicked.connect(self._collect_metadata)
        layout.addWidget(self.collect_btn)

        self.analyze_btn = QPushButton("Analyze")
        self.analyze_btn.setEnabled(False)
        self.analyze_btn.clicked.connect(self._analyze_items)
        layout.addWidget(self.analyze_btn)

        self.delete_btn = QPushButton("Delete Items (Dry-Run)")
        self.delete_btn.setEnabled(False)
        self.delete_btn.clicked.connect(self._delete_items_dry_run)
        layout.addWidget(self.delete_btn)

        layout.addStretch()

        group.setLayout(layout)
        return group

    def _create_analysis_tab(self) -> QWidget:
        """Create analysis results tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Progress bar (Rule #5: Mustard-colored progress bar)
        self.progress_bar = MustardProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)

        # Results table
        self.results_table = AnalysisTableWidget()
        self.results_table.setContextMenuEnabled(True)
        layout.addWidget(self.results_table)

        # Summary panel
        summary_layout = QHBoxLayout()
        self.summary_label = QLabel("No analysis performed yet")
        summary_layout.addWidget(self.summary_label)
        summary_layout.addStretch()
        layout.addLayout(summary_layout)

        return widget

    def _create_backups_tab(self) -> QWidget:
        """Create backups management tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Backups table
        self.backups_table = QTableWidget()
        self.backups_table.setColumnCount(5)
        self.backups_table.setHorizontalHeaderLabels([
            "Filename", "Type", "Created", "Size", "Items"
        ])
        layout.addWidget(self.backups_table)

        # Backup controls
        btn_layout = QHBoxLayout()
        refresh_btn = QPushButton("Refresh")
        refresh_btn.clicked.connect(self._refresh_backups)
        btn_layout.addWidget(refresh_btn)

        restore_btn = QPushButton("Restore Selected")
        restore_btn.clicked.connect(self._restore_backup)
        btn_layout.addWidget(restore_btn)

        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        return widget

    def _create_settings_tab(self) -> QWidget:
        """Create settings configuration tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Configuration display
        config_label = QLabel("Configuration settings will be displayed here")
        layout.addWidget(config_label)

        layout.addStretch()
        return widget

    def _setup_connections(self):
        """Setup signal/slot connections (Rule #4: Consistency)."""
        pass

    def _apply_theme(self):
        """Apply application theme (Rule #5: Aesthetic)."""
        theme = self.config.get('gui.theme', 'dark')

        if theme == 'dark':
            self.setStyleSheet("""
                QMainWindow {
                    background-color: #2b2b2b;
                    color: #ffffff;
                }
                QGroupBox {
                    border: 1px solid #555;
                    border-radius: 5px;
                    margin-top: 10px;
                    padding: 10px;
                    font-weight: bold;
                }
                QGroupBox::title {
                    subcontrol-origin: margin;
                    padding: 0 5px;
                }
                QPushButton {
                    background-color: #3a3a3a;
                    color: white;
                    border: 1px solid #555;
                    padding: 8px 16px;
                    border-radius: 4px;
                }
                QPushButton:hover {
                    background-color: #4a4a4a;
                }
                QPushButton:disabled {
                    background-color: #2a2a2a;
                    color: #666;
                }
                QTableWidget {
                    background-color: #333;
                    alternate-background-color: #3a3a3a;
                    color: white;
                    gridline-color: #555;
                }
                QHeaderView::section {
                    background-color: #2b2b2b;
                    color: white;
                    padding: 5px;
                    border: 1px solid #555;
                }
            """)

    def _load_libraries(self):
        """Load available Plex libraries."""
        try:
            sections = self.collector.plex.library.sections()
            self.plex_libraries = [section.title for section in sections]
            self.library_combo.addItems(self.plex_libraries)

            if self.initial_library and self.initial_library in self.plex_libraries:
                index = self.plex_libraries.index(self.initial_library)
                self.library_combo.setCurrentIndex(index)

            self.logger.info(f"Loaded {len(self.plex_libraries)} libraries")
        except Exception as e:
            self.logger.error(f"Failed to load libraries: {e}")
            QMessageBox.critical(self, "Error", f"Failed to load Plex libraries:\n{e}")

    def _collect_metadata(self):
        """Collect metadata from selected library (Rule #3: Feedback)."""
        library_name = self.library_combo.currentText()
        if not library_name:
            QMessageBox.warning(self, "Warning", "Please select a library")
            return

        self.status_bar.showMessage(f"Collecting metadata from {library_name}...")
        self.progress_bar.setVisible(True)
        self.progress_bar.setIndeterminate(True)
        self.collect_btn.setEnabled(False)

        # Start collection thread
        self.collection_thread = CollectionThread(
            self.collector, library_name, 'movie', True
        )
        self.collection_thread.finished.connect(self._on_collection_finished)
        self.collection_thread.error.connect(self._on_collection_error)
        self.collection_thread.start()

    def _on_collection_finished(self, items):
        """Handle collection completion."""
        self.collected_items = items
        self.progress_bar.setVisible(False)
        self.collect_btn.setEnabled(True)
        self.analyze_btn.setEnabled(True)

        self.status_bar.showMessage(f"Collected {len(items)} items", 5000)
        self.logger.success(f"Collection complete: {len(items)} items")

    def _on_collection_error(self, error_msg):
        """Handle collection error."""
        self.progress_bar.setVisible(False)
        self.collect_btn.setEnabled(True)
        self.status_bar.showMessage("Collection failed", 5000)

        QMessageBox.critical(self, "Collection Error", f"Failed to collect metadata:\n{error_msg}")

    def _analyze_items(self):
        """Analyze collected items."""
        if not self.collected_items:
            QMessageBox.warning(self, "Warning", "No items to analyze")
            return

        self.status_bar.showMessage("Analyzing items...")
        self.progress_bar.setVisible(True)
        self.progress_bar.setIndeterminate(True)
        self.analyze_btn.setEnabled(False)

        # Start analysis thread
        self.analysis_thread = AnalysisThread(self.analyzer, self.collected_items)
        self.analysis_thread.finished.connect(self._on_analysis_finished)
        self.analysis_thread.error.connect(self._on_analysis_error)
        self.analysis_thread.start()

    def _on_analysis_finished(self, items):
        """Handle analysis completion."""
        self.analyzed_items = items
        self.progress_bar.setVisible(False)
        self.analyze_btn.setEnabled(True)
        self.delete_btn.setEnabled(True)

        # Update results table
        self.results_table.setAnalysisData(items)

        # Update summary
        recommended = sum(1 for item in items if item.get('deletion_recommended', False))
        self.summary_label.setText(
            f"Analyzed {len(items)} items | {recommended} recommended for deletion"
        )

        self.status_bar.showMessage("Analysis complete", 5000)
        self.logger.success(f"Analysis complete: {len(items)} items")

    def _on_analysis_error(self, error_msg):
        """Handle analysis error."""
        self.progress_bar.setVisible(False)
        self.analyze_btn.setEnabled(True)
        self.status_bar.showMessage("Analysis failed", 5000)

        QMessageBox.critical(self, "Analysis Error", f"Failed to analyze items:\n{error_msg}")

    def _delete_items_dry_run(self):
        """Perform dry-run deletion (Rule #1: Safety First)."""
        recommended_items = [
            item for item in self.analyzed_items
            if item.get('deletion_recommended', False)
        ]

        if not recommended_items:
            QMessageBox.information(self, "Info", "No items recommended for deletion")
            return

        # Show dry-run warning dialog
        dialog = DryRunWarningDialog(recommended_items, self)
        if dialog.exec():
            self.logger.dry_run(f"Would delete {len(recommended_items)} items")
            QMessageBox.information(
                self,
                "Dry-Run Complete",
                f"Dry-run complete. {len(recommended_items)} items would be deleted.\n\n"
                "Use CLI with --execute flag for actual deletion."
            )

    def _import_analysis(self):
        """Import analysis from JSON file."""
        filename, _ = QFileDialog.getOpenFileName(
            self, "Import Analysis", "", "JSON Files (*.json)"
        )
        if filename:
            try:
                import json
                with open(filename, 'r') as f:
                    self.analyzed_items = json.load(f)
                self.results_table.setAnalysisData(self.analyzed_items)
                self.delete_btn.setEnabled(True)
                self.status_bar.showMessage(f"Imported {len(self.analyzed_items)} items", 5000)
            except Exception as e:
                QMessageBox.critical(self, "Import Error", str(e))

    def _export_analysis(self):
        """Export analysis to JSON file."""
        if not self.analyzed_items:
            QMessageBox.warning(self, "Warning", "No analysis to export")
            return

        filename, _ = QFileDialog.getSaveFileName(
            self, "Export Analysis", "analysis.json", "JSON Files (*.json)"
        )
        if filename:
            try:
                import json
                with open(filename, 'w') as f:
                    json.dump(self.analyzed_items, f, indent=2, default=str)
                self.status_bar.showMessage(f"Exported to {filename}", 5000)
            except Exception as e:
                QMessageBox.critical(self, "Export Error", str(e))

    def _validate_config(self):
        """Validate configuration."""
        QMessageBox.information(self, "Validation", "Configuration validation will be implemented")

    def _cleanup_backups(self):
        """Cleanup old backups."""
        reply = QMessageBox.question(
            self,
            "Cleanup Backups",
            "Delete backups older than retention period?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            self.backup_manager.cleanup_old_backups()
            self._refresh_backups()

    def _refresh_backups(self):
        """Refresh backups list."""
        backups = self.backup_manager.list_backups()
        self.backups_table.setRowCount(len(backups))

        for row, backup in enumerate(backups):
            self.backups_table.setItem(row, 0, QTableWidgetItem(backup['filename']))
            self.backups_table.setItem(row, 1, QTableWidgetItem(backup.get('backup_type', 'N/A')))
            self.backups_table.setItem(row, 2, QTableWidgetItem(backup.get('created_at', 'N/A')[:19]))
            self.backups_table.setItem(row, 3, QTableWidgetItem(f"{backup['size_bytes'] / 1024:.1f} KB"))
            item_count = backup.get('metadata', {}).get('item_count', 'N/A')
            self.backups_table.setItem(row, 4, QTableWidgetItem(str(item_count)))

    def _restore_backup(self):
        """Restore selected backup."""
        selected = self.backups_table.currentRow()
        if selected >= 0:
            filename = self.backups_table.item(selected, 0).text()
            # Implement restore logic
            QMessageBox.information(self, "Restore", f"Restoring {filename} (not yet implemented)")

    def _show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self,
            "About PlexIQ v3",
            "PlexIQ v3 - Smart Plex Media Library Management\n\n"
            "Author: Rich Knowles\n"
            "Safety-first design with dry-run defaults\n\n"
            "Rules:\n"
            "1. Safety First\n"
            "2. CLI/GUI Parity\n"
            "3. Clarity & Feedback\n"
            "4. Consistency & Predictability\n"
            "5. Aesthetic & Delight"
        )
