#!/usr/bin/env python3
"""
OpenManus Web Dashboard

This script runs the OpenManus web dashboard interface.
"""

import os
import sys
import traceback
import importlib

# Add diagnostic info
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Current working directory: {os.getcwd()}")
print(f"Module search paths: {sys.path}")

# Make sure the app directory is in the Python path
if os.getcwd() not in sys.path:
    sys.path.insert(0, os.getcwd())
    print(f"Added current directory to Python path: {os.getcwd()}")

try:
    import uvicorn
    print("Successfully imported uvicorn")
except ImportError as e:
    print(f"Error importing uvicorn: {e}")
    print("Please make sure uvicorn is installed: pip install uvicorn")
    sys.exit(1)

# Try importing the module directly with error handling instead of using importlib.util
try:
    # Try importing the module
    from app.web.server import app
    print("Successfully imported app.web.server")
except ImportError as e:
    print(f"Error importing app.web.server: {e}")
    print("Traceback:")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"Unexpected error: {e}")
    print("Traceback:")
    traceback.print_exc()
    sys.exit(1)

if __name__ == "__main__":
    try:
        print("Starting OpenManus Web Dashboard")
        print("Access the dashboard at http://localhost:8000")
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        print(f"Error starting the server: {e}")
        traceback.print_exc()
