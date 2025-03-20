#!/usr/bin/env python3
"""
OpenManus Web Dashboard

This script runs the OpenManus web dashboard interface.
"""

import uvicorn
from app.web.server import app

if __name__ == "__main__":
    print("Starting OpenManus Web Dashboard")
    print("Access the dashboard at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
