# PlexIQ v3.2 Dockerfile with GUI Support
# Multi-stage build for smaller image size

FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

# Install runtime dependencies including GUI/X11 and OpenGL support
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    # OpenGL/Mesa libraries for PyQt6 (Debian Trixie compatible)
    libgl1 \
    libglib2.0-0 \
    # X11 libraries
    libxcb-xinerama0 \
    libxcb-cursor0 \
    libxkbcommon-x11-0 \
    libxkbcommon0 \
    libxrender1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libasound2 \
    libdbus-1-3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcb-icccm4 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-randr0 \
    libxcb-render-util0 \
    libxcb-render0 \
    libxcb-shape0 \
    libxcb-sync1 \
    libxcb-util1 \
    libxcb-xfixes0 \
    libxext6 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libxcursor1 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Install PlexIQ in development mode
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -e .

# Create data directories
RUN mkdir -p /app/data/backups /app/data/logs /app/data/cache

# Create non-root user for security
RUN useradd -m -u 1000 plexiq && \
    chown -R plexiq:plexiq /app

# Switch to non-root user
USER plexiq

# Set environment variables with defaults
ENV PLEX_URL=http://10.0.0.10:32400 \
    DATA_DIR=/app/data \
    BACKUP_DIR=/app/data/backups \
    LOG_DIR=/app/data/logs \
    CACHE_DIR=/app/data/cache \
    LOG_LEVEL=INFO \
    DRY_RUN_DEFAULT=false \
    DISPLAY=:0

# Expose web port
EXPOSE 8080

# Default command - start web server
CMD ["uvicorn", "plexiq.web.app:app", "--host", "0.0.0.0", "--port", "8080"]