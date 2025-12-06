"""
PlexIQ v3 - Custom Dialogs
Confirmation and informational dialogs (Rule #1: Safety First).
Author: Rich Knowles (via Claude-Code)
"""

from typing import List, Dict, Any
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QTableWidget, QTableWidgetItem, QDialogButtonBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor


class ConfirmationDialog(QDialog):
    """
    Generic confirmation dialog with customizable message and buttons.
    """

    def __init__(
        self,
        title: str,
        message: str,
        details: str = "",
        parent=None
    ):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setMinimumWidth(500)

        layout = QVBoxLayout(self)

        # Main message
        message_label = QLabel(message)
        message_label.setWordWrap(True)
        layout.addWidget(message_label)

        # Optional details
        if details:
            details_label = QLabel(details)
            details_label.setWordWrap(True)
            details_label.setStyleSheet("color: #888; font-size: 10pt;")
            layout.addWidget(details_label)

        # Buttons
        button_box = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Yes | QDialogButtonBox.StandardButton.No
        )
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)


class DryRunWarningDialog(QDialog):
    """
    Dry-run warning dialog showing items that would be deleted.
    Implements Rule #1: Safety First with clear visual warnings.
    """

    def __init__(self, items: List[Dict[str, Any]], parent=None):
        super().__init__(parent)
        self.setWindowTitle("Dry-Run Deletion Preview")
        self.setMinimumSize(800, 600)

        layout = QVBoxLayout(self)

        # Warning banner
        warning_label = QLabel(
            "⚠️  DRY-RUN MODE  ⚠️\n\n"
            "This is a SIMULATION. No items will be deleted.\n"
            "The following items WOULD be deleted in execute mode:"
        )
        warning_label.setStyleSheet("""
            background-color: #F4A940;
            color: #000;
            padding: 15px;
            font-weight: bold;
            font-size: 11pt;
            border-radius: 5px;
        """)
        warning_label.setWordWrap(True)
        warning_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(warning_label)

        # Items table
        table = QTableWidget()
        table.setColumnCount(5)
        table.setHorizontalHeaderLabels([
            "Title", "Year", "Score", "Size (GB)", "Top Reason"
        ])
        table.setRowCount(len(items))

        total_size = 0

        for row, item in enumerate(items):
            # Title
            table.setItem(row, 0, QTableWidgetItem(item['title']))

            # Year
            year_item = QTableWidgetItem(str(item.get('year', 'N/A')))
            year_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            table.setItem(row, 1, year_item)

            # Score
            score = item['deletion_score']
            score_item = QTableWidgetItem(f"{score:.3f}")
            score_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            score_item.setForeground(QColor(255, 100, 100))
            table.setItem(row, 2, score_item)

            # Size
            size_bytes = item.get('media', {}).get('size_bytes', 0)
            size_gb = size_bytes / (1024 ** 3)
            total_size += size_bytes

            size_item = QTableWidgetItem(f"{size_gb:.2f}")
            size_item.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            table.setItem(row, 3, size_item)

            # Top reason
            rationale = item.get('deletion_rationale', [])
            top_reason = rationale[1] if len(rationale) > 1 else "N/A"
            if len(top_reason) > 50:
                top_reason = top_reason[:47] + "..."
            table.setItem(row, 4, QTableWidgetItem(top_reason))

        layout.addWidget(table)

        # Summary
        total_gb = total_size / (1024 ** 3)
        summary_label = QLabel(
            f"Total: {len(items)} items | {total_gb:.2f} GB would be recovered"
        )
        summary_label.setStyleSheet("font-weight: bold; font-size: 11pt;")
        summary_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(summary_label)

        # Info text
        info_label = QLabel(
            "To perform actual deletion, use the CLI with --execute flag:\n"
            "  plexiq delete <library> --execute --confirm"
        )
        info_label.setStyleSheet("color: #888; font-style: italic;")
        info_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(info_label)

        # Close button
        close_btn = QPushButton("Close")
        close_btn.clicked.connect(self.accept)
        layout.addWidget(close_btn)


class DeleteConfirmationDialog(QDialog):
    """
    ACTUAL deletion confirmation dialog (Rule #1: Extra safety for destructive ops).
    This dialog requires explicit acknowledgment before allowing deletion.
    """

    def __init__(self, items: List[Dict[str, Any]], parent=None):
        super().__init__(parent)
        self.setWindowTitle("⚠️  CONFIRM DELETION  ⚠️")
        self.setMinimumSize(800, 600)

        layout = QVBoxLayout(self)

        # DANGER banner
        danger_label = QLabel(
            "🛑  DANGER: ACTUAL DELETION MODE  🛑\n\n"
            "This will PERMANENTLY DELETE the following items from your Plex library!\n"
            "This action CANNOT be undone!"
        )
        danger_label.setStyleSheet("""
            background-color: #ff3333;
            color: #fff;
            padding: 20px;
            font-weight: bold;
            font-size: 12pt;
            border-radius: 5px;
        """)
        danger_label.setWordWrap(True)
        danger_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(danger_label)

        # Items table (same as dry-run)
        table = QTableWidget()
        table.setColumnCount(5)
        table.setHorizontalHeaderLabels([
            "Title", "Year", "Score", "Size (GB)", "Top Reason"
        ])
        table.setRowCount(len(items))

        for row, item in enumerate(items):
            table.setItem(row, 0, QTableWidgetItem(item['title']))

            year_item = QTableWidgetItem(str(item.get('year', 'N/A')))
            year_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            table.setItem(row, 1, year_item)

            score_item = QTableWidgetItem(f"{item['deletion_score']:.3f}")
            score_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            table.setItem(row, 2, score_item)

            size_gb = item.get('media', {}).get('size_bytes', 0) / (1024 ** 3)
            size_item = QTableWidgetItem(f"{size_gb:.2f}")
            size_item.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            table.setItem(row, 3, size_item)

            rationale = item.get('deletion_rationale', [])
            top_reason = rationale[1] if len(rationale) > 1 else "N/A"
            if len(top_reason) > 50:
                top_reason = top_reason[:47] + "..."
            table.setItem(row, 4, QTableWidgetItem(top_reason))

        layout.addWidget(table)

        # Confirmation checkbox/buttons
        button_layout = QHBoxLayout()

        cancel_btn = QPushButton("Cancel (Do Not Delete)")
        cancel_btn.clicked.connect(self.reject)
        cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: #4a4a4a;
                padding: 10px 20px;
                font-size: 11pt;
            }
        """)
        button_layout.addWidget(cancel_btn)

        button_layout.addStretch()

        confirm_btn = QPushButton("I Understand - DELETE ITEMS")
        confirm_btn.clicked.connect(self.accept)
        confirm_btn.setStyleSheet("""
            QPushButton {
                background-color: #ff3333;
                color: white;
                padding: 10px 20px;
                font-size: 11pt;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #ff5555;
            }
        """)
        button_layout.addWidget(confirm_btn)

        layout.addLayout(button_layout)
