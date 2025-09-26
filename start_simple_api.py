#!/usr/bin/env python3
"""
Start the simple AI Buddy API server.
This provides basic meeting management without complex transcription features.
"""

import sys
import os

def check_python():
    """Check if Python is available."""
    try:
        import flask
        import flask_cors
        print("✅ Flask dependencies are available")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install flask flask-cors")
        return False

def main():
    print("🚀 Starting AI Buddy Simple API Server...")
    
    if not check_python():
        print("\n📋 Setup Instructions:")
        print("1. Install Python from https://www.python.org/downloads/")
        print("2. Run: pip install flask flask-cors")
        print("3. Run: python start_simple_api.py")
        sys.exit(1)
    
    print("📡 API will be available at: http://localhost:5000")
    print("🔗 Health check: http://localhost:5000/api/health")
    print("📋 Meetings API: http://localhost:5000/api/meetings")
    print("Press Ctrl+C to stop the server")
    
    # Import and run the simple app
    from simple_app import app
    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == "__main__":
    main()
