import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Meeting } from '../types';
import * as api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { 
    MicOnIcon, MicOffIcon, CameraOnIcon, CameraOffIcon, ScreenShareIcon, EndCallIcon, UsersIcon, MessageSquareIcon, BotMessageSquareIcon
} from '../components/Icons';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const MeetingControlButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
}> = ({ onClick, children, variant = 'default', className = '' }) => {
  const baseClasses = 'p-3 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800';
  const variantClasses = {
    default: 'bg-white/20 hover:bg-white/30 focus:ring-white',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-400',
  };
  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ParticipantView: React.FC<{ name: string; isMuted?: boolean; isMain?: boolean }> = ({ name, isMuted = false, isMain = false }) => {
    const avatarColor = useMemo(() => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-indigo-500', 'bg-pink-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, [name]);
    
    return (
        <div className={`relative rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center ${isMain ? 'aspect-video' : 'aspect-square'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${avatarColor}`}>
                {name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded-md flex items-center gap-2">
                {isMuted && <MicOffIcon className="w-4 h-4" />}
                <span>{name.split('@')[0]}</span>
            </div>
        </div>
    );
};

const SidePanel: React.FC<{ 
    meeting: Meeting | null; 
    participants: string[]; 
    onSaveManualNotes: (notes: string) => void;
    liveTranscript: string;
    isTranscribing: boolean;
    onStartTranscription: () => void;
    onStopTranscription: () => void;
}> = ({ meeting, participants, onSaveManualNotes, liveTranscript, isTranscribing, onStartTranscription, onStopTranscription }) => {
    const [activeTab, setActiveTab] = useState<'transcript' | 'participants' | 'manual' | 'ai'>('transcript');
    const [manualNotes, setManualNotes] = useState(meeting?.manualNotes || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        onSaveManualNotes(manualNotes);
        setTimeout(() => setIsSaving(false), 1000); // Simulate save
    };

    return (
        <div className="w-full lg:w-80 bg-black/20 backdrop-blur-lg rounded-lg flex flex-col h-full border border-white/20">
            <div className="flex border-b border-white/20">
                <button 
                    onClick={() => setActiveTab('transcript')}
                    className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === 'transcript' ? 'text-white bg-white/20' : 'text-neutral-300 hover:bg-white/10'}`}
                >
                    <MessageSquareIcon className="w-4 h-4 mx-auto"/>
                </button>
                 <button 
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === 'manual' ? 'text-white bg-white/20' : 'text-neutral-300 hover:bg-white/10'}`}
                >
                    My Notes
                </button>
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === 'ai' ? 'text-white bg-white/20' : 'text-neutral-300 hover:bg-white/10'}`}
                >
                    <BotMessageSquareIcon className="w-4 h-4 mx-auto"/>
                </button>
                <button 
                    onClick={() => setActiveTab('participants')}
                    className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === 'participants' ? 'text-white bg-white/20' : 'text-neutral-300 hover:bg-white/10'}`}
                >
                    <UsersIcon className="w-4 h-4 inline-block mr-1"/> ({participants.length})
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {activeTab === 'participants' && (
                    <ul className="space-y-3">
                        {participants.map(p => (
                            <li key={p} className="flex items-center justify-between text-neutral-200">
                                <span>{p.split('@')[0]}</span>
                                <div className="flex gap-3">
                                    <MicOnIcon className="w-5 h-5 text-neutral-400" />
                                    <CameraOnIcon className="w-5 h-5 text-neutral-400" />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {activeTab === 'transcript' && (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Live Transcript</h3>
                            <div className="flex gap-2">
                                {!isTranscribing ? (
                                    <>
                                        <Button 
                                            onClick={onStartTranscription}
                                            size="sm" 
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Start Meeting
                                        </Button>
                                        <Button 
                                            onClick={onStartTranscription}
                                            size="sm" 
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Test Live Transcript
                                        </Button>
                                    </>
                                ) : (
                                    <Button 
                                        onClick={onStopTranscription}
                                        size="sm" 
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        End Meeting
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="text-sm text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                                {liveTranscript || meeting?.aiNotes || meeting?.manualNotes || "Meeting notes will appear here..."}
                            </div>
                            {isTranscribing && (
                                <div className="mt-2 text-xs text-green-400 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    Live transcript updating...
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'manual' && (
                    <div className="flex flex-col h-full">
                        <textarea
                            value={manualNotes}
                            onChange={(e) => setManualNotes(e.target.value)}
                            className="w-full flex-1 bg-transparent text-neutral-200 border border-white/30 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Type your private notes here..."
                        />
                        <Button onClick={handleSave} disabled={isSaving} className="mt-4 w-full bg-primary text-white">
                            {isSaving ? 'Saving...' : 'Save Notes'}
                        </Button>
                    </div>
                )}
                {activeTab === 'ai' && (
                    <div className="flex flex-col h-full text-sm">
                         <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                             <div className="flex gap-2">
                               <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">A</div>
                               <div className="bg-white/10 p-3 rounded-lg rounded-tl-none text-neutral-200">
                                <p>How can I help you during this meeting?</p>
                               </div>
                            </div>
                         </div>
                        <div className="flex gap-2 mt-4">
                            <Input type="text" placeholder="Ask AI Buddy..." className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-neutral-400"/>
                            <Button size="sm">Send</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const LiveMeetingPage: React.FC = () => {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const { state, dispatch } = useAppContext();
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);

    const [isMicOn, setMicOn] = useState(true);
    const [isCameraOn, setCameraOn] = useState(true);
    const [isSharing, setSharing] = useState(false);
    
    // Transcript state
    const [liveTranscript, setLiveTranscript] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);

    useEffect(() => {
        const fetchMeeting = async () => {
            if (!meetingId) return;
            setLoading(true);
            try {
                // Try to fetch from API first
                const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}`);
                if (response.ok) {
                    const fetchedMeeting = await response.json();
                    setMeeting(fetchedMeeting);
                } else {
                    // Fallback to local API
                    const fetchedMeeting = await api.getMeetingById(meetingId);
                    if(fetchedMeeting) {
                        setMeeting(fetchedMeeting);
                    } else {
                        navigate('/dashboard');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch meeting", error);
                // Try fallback to local API
                try {
                    const fetchedMeeting = await api.getMeetingById(meetingId);
                    if(fetchedMeeting) {
                        setMeeting(fetchedMeeting);
                    } else {
                        navigate('/dashboard');
                    }
                } catch (fallbackError) {
                    console.error("Fallback also failed", fallbackError);
                    navigate('/dashboard');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchMeeting();
    }, [meetingId, navigate]);

    const handleSaveManualNotes = async (notes: string) => {
        if (!meeting) return;
        try {
            // Try to save via API first
            const response = await fetch(`http://localhost:5000/api/meetings/${meeting.id}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'manual',
                    notes: notes
                })
            });
            
            if (response.ok) {
                const updatedMeeting = await response.json();
                setMeeting(updatedMeeting);
                dispatch({ type: 'UPDATE_MEETING', payload: updatedMeeting });
            } else {
                throw new Error('API save failed');
            }
        } catch (error) {
            console.error("API save failed, trying fallback", error);
            // Fallback to local API
            try {
                const updatedMeeting = { ...meeting, manualNotes: notes };
                const savedMeeting = await api.updateMeeting(updatedMeeting);
                dispatch({ type: 'UPDATE_MEETING', payload: savedMeeting });
                setMeeting(savedMeeting);
            } catch (fallbackError) {
                console.error("Failed to save manual notes", fallbackError);
            }
        }
    };

    const handleStartTranscription = async () => {
        setIsTranscribing(true);
        console.log('Meeting started');
        
        // Simulate live transcript updates
        simulateLiveTranscript();
    };

    const simulateLiveTranscript = () => {
        if (!meetingId) return;
        
        const mockTranscripts = [
            "[Live] John: Let's start with the project updates.",
            "[Live] Jane: I've completed the authentication module.",
            "[Live] Bob: Database optimization is showing 40% improvement.",
            "[Live] John: Any blockers we need to address?",
            "[Live] Jane: Need staging environment access by tomorrow.",
            "[Live] Bob: I can help with the credentials.",
            "[Live] John: Let's discuss the client presentation.",
            "[Live] Jane: I have a 15-minute demo ready.",
            "[Live] Bob: Performance metrics are prepared.",
            "[Live] John: Any other agenda items?",
            "[Live] Jane: We should standardize our UI components.",
            "[Live] Bob: I've noticed inconsistencies across pages.",
            "[Live] John: Let's schedule a design review session.",
            "[Live] Jane: I'll send invites by end of day.",
            "[Live] John: Server maintenance is scheduled for this weekend.",
            "[Live] Meeting concluded successfully."
        ];

        let index = 0;
        const interval = setInterval(async () => {
            if (index >= mockTranscripts.length || !isTranscribing) {
                clearInterval(interval);
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}/transcript/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: mockTranscripts[index]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setLiveTranscript(data.transcript);
                }
            } catch (error) {
                console.error('Failed to update transcript', error);
            }

            index++;
        }, 3000); // Add new transcript every 3 seconds
    };

    const handleStopTranscription = async () => {
        setIsTranscribing(false);
        console.log('Meeting ended');
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
        <div className="h-screen w-full bg-neutral-900 text-white flex flex-col p-4 gap-4">
            <header className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold">{meeting.title}</h1>
                    <p className="text-sm text-neutral-400">Live</p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="text-sm hover:underline">Back to Dashboard</button>
            </header>

            <main className="flex-1 flex gap-4 overflow-hidden">
                <section className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 min-h-0">
                        <ParticipantView name={mainParticipant} isMain={true} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 h-32 md:h-40 flex-shrink-0">
                         {otherParticipants.map(p => <ParticipantView key={p} name={p} />)}
                    </div>
                </section>
                <aside className="hidden lg:flex w-80 h-full flex-shrink-0">
                    <SidePanel 
                        meeting={meeting} 
                        participants={participants} 
                        onSaveManualNotes={handleSaveManualNotes}
                        liveTranscript={liveTranscript}
                        isTranscribing={isTranscribing}
                        onStartTranscription={handleStartTranscription}
                        onStopTranscription={handleStopTranscription}
                    />
                </aside>
            </main>
            
            <footer className="flex justify-center items-center flex-shrink-0">
                <div className="bg-black/30 backdrop-blur-lg p-3 rounded-full flex items-center gap-4 border border-white/20">
                    <MeetingControlButton onClick={() => setMicOn(!isMicOn)}>
                        {isMicOn ? <MicOnIcon className="w-6 h-6" /> : <MicOffIcon className="w-6 h-6" />}
                    </MeetingControlButton>
                    <MeetingControlButton onClick={() => setCameraOn(!isCameraOn)}>
                        {isCameraOn ? <CameraOnIcon className="w-6 h-6" /> : <CameraOffIcon className="w-6 h-6" />}
                    </MeetingControlButton>
                    <MeetingControlButton onClick={() => setSharing(!isSharing)}>
                        <ScreenShareIcon className={`w-6 h-6 ${isSharing ? 'text-blue-400' : ''}`} />
                    </MeetingControlButton>
                    <MeetingControlButton onClick={() => navigate('/dashboard')} variant="danger">
                        <EndCallIcon className="w-6 h-6" />
                    </MeetingControlButton>
                </div>
            </footer>
        </div>
    );
};

export default LiveMeetingPage;