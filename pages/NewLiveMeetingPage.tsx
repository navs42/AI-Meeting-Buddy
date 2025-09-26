import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Meeting } from '../types';
import * as api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useExternalAudioTranscription } from '../services/externalAudioTranscription';
import { 
    MicOnIcon, MicOffIcon, CameraOnIcon, CameraOffIcon, ScreenShareIcon, EndCallIcon, UsersIcon, MessageSquareIcon, BotMessageSquareIcon
} from '../components/Icons';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// External Audio Transcription Panel - 30-second capture and summarization
const LiveTranscriptionPanel: React.FC<{
    transcript: string;
    isRecording: boolean;
    isSupported: boolean;
    error?: string | null;
    audioStream: MediaStream | null;
    currentSummary: any;
    isSummarizing: boolean;
    getCurrentWindowText: () => string;
}> = ({ 
    transcript, 
    isRecording, 
    isSupported, 
    error, 
    audioStream,
    currentSummary,
    isSummarizing,
    getCurrentWindowText
}) => {
    return (
        <div className="h-full bg-black/20 backdrop-blur-lg rounded-lg border border-white/20 p-3 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquareIcon className="w-4 h-4" />
                    External Audio Capture
                </h3>
                <div className="flex items-center gap-1">
                    {isSupported ? (
                        isRecording ? (
                            <div className="text-xs text-green-400 flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                Capturing
                            </div>
                        ) : (
                            <div className="text-xs text-yellow-400">Starting...</div>
                        )
                    ) : (
                        <div className="text-xs text-yellow-400">Not Supported</div>
                    )}
                </div>
            </div>

            {/* Audio Status */}
            <div className="mb-3 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${audioStream ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-neutral-300">External Audio: {audioStream ? 'Active' : 'Connecting...'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${isSummarizing ? 'bg-blue-400 animate-pulse' : 'bg-neutral-400'}`}></div>
                    <span className="text-neutral-300">Summarizing: {isSummarizing ? 'Processing...' : 'Ready'}</span>
                </div>
            </div>
            
            {/* Current 30-Second Window */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {error && (
                    <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-500/30">
                        <div className="font-semibold">Error:</div>
                        <div>{error}</div>
                    </div>
                )}
                
                {!isSupported && !error && (
                    <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-500/30">
                        <div className="font-semibold">Browser Not Supported:</div>
                        <div>Please use Chrome, Edge, or Safari for live transcription.</div>
                    </div>
                )}
                
                {/* Current 30-Second Window */}
                <div className="text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                    <div className="mb-1 text-xs text-blue-400 font-semibold">
                        Current 30-Second Window:
                    </div>
                    <div className="bg-neutral-800/50 p-2 rounded border border-neutral-600/50 min-h-[60px]">
                        {getCurrentWindowText() || "Capturing 30 seconds of external audio...\n\nSpeak into your microphone to see transcription."}
                    </div>
                </div>
                
                {/* Current Summary */}
                {currentSummary && (
                    <div className="text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                        <div className="mb-1 text-xs text-green-400 font-semibold">
                            Latest Summary (30s):
                        </div>
                        <div className="bg-green-900/20 p-2 rounded border border-green-500/30 min-h-[40px]">
                            <div className="text-green-300">{currentSummary.summary}</div>
                            <div className="text-xs text-green-400 mt-1">
                                {currentSummary.wordCount} words • {currentSummary.duration}s
                            </div>
                        </div>
                    </div>
                )}
                
                {isRecording && (
                    <div className="text-xs text-green-400 flex items-center gap-2 bg-green-900/20 p-2 rounded border border-green-500/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="font-semibold">Capturing external audio for 30-second summaries...</div>
                    </div>
                )}
                
                {transcript && (
                    <div className="flex gap-2">
                        <div className="text-xs text-neutral-400 self-center">
                            {transcript.split(' ').length} words
                        </div>
                        <div className="text-xs text-blue-400 self-center">
                            30s capture
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Manual Notes Panel Component
const ManualNotesPanel: React.FC<{
    notes: string;
    onNotesChange: (notes: string) => void;
    onSaveNotes: () => void;
    isSaving: boolean;
}> = ({ notes, onNotesChange, onSaveNotes, isSaving }) => {
    return (
        <div className="h-full bg-black/20 backdrop-blur-lg rounded-lg border border-white/20 p-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Manual Notes</h3>
                <Button 
                    onClick={onSaveNotes} 
                    disabled={isSaving} 
                    size="sm"
                    className="bg-primary text-white text-xs px-2 py-1"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>
            
            <div className="flex-1">
                <textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    className="w-full h-full bg-transparent text-neutral-200 border border-white/30 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                    placeholder="Type your notes here..."
                />
            </div>
        </div>
    );
};

// AI Chat Panel Component
const AIChatPanel: React.FC<{
    messages: Array<{ id: string; role: 'user' | 'ai'; content: string; timestamp: string }>;
    onSendMessage: (message: string) => void;
    newMessage: string;
    onNewMessageChange: (message: string) => void;
}> = ({ messages, onSendMessage, newMessage, onNewMessageChange }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="h-full bg-black/20 backdrop-blur-lg rounded-lg border border-white/20 p-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <BotMessageSquareIcon className="w-4 h-4" />
                    AI Assistant
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-3 space-y-2">
                {messages.map((message) => (
                    <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs ${
                            message.role === 'user' ? 'bg-blue-500' : 'bg-primary'
                        }`}>
                            {message.role === 'user' ? 'U' : 'A'}
                        </div>
                        <div className={`max-w-[80%] p-2 rounded-lg text-xs ${
                            message.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/10 text-neutral-200'
                        }`}>
                            <p>{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="flex gap-2">
                <Input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => onNewMessageChange(e.target.value)}
                    placeholder="Ask AI Assistant..." 
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-neutral-400 text-xs"
                    onKeyPress={(e) => e.key === 'Enter' && onSendMessage(newMessage)}
                />
                <Button 
                    onClick={() => onSendMessage(newMessage)}
                    size="sm"
                    className="bg-primary text-white text-xs px-2 py-1"
                >
                    Send
                </Button>
            </div>
        </div>
    );
};

