"""
PlexIQ v3 - Hotdog Slider Component
Custom slider with hotdog emoji handle and mustard branding (Rule #5: Aesthetic & Delight).
Author: Rich Knowles (via Claude-Code)
"""

from PyQt6.QtWidgets import QWidget, QHBoxLayout, QLabel, QSlider
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont


class HotdogSlider(QWidget):
    """
    Custom slider with hotdog emoji handle.
    Controls deletion threshold or queue size with mustard color scheme.
    """

    value_changed = pyqtSignal(float)

    def __init__(self, parent=None, min_val=0.0, max_val=1.0, default_val=0.7, label="Deletion Threshold"):
        super().__init__(parent)
        self._min_val = min_val
        self._max_val = max_val
        self._current_val = default_val

        self._init_ui(label)

    def _init_ui(self, label_text):
        """Initialize the slider UI."""
        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 5, 10, 5)

        self.label = QLabel(f"{label_text}:")
        self.label.setStyleSheet("color: #F4A940; font-weight: bold;")
        layout.addWidget(self.label)

        self.slider = QSlider(Qt.Orientation.Horizontal)
        self.slider.setMinimum(int(self._min_val * 100))
        self.slider.setMaximum(int(self._max_val * 100))
        self.slider.setValue(int(self._current_val * 100))
        self.slider.setTickPosition(QSlider.TickPosition.TicksBelow)
        self.slider.setTickInterval(10)
        self.slider.setStyleSheet("""
            QSlider::groove:horizontal {
                border: 1px solid #555;
                height: 8px;
                background: #2b2b2b;
                border-radius: 4px;
            }
            QSlider::handle:horizontal {
                background: #F4A940;
                border: 2px solid #d4942e;
                width: 32px;
                height: 32px;
                margin: -12px 0;
                border-radius: 16px;
            }
            QSlider::handle:horizontal:hover {
                background: #ffc857;
                border: 2px solid #F4A940;
            }
            QSlider::sub-page:horizontal {
                background: #F4A940;
                border-radius: 4px;
            }
        """)
        self.slider.valueChanged.connect(self._on_value_changed)
        layout.addWidget(self.slider)

        self.value_label = QLabel(f"🌭 {self._current_val:.0%}")
        self.value_label.setStyleSheet("color: #F4A940; min-width: 50px;")
        font = QFont()
        font.setBold(True)
        self.value_label.setFont(font)
        layout.addWidget(self.value_label)

    def _on_value_changed(self, int_value):
        """Handle slider value change."""
        self._current_val = int_value / 100.0
        self.value_label.setText(f"{self._current_val:.0%}")
        self.value_changed.emit(self._current_val)

    def value(self) -> float:
        """Get the current slider value."""
        return self._current_val

    def setValue(self, value: float):
        """Set the slider value."""
        self._current_val = max(self._min_val, min(self._max_val, value))
        self.slider.setValue(int(self._current_val * 100))
        self.value_label.setText(f"{self._current_val:.0%}")

    def setEnabled(self, enabled: bool):
        """Enable or disable the slider."""
        self.slider.setEnabled(enabled)
        opacity = "1.0" if enabled else "0.5"
        self.label.setStyleSheet(f"color: #F4A940; font-weight: bold; opacity: {opacity};")
        self.value_label.setStyleSheet(f"color: #F4A940; min-width: 50px; opacity: {opacity};")