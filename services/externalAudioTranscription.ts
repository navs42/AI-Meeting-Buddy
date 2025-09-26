// External Audio Transcription Service
// Captures 30 seconds of external audio (microphone) and summarizes it
import React, { useState, useEffect, useRef } from 'react';

export interface AudioSegment {
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
}

export interface AudioSummary {
  text: string;
  summary: string;
  timestamp: number;
  duration: number;
  wordCount: number;
}

export const useExternalAudioTranscription = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // Audio capture
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // 30-second rolling capture
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [currentSummary, setCurrentSummary] = useState<AudioSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // Audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const captureTimerRef = useRef<NodeJS.Timeout | null>(null);
  const summaryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  const initializeAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      return true;
    } catch (err) {
      console.error('Failed to initialize audio context:', err);
      setError('Failed to initialize audio processing');
      return false;
    }
  };

  // Capture external audio (microphone)
  const captureExternalAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setAudioStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to capture external audio:', err);
      setError('Failed to access microphone. Please allow microphone access.');
      return null;
    }
  };

  // Initialize speech recognition
  const initializeRecognition = async () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setIsSupported(true);
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log('External audio transcription started');
      setIsRecording(true);
      isRecordingRef.current = true;
      setError(null);
    };

    recognitionRef.current.onend = () => {
      console.log('External audio transcription ended');
      setIsRecording(false);
      isRecordingRef.current = false;
      
      // Auto-restart if it was automatically started
      if (isRecordingRef.current) {
        setTimeout(() => {
          if (isRecordingRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current.onresult = (event: any) => {
      const now = Date.now();
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          
          const newSegment: AudioSegment = {
            text: transcript,
            timestamp: now,
            confidence,
            isFinal: true
          };
          
          setAudioSegments(prev => {
            const updated = [...prev, newSegment];
            // Keep only last 30 seconds of segments
            return updated.filter(segment => segment.timestamp >= now - 30000);
          });
          
          setTranscript(prev => prev + transcript + ' ');
        } else {
          interimTranscript += transcript;
          setInterimTranscript(interimTranscript);
        }
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please speak louder.');
          break;
        case 'audio-capture':
          setError('Microphone not accessible. Please check permissions.');
          break;
        case 'not-allowed':
          setError('Microphone permission denied. Please allow microphone access.');
          break;
        case 'network':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsRecording(false);
      isRecordingRef.current = false;
    };
  };

  // Generate summary for 30-second audio
  const generateSummary = async (segments: AudioSegment[]) => {
    if (segments.length === 0) return null;
    
    setIsSummarizing(true);
    
    try {
      const fullText = segments
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(segment => segment.text)
        .join(' ');
      
      const wordCount = fullText.split(' ').length;
      const duration = 30; // 30 seconds
      const timestamp = Date.now();
      
      // Simple summarization logic
      const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const summary = sentences.length > 0 
        ? sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.'
        : fullText;
      
      const audioSummary: AudioSummary = {
        text: fullText,
        summary: summary,
        timestamp,
        duration,
        wordCount
      };
      
      setCurrentSummary(audioSummary);
      return audioSummary;
    } catch (err) {
      console.error('Failed to generate summary:', err);
      return null;
    } finally {
      setIsSummarizing(false);
    }
  };

  // Start 30-second capture and summarization
  const startCaptureAndSummarize = async () => {
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      setAudioSegments([]);
      setCurrentSummary(null);

      // Initialize audio context
      const audioInitialized = await initializeAudioContext();
      if (!audioInitialized) return;

      // Capture external audio
      const audio = await captureExternalAudio();
      if (!audio) return;

      // Start recognition
      isRecordingRef.current = true;
      recognitionRef.current.start();
      
      // Set up 30-second capture timer
      captureTimerRef.current = setInterval(() => {
        if (audioSegments.length > 0) {
          generateSummary(audioSegments);
        }
      }, 30000); // Every 30 seconds
      
    } catch (err) {
      console.error('Failed to start capture and summarize:', err);
      setError('Failed to start audio capture. Please try again.');
    }
  };

  // Stop capture and summarization
  const stopCapture = () => {
    isRecordingRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
    
    if (summaryTimerRef.current) {
      clearTimeout(summaryTimerRef.current);
      summaryTimerRef.current = null;
    }
    
    // Stop audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  // Get current 30-second window
  const getCurrentWindow = () => {
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;
    
    return audioSegments.filter(segment => 
      segment.timestamp >= thirtySecondsAgo
    );
  };

  // Get current window text
  const getCurrentWindowText = () => {
    const currentWindow = getCurrentWindow();
    return currentWindow
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(segment => segment.text)
      .join(' ');
  };

  useEffect(() => {
    initializeRecognition();

    // Start capture automatically when component mounts
    const timer = setTimeout(() => {
      startCaptureAndSummarize();
    }, 1000); // Start after 1 second

    return () => {
      clearTimeout(timer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
      }
      
      if (summaryTimerRef.current) {
        clearTimeout(summaryTimerRef.current);
      }
      
      // Clean up audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getFullTranscript = () => {
    return getCurrentWindowText() + (interimTranscript ? ` [${interimTranscript}]` : '');
  };

  return {
    isRecording,
    transcript: getFullTranscript(),
    isSupported,
    error,
    audioStream,
    currentSummary,
    isSummarizing,
    audioSegments,
    getCurrentWindow,
    getCurrentWindowText,
    startCaptureAndSummarize,
    stopCapture
  };
};
