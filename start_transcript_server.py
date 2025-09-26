#!/usr/bin/env python3
"""
Start the transcript server for live meeting transcription.
Make sure to install dependencies first: pip install -r requirements.txt
"""

import os
import sys

def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import flask
        import flask_cors
        import flask_socketio
        import sounddevice
        import vosk
        import nltk
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_vosk_model():
    """Check if Vosk model is available."""
    model_path = "vosk-model-small-en-us-0.15"
    if not os.path.exists(model_path):
        print(f"❌ Vosk model not found at: {model_path}")
        print("Please download the model from: https://alphacephei.com/vosk/models")
        print("Extract it to the current directory")
        return False
    print("✅ Vosk model found")
    return True

def main():
    print("🎤 Starting AI Buddy Transcript Server...")
    
    if not check_dependencies():
        sys.exit(1)
    
    if not check_vosk_model():
        sys.exit(1)
    
    print("🚀 Starting server on http://localhost:5000")
    print("📡 WebSocket endpoint: ws://localhost:5000")
    print("Press Ctrl+C to stop the server")
    
    # Import and run the app
    from app import socketio, app
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

if __name__ == "__main__":
    main()
