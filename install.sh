#!/bin/bash
# OpenManus Robust Installation Script
# With enhanced handling for large packages

set -e  # Exit on error

echo "========================================================"
echo "OpenManus Web Dashboard Installation Script"
echo "========================================================"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script requires root privileges. Please run with sudo."
    exit 1
fi

# Function to check available space and inode status
check_space() {
    echo "Checking system resources..."

    # Check disk space
    AVAILABLE_SPACE=$(df -h / | awk 'NR==2 {print $4}')
    AVAILABLE_INODES=$(df -i / | awk 'NR==2 {print $4}')

    echo "Available disk space: $AVAILABLE_SPACE"
    echo "Available inodes: $AVAILABLE_INODES"

    # Check if /tmp is a separate partition and its space
    if mount | grep -q " /tmp "; then
        TMP_SPACE=$(df -h /tmp | awk 'NR==2 {print $4}')
        echo "/tmp is a separate partition with $TMP_SPACE available"

        # If /tmp has less than 1GB free, use a custom temp directory
        if [[ $TMP_SPACE =~ ^[0-9.]+M$ ]] || [[ $TMP_SPACE =~ ^[0-9]+K$ ]]; then
            echo "WARNING: /tmp has limited space. Using custom temp directory."
            export TMPDIR=/var/tmp/openmanus-install
            mkdir -p $TMPDIR
            echo "Using $TMPDIR as temporary directory"
        fi
    fi

    echo "Resource check completed."
}

# Function to install system dependencies
install_system_deps() {
    echo "Installing system dependencies..."
    apt-get update

    # Clean apt cache first to make space
    apt-get clean

    # Install dependencies with progress display
    apt-get install -y git python3 python3-dev python3-pip python3-venv
    apt-get install -y python3-uvicorn python3-fastapi
    echo "System dependencies installed successfully."
}

# Function to clone repository
clone_repo() {
    echo "Cloning OpenManus repository..."
    if [ -d "OpenManuswebguidashboard" ]; then
        echo "Directory exists. Updating repository..."
        cd OpenManuswebguidashboard
        git pull
    else
        git clone https://github.com/mhm22332/OpenManuswebguidashboard.git
        cd OpenManuswebguidashboard
    fi
    echo "Repository cloned/updated successfully."
}

# Function to setup Python environment and install dependencies
setup_python_env() {
    echo "Setting up Python environment..."

    # Create config directory if it doesn't exist
    if [ ! -d "config" ]; then
        mkdir -p config
    fi

    # Copy example config if needed
    if [ ! -f "config/config.toml" ] && [ -f "config/config.example.toml" ]; then
        cp config/config.example.toml config/config.toml
        echo "Created config.toml from example. Please edit it with your API keys."
    fi

    echo "Installing Python dependencies..."
    # Break up pip installs into smaller chunks to avoid memory issues
    # First install essential packages
    echo "Installing core dependencies..."
    pip3 install --break-system-packages --no-cache-dir pydantic fastapi uvicorn httpx tomli aiofiles loguru

    # Then install optional packages
    echo "Installing additional dependencies..."
    pip3 install --break-system-packages --no-cache-dir -r requirements.txt --upgrade-strategy only-if-needed

    echo "Python environment setup complete."
}

# Create cleanup function to remove temporary files
cleanup() {
    echo "Performing cleanup..."
    # Remove pip cache
    rm -rf ~/.cache/pip/*
    # Clean apt cache
    apt-get clean
    # Remove temporary files
    find . -type d -name __pycache__ -exec rm -rf {} +
    find . -type f -name "*.pyc" -delete
    echo "Cleanup completed."
}

# Main installation flow
main() {
    check_space
    install_system_deps
    clone_repo
    setup_python_env
    cleanup

    echo "========================================================"
    echo "Installation complete!"
    echo "========================================================"
    echo "To run OpenManus Web Dashboard:"
    echo "  cd OpenManuswebguidashboard"
    echo "  python3 run_web.py"
    echo ""
    echo "Then open http://localhost:8000 in your browser"
    echo ""
    echo "Note: Before running, make sure to edit config/config.toml"
    echo "      with your API keys if you haven't done so already."
    echo "========================================================"
}

# Run the installation
main
