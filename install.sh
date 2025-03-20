#!/bin/bash
# OpenManus Easy Installation Script
# This script automates the installation of OpenManus and its dependencies

set -e  # Exit on error

echo "========================================================"
echo "OpenManus Web Dashboard Installation Script"
echo "========================================================"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script requires root privileges. Please run with sudo."
    exit 1
fi

# Function to check and install system dependencies
install_system_deps() {
    echo "Installing system dependencies..."
    apt-get update
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
    # Use system packages when possible, override only when necessary
    pip3 install --break-system-packages -r requirements.txt

    echo "Python environment setup complete."
}

# Main installation flow
main() {
    install_system_deps
    clone_repo
    setup_python_env

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
