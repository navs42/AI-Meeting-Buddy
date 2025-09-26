// Simple Audio Transcription Service
// Handles real-time audio transcription with better error handling
import React, { useState, useEffect, useRef } from 'react';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

export const useSimpleAudioTranscription = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setIsSupported(true);
    
    // Initialize recognition
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    // Event handlers
    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      isRecordingRef.current = true;
      setError(null);
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      isRecordingRef.current = false;
      
      // Auto-restart if it was manually started
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
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          setTranscript(prev => prev + transcript + ' ');
          setInterimTranscript('');
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
          setError('No speech detected. Please try speaking louder.');
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

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not available');
      return;
    }

    if (isRecording) {
      console.log('Already recording');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      isRecordingRef.current = true;
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      isRecordingRef.current = false;
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const getFullTranscript = () => {
    return transcript + (interimTranscript ? `[${interimTranscript}]` : '');
  };

  return {
    isRecording,
    transcript: getFullTranscript(),
    isSupported,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
    interimTranscript
  };
};
