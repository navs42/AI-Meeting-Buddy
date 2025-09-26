import os
import queue
import time
import sounddevice as sd
import vosk
import nltk
import re
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize
import heapq
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')

# Initialize Flask app with SocketIO
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ---------------- Configuration ----------------
TRANSCRIPT_FOLDER = "transcripts"
SUMMARY_FOLDER = "meeting_summaries"
os.makedirs(TRANSCRIPT_FOLDER, exist_ok=True)
os.makedirs(SUMMARY_FOLDER, exist_ok=True)

MODEL_PATH = "vosk-model-small-en-us-0.15"  # path to Vosk model folder
SAMPLE_RATE = 16000

FILLER_WORDS = ["en", "then", "uh", "um", "okay", "so", "like", "actually", "basically"]

# ---------------- Helper Functions ----------------
def clean_transcript(text):
    """Clean the transcript: remove filler words, normalize whitespace."""
    text = re.sub(r'\s+', ' ', text).strip()
    for word in FILLER_WORDS:
        text = re.sub(r'\b' + re.escape(word) + r'\b', '', text, flags=re.IGNORECASE)
    return text

def structured_summary(text, max_sentences=10):
    """Generate a structured summary with key points, action items, and decisions."""
    text = clean_transcript(text)
    sentences = sent_tokenize(text)
    stop_words = set(stopwords.words('english'))

    # Score sentences by word frequency
    word_freq = {}
    for word in word_tokenize(text.lower()):
        if word.isalpha() and word not in stop_words:
            word_freq[word] = word_freq.get(word, 0) + 1

    if not word_freq:
        return "No meaningful content to summarize."

    max_freq = max(word_freq.values())
    for word in word_freq:
        word_freq[word] /= max_freq

    sentence_scores = {}
    for sent in sentences:
        for word in word_tokenize(sent.lower()):
            if word in word_freq and len(sent.split()) <= 50:
                sentence_scores[sent] = sentence_scores.get(sent, 0) + word_freq[word]

    top_sentences = heapq.nlargest(max_sentences, sentence_scores, key=sentence_scores.get)

    # Structured summary
    summary_text = "📝 Meeting Summary\n\n"
    summary_text += "Key Points:\n"
    for s in top_sentences:
        summary_text += f"- {s}\n"

    # Action items
    action_items = [s for s in sentences if re.search(r'\b(action|task|follow[- ]?up|responsible|assign)\b', s, re.IGNORECASE)]
    if action_items:
        summary_text += "\nAction Items:\n"
        for a in action_items:
            summary_text += f"- {a}\n"

    # Decisions
    decisions = [s for s in sentences if re.search(r'\b(decision|decided|approved|agreement)\b', s, re.IGNORECASE)]
    if decisions:
        summary_text += "\nDecisions Made:\n"
        for d in decisions:
            summary_text += f"- {d}\n"

    return summary_text

def save_final_transcript_and_summary(text, meeting_name="live_meeting"):
    """Save the final transcript and summary to files."""
    cleaned_text = clean_transcript(text)

    transcript_file = os.path.join(TRANSCRIPT_FOLDER, meeting_name + "_transcript.txt")
    with open(transcript_file, "w", encoding="utf8") as f:
        f.write(cleaned_text)

    summary = structured_summary(cleaned_text, max_sentences=12)
    summary_file = os.path.join(SUMMARY_FOLDER, meeting_name + "_structured_summary.txt")
    with open(summary_file, "w", encoding="utf8") as f:
        f.write(summary)

    print(f"\n✅ Final transcript saved: {transcript_file}")
    print(f"✅ Final summary saved: {summary_file}")