// Main Live Meeting Page Component
const NewLiveMeetingPage: React.FC = () => {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const { state, dispatch } = useAppContext();
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMicOn, setMicOn] = useState(true);
    const [isCameraOn, setCameraOn] = useState(true);
    const [isSharing, setSharing] = useState(false);
    
    // External audio transcription with 30-second capture and summarization
    const { 
        isRecording, 
        transcript, 
        isSupported, 
        error, 
        audioStream,
        currentSummary,
        isSummarizing,
        getCurrentWindowText,
        startCaptureAndSummarize,
        stopCapture
    } = useExternalAudioTranscription();
    
    // Manual notes
    const [manualNotes, setManualNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    
    // AI chat
    const [aiMessages, setAiMessages] = useState<Array<{ id: string; role: 'user' | 'ai'; content: string; timestamp: string }>>([
        {
            id: '1',
            role: 'ai',
            content: 'Hello! I\'m your AI meeting assistant. I can help you with meeting notes, action items, and answer questions about the discussion.',
            timestamp: new Date().toLocaleTimeString()
        }
    ]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const fetchMeeting = async () => {
            if (!meetingId) return;
            setLoading(true);
            try {
                const fetchedMeeting = await api.getMeetingById(meetingId);
                if(fetchedMeeting) {
                    setMeeting(fetchedMeeting);
                    setManualNotes(fetchedMeeting.manualNotes || '');
                } else {
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error("Failed to fetch meeting", error);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchMeeting();
    }, [meetingId, navigate]);

    const handleSaveNotes = async () => {
        if (!meeting) return;
        setIsSavingNotes(true);
        try {
            const updatedMeeting = { ...meeting, manualNotes };
            const savedMeeting = await api.updateMeeting(updatedMeeting);
            dispatch({ type: 'UPDATE_MEETING', payload: savedMeeting });
            setMeeting(savedMeeting);
        } catch (error) {
            console.error("Failed to save notes", error);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleSendMessage = (message: string) => {
        if (!message.trim()) return;
        
        const userMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: message,
            timestamp: new Date().toLocaleTimeString()
        };
        
        setAiMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        
        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                id: (Date.now() + 1).toString(),
                role: 'ai' as const,
                content: `I understand you're asking about "${message}". Based on the meeting discussion, I can help you with that. Would you like me to elaborate on any specific aspect?`,
                timestamp: new Date().toLocaleTimeString()
            };
            setAiMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-neutral-900 text-white">Loading meeting...</div>;
    }

    if (!meeting) {
        return <div className="flex items-center justify-center h-screen bg-neutral-900 text-white">Meeting not found.</div>;
    }

    const participants = meeting.participants || [];
    const mainParticipant = participants.find(p => p !== state.user?.email) || state.user?.email || '';
    const otherParticipants = participants.filter(p => p !== mainParticipant);

    return (
        <div className="h-screen w-full bg-neutral-900 text-white flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b border-white/20 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold">{meeting.title}</h1>
                    <p className="text-sm text-neutral-400">Live Meeting</p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="text-sm hover:underline">Back to Dashboard</button>
            </header>

            {/* Main Content - 80% - 20% Layout */}
            <main className="flex-1 flex overflow-hidden min-h-0">
                {/* Left Panel - 80% - Video Area */}
                <section className="w-4/5 flex flex-col gap-4 p-4 min-h-0">
                    {/* Main Video */}
                    <div className="flex-1 min-h-0 bg-black rounded-lg flex items-center justify-center relative">
                        <div className="text-center">
                            <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-4xl mb-4 mx-auto">
                                {mainParticipant.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-lg">{mainParticipant.split('@')[0]}</p>
                            <p className="text-sm text-neutral-400">Main Speaker</p>
                        </div>
                        {/* Video status indicators */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            {!isMicOn && <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">Muted</div>}
                            {!isCameraOn && <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">Camera Off</div>}
                        </div>
                    </div>
                    
                    {/* Participant Grid */}
                    <div className="grid grid-cols-4 gap-4 h-32 flex-shrink-0">
                        {otherParticipants.map(p => (
                            <div key={p} className="bg-black rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 mx-auto">
                                        {p.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-sm">{p.split('@')[0]}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Right Panel - 20% - Split into 3 parts */}
                <aside className="w-1/5 flex flex-col gap-4 p-4 min-h-0">
                    {/* Live Transcription - 20% */}
                    <div className="h-1/5 min-h-[180px]">
                        <LiveTranscriptionPanel
                            transcript={transcript}
                            isRecording={isRecording}
                            isSupported={isSupported}
                            error={error}
                            audioStream={audioStream}
                            currentSummary={currentSummary}
                            isSummarizing={isSummarizing}
                            getCurrentWindowText={getCurrentWindowText}
                        />
                    </div>
                    
                    {/* Manual Notes - 40% */}
                    <div className="h-2/5 min-h-[200px]">
                        <ManualNotesPanel
                            notes={manualNotes}
                            onNotesChange={setManualNotes}
                            onSaveNotes={handleSaveNotes}
                            isSaving={isSavingNotes}
                        />
                    </div>
                    
                    {/* AI Chat - 40% */}
                    <div className="h-2/5 min-h-[200px]">
                        <AIChatPanel
                            messages={aiMessages}
                            onSendMessage={handleSendMessage}
                            newMessage={newMessage}
                            onNewMessageChange={setNewMessage}
                        />
                    </div>
                </aside>
            </main>
            
            {/* Footer Controls */}
            <footer className="flex justify-center items-center p-4 border-t border-white/20 flex-shrink-0">
                <div className="bg-black/30 backdrop-blur-lg p-3 rounded-full flex items-center gap-4 border border-white/20">
                    <button 
                        onClick={() => setMicOn(!isMicOn)} 
                        className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}
                        title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                    >
                        {isMicOn ? <MicOnIcon className="w-6 h-6" /> : <MicOffIcon className="w-6 h-6" />}
                    </button>
                    <button 
                        onClick={() => setCameraOn(!isCameraOn)} 
                        className={`p-3 rounded-full transition-colors ${isCameraOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}
                        title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isCameraOn ? <CameraOnIcon className="w-6 h-6" /> : <CameraOffIcon className="w-6 h-6" />}
                    </button>
                    <button 
                        onClick={() => setSharing(!isSharing)} 
                        className={`p-3 rounded-full transition-colors ${isSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/20 hover:bg-white/30'}`}
                        title={isSharing ? 'Stop sharing' : 'Start sharing'}
                    >
                        <ScreenShareIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                        title="End meeting"
                    >
                        <EndCallIcon className="w-6 h-6" />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default NewLiveMeetingPage;