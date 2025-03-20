#!/bin/bash
# OpenManus Lightweight Installation Script
# Optimized for minimal disk usage

set -e  # Exit on error

echo "========================================================"
echo "OpenManus Web Dashboard Minimal Installation"
echo "========================================================"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script requires root privileges. Please run with sudo."
    exit 1
fi

# Function to install minimal system dependencies
install_minimal_deps() {
    echo "Installing minimal system dependencies..."
    apt-get update
    apt-get install -y python3 python3-pip
    apt-get install -y --no-install-recommends python3-uvicorn python3-fastapi
    echo "System dependencies installed successfully."
}

# Function to clone repository with shallow depth
clone_repo_minimal() {
    echo "Cloning repository (minimal version)..."
    if [ -d "OpenManuswebguidashboard" ]; then
        echo "Directory exists. Updating repository..."
        cd OpenManuswebguidashboard
        git pull --depth=1
    else
        # Shallow clone (--depth=1) for minimal disk usage
        git clone --depth=1 --single-branch https://github.com/mhm22332/OpenManuswebguidashboard.git
        cd OpenManuswebguidashboard
    fi
    echo "Repository cloned/updated successfully."
}

# Function to setup minimal Python environment
setup_minimal_env() {
    echo "Setting up minimal Python environment..."

    # Create config directory if it doesn't exist
    if [ ! -d "config" ]; then
        mkdir -p config
    fi

    # Copy example config if needed
    if [ ! -f "config/config.toml" ] && [ -f "config/config.example.toml" ]; then
        cp config/config.example.toml config/config.toml
        echo "Created config.toml from example. Please edit it with your API keys."
    fi

    echo "Installing minimal Python dependencies..."
    # Use the minimal requirements file
    if [ -f "requirements-minimal.txt" ]; then
        pip3 install --break-system-packages -r requirements-minimal.txt
    else
        # Create a minimal requirements file if it doesn't exist
        cat > requirements-minimal.txt << EOF
# Core dependencies
pydantic~=2.10.6
openai~=1.66.3
fastapi~=0.115.11
uvicorn~=0.34.0
httpx>=0.27.0
tomli>=2.0.0
aiofiles~=24.1.0
pydantic_core~=2.27.2
loguru~=0.7.3

# For web dashboard only
tiktoken~=0.9.0
EOF
        pip3 install --break-system-packages -r requirements-minimal.txt
    fi

    echo "Python environment setup complete."
}

# Function to create a cleanup script
create_cleanup_script() {
    echo "Creating cleanup script..."
    cat > cleanup.sh << EOF
#!/bin/bash
# Cleanup script for OpenManus

echo "Cleaning up temporary files and caches..."

# Clean Python cache files
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type f -name "*.pyd" -delete

# Clean git objects (if you don't need git history)
# Uncomment if you want to reduce git storage
# git gc --aggressive --prune=now

echo "Cleanup completed!"
EOF
    chmod +x cleanup.sh
    echo "Cleanup script created successfully."
}

# Main installation flow
main() {
    install_minimal_deps
    clone_repo_minimal
    setup_minimal_env
    create_cleanup_script

    echo "========================================================"
    echo "Minimal installation complete!"
    echo "========================================================"
    echo "To run OpenManus Web Dashboard:"
    echo "  cd OpenManuswebguidashboard"
    echo "  python3 run_web.py"
    echo ""
    echo "To clean up temporary files and reduce disk usage:"
    echo "  ./cleanup.sh"
    echo ""
    echo "Then open http://localhost:8000 in your browser"
    echo ""
    echo "Note: Before running, make sure to edit config/config.toml"
    echo "      with your API keys if you haven't done so already."
    echo "========================================================"
}

# Run the installation
main
