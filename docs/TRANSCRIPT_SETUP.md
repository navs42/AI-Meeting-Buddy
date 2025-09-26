# Live Transcript Integration Setup

This guide explains how to set up and use the live transcript functionality in AI Buddy.

## Prerequisites

1. **Python 3.8+** installed on your system
2. **Node.js** and **npm** for the frontend
3. **Microphone access** for audio capture

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Download Vosk Model

Download the Vosk model for speech recognition:

```bash
# Download the small English model (recommended for development)
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
```

### 3. Install Frontend Dependencies

```bash
npm install
```

## Running the Application

### 1. Start the Transcript Server

```bash
python start_transcript_server.py
```

This will start the Flask-SocketIO server on `http://localhost:5000`.

### 2. Start the Frontend

In a separate terminal:

```bash
npm run dev
```

This will start the React development server, typically on `http://localhost:5173`.

## Usage

1. **Navigate to a Live Meeting**: Go to the LiveMeetingPage in your application
2. **Start Transcription**: Click the "Start Recording" button in the transcript tab
3. **View Live Transcript**: The transcript will appear in real-time in the transcript panel
4. **Stop Transcription**: Click "Stop Recording" when done

## Features

- **Real-time Transcription**: Live speech-to-text conversion using Vosk
- **WebSocket Communication**: Real-time updates between frontend and backend
- **Meeting-specific Transcripts**: Each meeting has its own transcript session
- **Automatic Saving**: Transcripts are automatically saved when stopping
- **Partial Results**: Shows partial transcription results as you speak

## Technical Details

### Backend (Python)
- **Flask-SocketIO**: WebSocket server for real-time communication
- **Vosk**: Offline speech recognition
- **SoundDevice**: Audio capture from microphone
- **NLTK**: Text processing and summarization

### Frontend (React/TypeScript)
- **Socket.IO Client**: WebSocket client for real-time updates
- **React Hooks**: State management for transcript data
- **Real-time UI**: Live updates of transcript text

## Troubleshooting

### Common Issues

1. **Microphone Permission**: Make sure your browser has microphone access
2. **Port Conflicts**: Ensure ports 5000 and 5173 are available
3. **Model Download**: Verify the Vosk model is in the correct directory
4. **Dependencies**: Run `pip install -r requirements.txt` if you get import errors

### Debug Mode

The server runs in debug mode by default. Check the console for:
- WebSocket connection status
- Audio capture status
- Transcription errors

## File Structure

```
├── app.py                     # Main Flask-SocketIO server
├── start_transcript_server.py # Server startup script
├── requirements.txt           # Python dependencies
├── vosk-model-small-en-us-0.15/ # Vosk model directory
├── transcripts/              # Saved transcript files
├── meeting_summaries/        # Generated summaries
└── pages/LiveMeetingPage.tsx # Frontend transcript integration
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `WebSocket /` - Real-time transcript communication

## WebSocket Events

### Client → Server
- `start_transcription` - Start live transcription
- `stop_transcription` - Stop live transcription

### Server → Client
- `transcript_update` - New transcript text
- `transcript_partial` - Partial transcription results
- `transcription_started` - Transcription started confirmation
- `transcription_stopped` - Transcription stopped confirmation
- `transcript_complete` - Final transcript when stopping
