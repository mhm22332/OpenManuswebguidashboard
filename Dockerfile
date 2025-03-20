FROM python:3.12-slim

WORKDIR /app

# Install only the necessary system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy minimal requirements file
COPY requirements-minimal.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements-minimal.txt

# Clone the repository (shallow clone to save space)
RUN git clone --depth=1 --single-branch https://github.com/mhm22332/OpenManuswebguidashboard.git .

# Create config directory if not exists
RUN mkdir -p config

# Copy example config
RUN if [ -f "config/config.example.toml" ] && [ ! -f "config/config.toml" ]; then \
    cp config/config.example.toml config/config.toml; \
    fi

# Cleanup unnecessary files to reduce image size
RUN find . -type d -name __pycache__ -exec rm -rf {} +
RUN find . -type f -name "*.pyc" -delete

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["python", "run_web.py"]
