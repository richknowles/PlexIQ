# PlexIQ v3.2 - Dockerfile
# Multi-stage build for optimized image size

FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

# Install runtime dependencies for GUI support (optional)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libxcb-xinerama0 \
    libxkbcommon-x11-0 \
    libdbus-1-3 \
    libxcb-cursor0 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Set PATH to use virtual environment
ENV PATH="/opt/venv/bin:$PATH"

# Install PlexIQ in development mode
RUN pip install -e .

# Create data directories
RUN mkdir -p /app/data/backups /app/data/logs /app/data/cache

# Create non-root user
RUN useradd -m -u 1000 plexiq && \
    chown -R plexiq:plexiq /app
USER plexiq

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PLEXIQ_DATA_DIR=/app/data

# Volume for persistent data
VOLUME ["/app/data", "/app/.env"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD plexiq --version || exit 1

# Default command (can be overridden)
CMD ["plexiq", "--help"]
