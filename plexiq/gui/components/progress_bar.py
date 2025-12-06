"""
PlexIQ v3 - Mustard-Colored Progress Bar
Custom progress bar component (Rule #5: Aesthetic & Delight).
Author: Rich Knowles (via Claude-Code)
"""

from PyQt6.QtWidgets import QProgressBar
from PyQt6.QtCore import QTimer, QPropertyAnimation, QEasingCurve, Qt


class MustardProgressBar(QProgressBar):
    """
    Custom progress bar with mustard color (#F4A940).
    Supports determinate and indeterminate modes with smooth animations.
    """

    def __init__(self, parent=None):
        super().__init__(parent)
        self._indeterminate = False
        self._animation_timer = None

        # Apply mustard color styling
        self.setStyleSheet("""
            QProgressBar {
                border: 2px solid #555;
                border-radius: 5px;
                text-align: center;
                background-color: #2b2b2b;
                color: white;
                height: 25px;
            }
            QProgressBar::chunk {
                background-color: #F4A940;  /* Mustard color */
                border-radius: 3px;
            }
        """)

        self.setMinimum(0)
        self.setMaximum(100)
        self.setValue(0)

    def setIndeterminate(self, indeterminate: bool):
        """
        Set indeterminate mode (animated progress without specific value).

        Args:
            indeterminate: True for indeterminate mode, False for determinate
        """
        self._indeterminate = indeterminate

        if indeterminate:
            # Start indeterminate animation
            self.setMaximum(0)  # Makes Qt progress bar pulse
        else:
            # Stop indeterminate animation
            self.setMaximum(100)
            if self._animation_timer:
                self._animation_timer.stop()

    def setProgress(self, current: int, total: int):
        """
        Set progress with smooth animation (Rule #5: <100ms response).

        Args:
            current: Current progress value
            total: Total/maximum value
        """
        if total > 0:
            percentage = int((current / total) * 100)
            self.setValue(percentage)
            self.setFormat(f"{current}/{total} ({percentage}%)")
        else:
            self.setValue(0)
            self.setFormat("0%")

    def reset(self):
        """Reset progress bar to initial state."""
        self.setValue(0)
        self.setFormat("%p%")
        self.setMaximum(100)
        if self._animation_timer:
            self._animation_timer.stop()
