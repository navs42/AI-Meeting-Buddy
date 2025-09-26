// Dual Audio Transcription Service
// Supports both internal (microphone) and external audio sources
import React, { useState, useEffect, useRef } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export interface TranscriptSegment {
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
  audioSource: 'internal' | 'external';
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  audioSource: 'internal' | 'external';
}

export const useDualAudioTranscription = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioSource, setAudioSource] = useState<'internal' | 'external'>('internal');
  const [availableDevices, setAvailableDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');
  
  // Rolling transcript management
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const rollingWindowRef = useRef<NodeJS.Timeout | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  // Get available audio devices
  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }));
      setAvailableDevices(audioInputs);
    } catch (err) {
      console.error('Failed to get audio devices:', err);
    }
  };

  // Update display transcript based on 5-second window
  const updateDisplayTranscript = () => {
    const now = Date.now();
    const fiveSecondsAgo = now - 5000; // 5 seconds in milliseconds
    
    // Filter segments from last 5 seconds
    const recentSegments = transcriptSegments.filter(segment => 
      segment.timestamp >= fiveSecondsAgo
    );
    
    // Combine recent segments
    const recentText = recentSegments
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(segment => segment.text)
      .join(' ');
    
    setDisplayTranscript(recentText);
  };

  // Start rolling window update
  const startRollingWindow = () => {
    if (rollingWindowRef.current) {
      clearInterval(rollingWindowRef.current);
    }
    
    rollingWindowRef.current = setInterval(() => {
      updateDisplayTranscript();
    }, 1000); // Update every second
  };

  // Stop rolling window update
  const stopRollingWindow = () => {
    if (rollingWindowRef.current) {
      clearInterval(rollingWindowRef.current);
      rollingWindowRef.current = null;
    }
  };

  // Initialize speech recognition with device selection
  const initializeRecognition = async () => {
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

    // Set up event handlers
    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      isRecordingRef.current = true;
      setError(null);
      startRollingWindow();
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      isRecordingRef.current = false;
      stopRollingWindow();
      
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
      const now = Date.now();
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          
          // Add final segment to transcript segments
          const newSegment: TranscriptSegment = {
            text: transcript,
            timestamp: now,
            confidence,
            isFinal: true,
            audioSource
          };
          
          setTranscriptSegments(prev => {
            const updated = [...prev, newSegment];
            // Keep only last 30 seconds of segments to prevent memory issues
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
      stopRollingWindow();
    };
  };

  useEffect(() => {
    initializeRecognition();
    getAudioDevices();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopRollingWindow();
    };
  }, []);

  const startRecording = async () => {
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
      setTranscriptSegments([]);
      setDisplayTranscript('');
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
      stopRollingWindow();
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setTranscriptSegments([]);
    setDisplayTranscript('');
  };

  const switchAudioSource = (source: 'internal' | 'external') => {
    setAudioSource(source);
    if (isRecording) {
      stopRecording();
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  };

  const selectAudioDevice = (deviceId: string) => {
    setSelectedDevice(deviceId);
    // Note: Web Speech API doesn't directly support device selection
    // This would require additional implementation for external audio
  };

  const getFullTranscript = () => {
    return displayTranscript + (interimTranscript ? ` [${interimTranscript}]` : '');
  };

  return {
    isRecording,
    transcript: getFullTranscript(),
    displayTranscript,
    isSupported,
    error,
    audioSource,
    availableDevices,
    selectedDevice,
    startRecording,
    stopRecording,
    clearTranscript,
    switchAudioSource,
    selectAudioDevice,
    interimTranscript,
    transcriptSegments
  };
};