# ---------------- Live Transcription ----------------
def main():
    q = queue.Queue()
    accumulated_text = ""

    def audio_callback(indata, frames, time_info, status):
        if status:
            print(status)
        q.put(bytes(indata))

    print("🎤 Live transcription started. Press Ctrl+C to end the meeting.\n")
    
    model = vosk.Model(MODEL_PATH)
    rec = vosk.KaldiRecognizer(model, SAMPLE_RATE)

    with sd.RawInputStream(samplerate=SAMPLE_RATE, blocksize=8000, dtype='int16',
                           channels=1, callback=audio_callback):
        try:
            while True:
                data = q.get()
                if rec.AcceptWaveform(data):
                    result = rec.Result()
                    text_chunk = json.loads(result)['text']
                    if text_chunk.strip():
                        accumulated_text += " " + text_chunk.strip()
                        print(f"[Live] {text_chunk.strip()}")
                else:
                    partial = json.loads(rec.PartialResult())['partial']
                    if partial.strip():
                        print(f"[Partial] {partial}", end='\r')  # shows partial text live

        except KeyboardInterrupt:
            save_final_transcript_and_summary(accumulated_text)
            print("🛑 Live transcription stopped.")

# ---------------- WebSocket Handlers ----------------
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('status', {'message': 'Connected to transcript service'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('start_transcription')
def handle_start_transcription(data):
    meeting_id = data.get('meeting_id', 'default')
    print(f'Starting transcription for meeting: {meeting_id}')
    
    # Start transcription in a separate thread
    thread = threading.Thread(target=start_live_transcription, args=(meeting_id,))
    thread.daemon = True
    thread.start()
    
    emit('transcription_started', {'meeting_id': meeting_id})

@socketio.on('stop_transcription')
def handle_stop_transcription(data):
    meeting_id = data.get('meeting_id', 'default')
    print(f'Stopping transcription for meeting: {meeting_id}')
    # Set a flag to stop transcription
    global transcription_active
    transcription_active = False
    emit('transcription_stopped', {'meeting_id': meeting_id})

# Global variables for transcription control
transcription_active = False
transcription_threads = {}

def start_live_transcription(meeting_id):
    global transcription_active
    transcription_active = True
    
    q = queue.Queue()
    accumulated_text = ""
    
    def audio_callback(indata, frames, time_info, status):
        if status:
            print(status)
        q.put(bytes(indata))
    
    print(f"🎤 Live transcription started for meeting: {meeting_id}")
    
    model = vosk.Model(MODEL_PATH)
    rec = vosk.KaldiRecognizer(model, SAMPLE_RATE)
    
    with sd.RawInputStream(samplerate=SAMPLE_RATE, blocksize=8000, dtype='int16',
                           channels=1, callback=audio_callback):
        try:
            while transcription_active:
                data = q.get()
                if rec.AcceptWaveform(data):
                    result = rec.Result()
                    text_chunk = json.loads(result)['text']
                    if text_chunk.strip():
                        accumulated_text += " " + text_chunk.strip()
                        # Emit real-time transcript to connected clients
                        socketio.emit('transcript_update', {
                            'meeting_id': meeting_id,
                            'text': text_chunk.strip(),
                            'full_transcript': accumulated_text
                        })
                        print(f"[Live] {text_chunk.strip()}")
                else:
                    partial = json.loads(rec.PartialResult())['partial']
                    if partial.strip():
                        # Emit partial results for real-time display
                        socketio.emit('transcript_partial', {
                            'meeting_id': meeting_id,
                            'partial_text': partial.strip()
                        })
                        print(f"[Partial] {partial}", end='\r')
        except Exception as e:
            print(f"Transcription error: {e}")
        finally:
            # Save final transcript when stopping
            if accumulated_text.strip():
                save_final_transcript_and_summary(accumulated_text, f"meeting_{meeting_id}")
                socketio.emit('transcript_complete', {
                    'meeting_id': meeting_id,
                    'final_transcript': accumulated_text
                })

# ---------------- API Routes ----------------
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'transcript-service'})

# ---------------- Entry Point ----------------
if __name__ == "__main__":
    # Run the Flask-SocketIO app
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
