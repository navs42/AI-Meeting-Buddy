import os
import queue
import time
import sounddevice as sd
import vosk
from app import clean_transcript, structured_summary  # your existing functions

# Folders to save transcripts and summaries
TRANSCRIPT_FOLDER = "transcripts"
SUMMARY_FOLDER = "meeting_summaries"
os.makedirs(TRANSCRIPT_FOLDER, exist_ok=True)
os.makedirs(SUMMARY_FOLDER, exist_ok=True)

# Vosk model path
MODEL_PATH = "vosk-model-small-en-us-0.15"
model = vosk.Model(MODEL_PATH)

# Audio queue
q = queue.Queue()
accumulated_text = ""
SAMPLE_RATE = 16000

def audio_callback(indata, frames, time_info, status):
    if status:
        print(status)
    q.put(bytes(indata))

def save_final_transcript_and_summary(text, meeting_name="live_meeting"):
    cleaned_text = clean_transcript(text)
    
    # Save transcript
    transcript_file = os.path.join(TRANSCRIPT_FOLDER, meeting_name + "_transcript.txt")
    with open(transcript_file, "w", encoding="utf8") as f:
        f.write(cleaned_text)
    
    # Generate summary
    summary = structured_summary(cleaned_text, max_sentences=12)
    summary_file = os.path.join(SUMMARY_FOLDER, meeting_name + "_structured_summary.txt")
    with open(summary_file, "w", encoding="utf8") as f:
        f.write(summary)
    
    print(f"\n✅ Final transcript saved: {transcript_file}")
    print(f"✅ Final summary saved: {summary_file}")

# Start live audio capture
with sd.RawInputStream(samplerate=SAMPLE_RATE, blocksize=8000, dtype='int16',
                       channels=1, callback=audio_callback):
    print("🎤 Live transcription started. Press Ctrl+C to end the meeting.")
    rec = vosk.KaldiRecognizer(model, SAMPLE_RATE)

    try:
        while True:
            data = q.get()
            if rec.AcceptWaveform(data):
                result = rec.Result()
                text_chunk = eval(result)['text']  # result is JSON
                if text_chunk.strip():
                    accumulated_text += " " + text_chunk.strip()
            else:
                # optional: handle partial results
                pass

    except KeyboardInterrupt:
        # Meeting ended, save final transcript and summary
        save_final_transcript_and_summary(accumulated_text)
        print("🛑 Live transcription stopped.")
