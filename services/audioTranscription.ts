// Audio Transcription Service
// Handles real-time audio transcription from external sources
import React from 'react';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

export interface AudioTranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class AudioTranscriptionService {
  private recognition: any = null;
  private isRecording = false;
  private transcript = '';
  private onTranscriptUpdate?: (result: TranscriptionResult) => void;
  private onError?: (error: string) => void;
  private onStatusChange?: (isRecording: boolean) => void;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isRecording = true;
      this.onStatusChange?.(true);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      this.onStatusChange?.(false);
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          this.transcript += transcript;
          
          this.onTranscriptUpdate?.({
            text: transcript,
            confidence,
            isFinal: true,
            timestamp: Date.now()
          });
        } else {
          interimTranscript += transcript;
          
          this.onTranscriptUpdate?.({
            text: transcript,
            confidence,
            isFinal: false,
            timestamp: Date.now()
          });
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.onError?.(event.error);
    };
  }

  public startRecording(options?: AudioTranscriptionOptions) {
    if (!this.recognition) {
      this.onError?.('Speech recognition not supported');
      return;
    }

    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    // Apply options
    if (options?.language) {
      this.recognition.lang = options.language;
    }
    if (options?.continuous !== undefined) {
      this.recognition.continuous = options.continuous;
    }
    if (options?.interimResults !== undefined) {
      this.recognition.interimResults = options.interimResults;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.onError?.('Failed to start recording');
    }
  }

  public stopRecording() {
    if (!this.recognition || !this.isRecording) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }

  public getTranscript(): string {
    return this.transcript;
  }

  public clearTranscript() {
    this.transcript = '';
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  // Event handlers
  public onTranscriptUpdateHandler(callback: (result: TranscriptionResult) => void) {
    this.onTranscriptUpdate = callback;
  }

  public onErrorHandler(callback: (error: string) => void) {
    this.onError = callback;
  }

  public onStatusChangeHandler(callback: (isRecording: boolean) => void) {
    this.onStatusChange = callback;
  }

  // Cleanup
  public destroy() {
    if (this.isRecording) {
      this.stopRecording();
    }
    this.recognition = null;
  }
}

// Utility function to check browser support
export const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Utility function to get available languages
export const getSupportedLanguages = (): string[] => {
  return [
    'en-US', 'en-GB', 'en-AU', 'en-CA',
    'es-ES', 'es-MX', 'fr-FR', 'fr-CA',
    'de-DE', 'it-IT', 'pt-BR', 'pt-PT',
    'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN',
    'ar-SA', 'hi-IN', 'th-TH', 'tr-TR'
  ];
};

// React hook for easy integration
export const useAudioTranscription = () => {
  const [transcriptionService] = React.useState(() => new AudioTranscriptionService());
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [isSupported, setIsSupported] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsSupported(transcriptionService.isSupported());
    
    transcriptionService.onStatusChangeHandler(setIsRecording);
    transcriptionService.onTranscriptUpdateHandler((result) => {
      if (result.isFinal) {
        setTranscript(prev => prev + result.text);
      }
    });
    transcriptionService.onErrorHandler(setError);

    return () => {
      transcriptionService.destroy();
    };
  }, [transcriptionService]);

  const startRecording = () => {
    setError(null);
    transcriptionService.startRecording();
  };

  const stopRecording = () => {
    transcriptionService.stopRecording();
  };

  const clearTranscript = () => {
    transcriptionService.clearTranscript();
    setTranscript('');
  };

  return {
    isRecording,
    transcript,
    isSupported,
    error,
    startRecording,
    stopRecording,
    clearTranscript
  };
};
