"""
PlexIQ v3 - Analysis Table Widget
Custom table widget for displaying analysis results with context menus.
Author: Rich Knowles (via Claude-Code)
"""

from typing import List, Dict, Any
from PyQt6.QtWidgets import QTableWidget, QTableWidgetItem, QMenu, QHeaderView
from PyQt6.QtCore import Qt, QPoint
from PyQt6.QtGui import QColor, QAction


class AnalysisTableWidget(QTableWidget):
    """
    Custom table widget for displaying PlexIQ analysis results.
    Features:
    - Color-coded deletion scores
    - Right-click context menu (<100ms response, Rule #4)
    - Sortable columns
    - Detailed rationale tooltips
    """

    def __init__(self, parent=None):
        super().__init__(parent)

        # Table configuration
        self.setColumnCount(8)
        self.setHorizontalHeaderLabels([
            "Title",
            "Year",
            "Score",
            "Size (GB)",
            "Views",
            "Rating",
            "Recommended",
            "Top Reason"
        ])

        # Table behavior (Rule #4: Consistency)
        self.setAlternatingRowColors(True)
        self.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.setSelectionMode(QTableWidget.SelectionMode.ExtendedSelection)
        self.setSortingEnabled(True)

        # Resize columns
        header = self.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)  # Title
        header.setSectionResizeMode(7, QHeaderView.ResizeMode.Stretch)  # Top Reason

        # Context menu
        self.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.customContextMenuRequested.connect(self._show_context_menu)

        # Data storage
        self._items = []

    def setAnalysisData(self, items: List[Dict[str, Any]]):
        """
        Populate table with analysis data.

        Args:
            items: List of analyzed item dictionaries
        """
        self._items = items
        self.setRowCount(len(items))

        for row, item in enumerate(items):
            # Title
            title_item = QTableWidgetItem(item['title'])
            title_item.setFlags(title_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
            self.setItem(row, 0, title_item)

            # Year
            year_item = QTableWidgetItem(str(item.get('year', 'N/A')))
            year_item.setFlags(year_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
            year_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            self.setItem(row, 1, year_item)

            # Score (color-coded)
            score = item['deletion_score']
            score_item = QTableWidgetItem(f"{score:.3f}")
            score_item.setFlags(score_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
            score_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)

            # Color code based on score
            if score >= 0.7:
                score_item.setForeground(QColor(255, 100, 100))  # Red
            elif score >= 0.5:
                score_item.setForeground(QColor(244, 169, 64))   # Mustard
            else:
                score_item.setForeground(QColor(100, 255, 100))  # Green

            self.setItem(row, 2, score_item)

            # Size (GB)
            size_bytes = item.get('media', {}).get('size_bytes', 0)
            size_gb = size_bytes / (1024 ** 3)
            size_item = QTableWidgetItem(f"{size_gb:.2f}")
            size_item.setFlags(size_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
            size_item.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            self.setItem(row, 3, size_item)

            # View count
            view_count = item.get('plex', {}).get('view_count', 0)
            views_item = QTableWidgetItem(str(view_count))
            views_item.setFlags(views_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
            views_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            self.setItem(row, 4, views_item)

            # Rating (best available)
            ratings = item.get('ratings', {})
            if ratings.get('imdb'):
                rating_str = f"{ratings['imdb']:.1f}"
            elif ratings.get('tmdb'):
                rating_str = f"{ratings['tmdb']:.1f}"
            else:
                rating_str = "N/A"

            rating_item = QTableWidgetItem(rating_str)
            rating_item.setFlags(rating_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
            rating_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            self.setItem(row, 5, rating_item)

            # Recommended
            recommended = "✓" if item.get('deletion_recommended', False) else ""
            rec_item = QTableWidgetItem(recommended)
            rec_item.setFlags(rec_item.flags() & ~Qt.ItemFlag.ItemIsEditable)
            rec_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            if recommended:
                rec_item.setForeground(QColor(255, 100, 100))
            self.setItem(row, 6, rec_item)

            # Top reason (from rationale)
            rationale_lines = item.get('deletion_rationale', [])
            top_reason = rationale_lines[1] if len(rationale_lines) > 1 else "N/A"

            # Truncate if too long
            if len(top_reason) > 60:
                top_reason = top_reason[:57] + "..."

            reason_item = QTableWidgetItem(top_reason)
            reason_item.setFlags(reason_item.flags() & ~Qt.ItemFlag.ItemIsEditable)

            # Set full rationale as tooltip
            full_rationale = "\n".join(rationale_lines)
            reason_item.setToolTip(full_rationale)

            self.setItem(row, 7, reason_item)

    def _show_context_menu(self, position: QPoint):
        """
        Show context menu on right-click (Rule #4: <100ms response).

        Args:
            position: Click position
        """
        # Get selected items
        selected_rows = set(item.row() for item in self.selectedItems())
        if not selected_rows:
            return

        # Create context menu
        menu = QMenu(self)

        # View details action
        view_action = QAction("View Full Details", self)
        view_action.triggered.connect(lambda: self._view_details(list(selected_rows)))
        menu.addAction(view_action)

        menu.addSeparator()

        # Copy title action
        copy_action = QAction("Copy Title", self)
        copy_action.triggered.connect(lambda: self._copy_titles(list(selected_rows)))
        menu.addAction(copy_action)

        # Export selected action
        export_action = QAction("Export Selected...", self)
        export_action.triggered.connect(lambda: self._export_selected(list(selected_rows)))
        menu.addAction(export_action)

        # Show menu at cursor position
        menu.exec(self.viewport().mapToGlobal(position))

    def _view_details(self, rows: List[int]):
        """Show detailed information for selected items."""
        from PyQt6.QtWidgets import QMessageBox

        if len(rows) == 1:
            row = rows[0]
            if row < len(self._items):
                item = self._items[row]
                rationale = "\n".join(item.get('deletion_rationale', []))

                details = f"""
Title: {item['title']} ({item.get('year', 'N/A')})

Deletion Score: {item['deletion_score']:.3f}
Recommended: {'Yes' if item.get('deletion_recommended') else 'No'}

Rationale:
{rationale}

Size: {item.get('media', {}).get('size_bytes', 0) / (1024**3):.2f} GB
Views: {item.get('plex', {}).get('view_count', 0)}
                """

                QMessageBox.information(self, "Item Details", details.strip())
        else:
            QMessageBox.information(
                self,
                "Multiple Items",
                f"{len(rows)} items selected"
            )

    def _copy_titles(self, rows: List[int]):
        """Copy titles of selected items to clipboard."""
        from PyQt6.QtWidgets import QApplication

        titles = [
            self._items[row]['title']
            for row in rows
            if row < len(self._items)
        ]

        clipboard = QApplication.clipboard()
        clipboard.setText("\n".join(titles))

    def _export_selected(self, rows: List[int]):
        """Export selected items to JSON file."""
        from PyQt6.QtWidgets import QFileDialog, QMessageBox
        import json

        selected_items = [
            self._items[row]
            for row in rows
            if row < len(self._items)
        ]

        filename, _ = QFileDialog.getSaveFileName(
            self,
            "Export Selected Items",
            "selected_items.json",
            "JSON Files (*.json)"
        )

        if filename:
            try:
                with open(filename, 'w') as f:
                    json.dump(selected_items, f, indent=2, default=str)
                QMessageBox.information(
                    self,
                    "Export Complete",
                    f"Exported {len(selected_items)} items to {filename}"
                )
            except Exception as e:
                QMessageBox.critical(self, "Export Error", str(e))

    def setContextMenuEnabled(self, enabled: bool):
        """Enable or disable context menu."""
        if enabled:
            self.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        else:
            self.setContextMenuPolicy(Qt.ContextMenuPolicy.NoContextMenu)
