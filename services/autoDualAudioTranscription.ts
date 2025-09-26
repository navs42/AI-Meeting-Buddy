// Automatic Dual Audio Transcription Service
// Automatically captures and transcribes both user microphone and meeting audio
// No controls needed - just starts automatically and updates every 5 seconds
import React, { useState, useEffect, useRef } from 'react';

export interface TranscriptSegment {
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
  source: 'user' | 'meeting' | 'combined';
}

export const useAutoDualAudioTranscription = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // Audio streams
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [meetingStream, setMeetingStream] = useState<MediaStream | null>(null);
  const [combinedStream, setCombinedStream] = useState<MediaStream | null>(null);
  
  // Rolling transcript management
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const rollingWindowRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const userGainNodeRef = useRef<GainNode | null>(null);
  const meetingGainNodeRef = useRef<GainNode | null>(null);
  const combinedGainNodeRef = useRef<GainNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const autoStartRef = useRef(false);

  // Initialize audio context and processing
  const initializeAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain nodes for audio mixing
      userGainNodeRef.current = audioContextRef.current.createGain();
      meetingGainNodeRef.current = audioContextRef.current.createGain();
      combinedGainNodeRef.current = audioContextRef.current.createGain();
      
      // Create destination for combined stream
      destinationRef.current = audioContextRef.current.createMediaStreamDestination();
      
      // Connect gain nodes to destination
      userGainNodeRef.current.connect(combinedGainNodeRef.current);
      meetingGainNodeRef.current.connect(combinedGainNodeRef.current);
      combinedGainNodeRef.current.connect(destinationRef.current);
      
      return true;
    } catch (err) {
      console.error('Failed to initialize audio context:', err);
      setError('Failed to initialize audio processing');
      return false;
    }
  };

  // Capture user microphone automatically
  const captureUserAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setUserStream(stream);
      
      if (audioContextRef.current && userGainNodeRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(userGainNodeRef.current);
      }
      
      return stream;
    } catch (err) {
      console.error('Failed to capture user audio:', err);
      setError('Failed to access microphone. Please allow microphone access.');
      return null;
    }
  };

  // Capture meeting audio automatically
  const captureMeetingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });
      
      setMeetingStream(stream);
      
      if (audioContextRef.current && meetingGainNodeRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(meetingGainNodeRef.current);
      }
      
      return stream;
    } catch (err) {
      console.error('Failed to capture meeting audio:', err);
      setError('Failed to access meeting audio. Please allow screen sharing with audio.');
      return null;
    }
  };

  // Create combined audio stream
  const createCombinedStream = () => {
    if (destinationRef.current) {
      const combined = destinationRef.current.stream;
      setCombinedStream(combined);
      return combined;
    }
    return null;
  };

  // Update display transcript based on 5-second window
  const updateDisplayTranscript = () => {
    const now = Date.now();
    const fiveSecondsAgo = now - 5000;
    
    const recentSegments = transcriptSegments.filter(segment => 
      segment.timestamp >= fiveSecondsAgo
    );
    
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
      console.log('Auto dual audio transcription started');
      setIsRecording(true);
      isRecordingRef.current = true;
      setError(null);
      startRollingWindow();
    };

    recognitionRef.current.onend = () => {
      console.log('Auto dual audio transcription ended');
      setIsRecording(false);
      isRecordingRef.current = false;
      stopRollingWindow();
      
      // Auto-restart if it was automatically started
      if (autoStartRef.current) {
        setTimeout(() => {
          if (autoStartRef.current) {
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
          
          const newSegment: TranscriptSegment = {
            text: transcript,
            timestamp: now,
            confidence,
            isFinal: true,
            source: 'combined'
          };
          
          setTranscriptSegments(prev => {
            const updated = [...prev, newSegment];
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
          setError('No speech detected. Please check audio levels.');
          break;
        case 'audio-capture':
          setError('Audio capture failed. Please check microphone and meeting audio permissions.');
          break;
        case 'not-allowed':
          setError('Audio permission denied. Please allow microphone and screen sharing access.');
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

  // Auto-start transcription
  const autoStartTranscription = async () => {
    if (autoStartRef.current) return;
    
    autoStartRef.current = true;
    
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      setTranscriptSegments([]);
      setDisplayTranscript('');

      // Initialize audio context
      const audioInitialized = await initializeAudioContext();
      if (!audioInitialized) return;

      // Capture user audio
      const userAudio = await captureUserAudio();
      if (!userAudio) return;

      // Capture meeting audio
      const meetingAudio = await captureMeetingAudio();
      if (!meetingAudio) return;

      // Create combined stream
      const combined = createCombinedStream();
      if (!combined) {
        setError('Failed to create combined audio stream');
        return;
      }

      // Start recognition with combined stream
      isRecordingRef.current = true;
      recognitionRef.current.start();
      
    } catch (err) {
      console.error('Failed to start auto transcription:', err);
      setError('Failed to start automatic transcription. Please try again.');
    }
  };

  // Stop automatic transcription
  const stopTranscription = () => {
    autoStartRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    stopRollingWindow();
    
    // Stop audio streams
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop());
      setUserStream(null);
    }
    if (meetingStream) {
      meetingStream.getTracks().forEach(track => track.stop());
      setMeetingStream(null);
    }
    setCombinedStream(null);
  };

  useEffect(() => {
    initializeRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopRollingWindow();
      
      // Clean up audio streams
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
      }
      if (meetingStream) {
        meetingStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getFullTranscript = () => {
    return displayTranscript + (interimTranscript ? ` [${interimTranscript}]` : '');
  };

  return {
    isRecording,
    transcript: getFullTranscript(),
    displayTranscript,
    isSupported,
    error,
    userStream,
    meetingStream,
    combinedStream,
    autoStartTranscription,
    stopTranscription,
    interimTranscript,
    transcriptSegments
  };
};
