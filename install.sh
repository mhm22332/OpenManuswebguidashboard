#!/bin/bash
# OpenManus Installation Script with Virtual Environment
# Completely isolated from system packages to avoid conflicts

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

        # If /tmp has limited space, use a custom temp directory
        if [[ $TMP_SPACE =~ ^[0-9.]+M$ ]] || [[ $TMP_SPACE =~ ^[0-9]+K$ ]]; then
            echo "WARNING: /tmp has limited space. Using custom temp directory."
            export TMPDIR=/var/tmp/openmanus-install
            mkdir -p $TMPDIR
            echo "Using $TMPDIR as temporary directory"
        fi
    fi

    echo "Resource check completed."
}

# Function to install minimal system dependencies
install_system_deps() {
    echo "Installing minimal system dependencies..."
    apt-get update

    # Clean apt cache first to make space
    apt-get clean

    # Only install git and Python3 with venv support
    apt-get install -y git python3 python3-venv python3-pip

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

# Function to create and setup Python virtual environment
setup_venv() {
    echo "Creating Python virtual environment..."

    # Create virtual environment
    python3 -m venv .venv

    # Activate virtual environment
    source .venv/bin/activate

    # Upgrade pip in the virtual environment
    pip install --upgrade pip

    echo "Virtual environment created and activated."
}

# Function to setup configuration and install dependencies in venv
setup_dependencies() {
    echo "Setting up configuration..."

    # Create config directory if it doesn't exist
    if [ ! -d "config" ]; then
        mkdir -p config
    fi

    # Copy example config if needed
    if [ ! -f "config/config.toml" ] && [ -f "config/config.example.toml" ]; then
        cp config/config.example.toml config/config.toml
        echo "Created config.toml from example. Please edit it with your API keys."
    fi

    echo "Installing Python dependencies in virtual environment..."
    # Install dependencies inside the virtual environment
    # Using --no-cache-dir to avoid disk space issues
    pip install --no-cache-dir -r requirements.txt

    # Install additional dependencies that might be missing
    echo "Installing additional required packages..."
    pip install --no-cache-dir python-multipart fastapi uvicorn httpx loguru aiofiles tomli browser-use

    echo "Dependencies installed successfully."
}

# Create a launcher script
create_launcher() {
    echo "Creating launcher script..."

    cat > run_dashboard.sh << EOF
#!/bin/bash
# Launcher for OpenManus Web Dashboard

cd "\$(dirname "\$0")"
source .venv/bin/activate
python3 run_web.py

EOF

    chmod +x run_dashboard.sh
    echo "Launcher script created."
}

# Create cleanup function to remove temporary files
cleanup() {
    echo "Performing cleanup..."
    # Clean apt cache
    apt-get clean
    # Remove pip cache in virtual environment
    rm -rf .venv/pip-cache
    # Remove Python cache files
    find . -type d -name __pycache__ -exec rm -rf {} +
    find . -type f -name "*.pyc" -delete
    echo "Cleanup completed."
}

# Main installation flow
main() {
    check_space
    install_system_deps
    clone_repo
    setup_venv
    setup_dependencies
    create_launcher
    cleanup

    echo "========================================================"
    echo "Installation complete!"
    echo "========================================================"
    echo "To run OpenManus Web Dashboard:"
    echo "  cd OpenManuswebguidashboard"
    echo "  ./run_dashboard.sh"
    echo ""
    echo "Then open http://localhost:8000 in your browser"
    echo ""
    echo "Note: Before running, make sure to edit config/config.toml"
    echo "      with your API keys if you haven't done so already."
    echo "========================================================"
}

# Run the installation
main
