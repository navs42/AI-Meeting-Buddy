import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import * as api from '../services/api';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import type { Meeting } from '../types';
import { DocumentUploadIcon, BotMessageSquareIcon } from '../components/Icons';

const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const AvailabilityViewer: React.FC<{
    participant: string;
    onSlotSelect: (slot: string) => void;
    selectedSlot: string | null;
}> = ({ participant, onSlotSelect, selectedSlot }) => {
    const { state } = useAppContext();
    const [viewDate, setViewDate] = useState(new Date());
    const [myAvailability, setMyAvailability] = useState<Set<string>>(new Set());
    const [theirAvailability, setTheirAvailability] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            
            // 1. Get my busy slots from existing meetings
            const myBusySlots = new Set<string>();
            state.meetings.forEach(meeting => {
                const meetingDate = new Date(meeting.startTime);
                if (meetingDate.toDateString() === viewDate.toDateString()) {
                    const startHour = meetingDate.getHours();
                    const startMinute = meetingDate.getMinutes();
                    const end = new Date(meeting.endTime);
                    const endHour = end.getHours();
                    const endMinute = end.getMinutes();

                    for (const slot of timeSlots) {
                        const [slotHour, slotMinute] = slot.split(':').map(Number);
                        const slotTime = slotHour * 60 + slotMinute;
                        const startTime = startHour * 60 + startMinute;
                        const endTime = endHour * 60 + endMinute;
                        if (slotTime >= startTime && slotTime < endTime) {
                            myBusySlots.add(slot);
                        }
                    }
                }
            });
            setMyAvailability(myBusySlots);

            // 2. Get participant's busy slots from mock API
            const theirBusySlots = await api.getAvailability(participant, viewDate);
            setTheirAvailability(new Set(theirBusySlots));

            setLoading(false);
        };

        fetchAvailability();
    }, [viewDate, participant, state.meetings]);
    
    const handleDateChange = (days: number) => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    };

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle as="h3">Find a Time</CardTitle>
                <div className="text-right">
                    <p className="font-semibold">{viewDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <div className="flex gap-1 justify-end mt-1">
                       <Button type="button" size="sm" variant="ghost" onClick={() => handleDateChange(-1)}>&lt; Prev</Button>
                       <Button type="button" size="sm" variant="ghost" onClick={() => handleDateChange(1)}>Next &gt;</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {loading ? <p>Checking calendars...</p> : 
                timeSlots.map(slot => {
                    const isMySlotBusy = myAvailability.has(slot);
                    const isTheirSlotBusy = theirAvailability.has(slot);
                    const isAvailable = !isMySlotBusy && !isTheirSlotBusy;
                    
                    const slotDate = new Date(viewDate);
                    const [hour, minute] = slot.split(':').map(Number);
                    slotDate.setHours(hour, minute, 0, 0);
                    const isPast = slotDate < new Date();

                    if (isPast) return null;

                    return (
                        <button
                            type="button"
                            key={slot}
                            onClick={() => isAvailable && onSlotSelect(slot)}
                            disabled={!isAvailable}
                            className={`w-full p-3 text-left rounded-md border text-sm transition-all ${
                                selectedSlot === slot 
                                ? 'bg-primary border-primary-focus text-white' 
                                : isAvailable 
                                ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 hover:border-green-400' 
                                : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                            }`}
                        >
                            <span className="font-semibold">
                                {new Date(`1970-01-01T${slot}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'})}
                            </span>
                            {!isAvailable && (
                                <span className="text-xs ml-2">
                                    {isMySlotBusy && isTheirSlotBusy ? "(You & Attendee Busy)" : isMySlotBusy ? "(You're Busy)" : "(Attendee Busy)"}
                                </span>
                            )}
                        </button>
                    )
                })}
            </CardContent>
        </Card>
    );
};

const CreateMeetingPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [participants, setParticipants] = useState<string[]>([]);
    const [participantInput, setParticipantInput] = useState('');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        } else {
            setFileName('');
        }
    }

    const handleAddParticipant = () => {
        const email = participantInput.trim();
        if (email && email.includes('@') && !participants.includes(email)) {
            setParticipants([...participants, email]);
            setParticipantInput('');
            setSelectedTimeSlot(null); // Reset time slot when participants change
        }
    };
    
    const removeParticipant = (email: string) => {
        setParticipants(participants.filter(p => p !== email));
        setSelectedTimeSlot(null); // Reset time slot
    };

    const handleGenerateAgenda = () => {
        if(!title) {
            setError('Please enter a title first to generate an agenda.');
            return;
        }
        setError('');
        const generatedAgenda = `Based on the title "${title}", here is a suggested agenda:\n\n1. Introduction & Welcome (5 mins)\n2. Review of Action Items from Previous Meeting (10 mins)\n3. Main Topic: ${title} - Discussion (30 mins)\n4. Next Steps & Action Items (10 mins)\n5. Q&A and Wrap-up (5 mins)`;
        setDescription(generatedAgenda);
    };

    const handleScheduleMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (participants.length !== 1 || !selectedTimeSlot) {
            setError('Please add one participant and select an available time slot.');
            return;
        }

        setIsScheduling(true);

        const meetingDate = new Date(); // This should be synced with the date from AvailabilityViewer
        const [hour, minute] = selectedTimeSlot.split(':').map(Number);
        meetingDate.setHours(hour, minute, 0, 0);

        const meetingStart = meetingDate;
        const meetingEnd = new Date(meetingStart.getTime() + 30 * 60 * 1000); // Default 30 min duration for 1-on-1
        
        const allParticipants = state.user?.email ? [state.user.email, ...participants] : participants;

        const meetingData: Omit<Meeting, 'id'> = {
            title,
            description,
            participants: allParticipants,
            startTime: meetingStart.toISOString(),
            endTime: meetingEnd.toISOString(),
            documents: fileName ? [{ name: fileName, url: '#' }] : [],
        };
        const newMeeting = await api.createMeeting(meetingData);
        dispatch({ type: 'ADD_MEETING', payload: newMeeting });
        alert(`Meeting scheduled for ${meetingStart.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}!`);
        setIsScheduling(false);
        navigate('/dashboard');
    };
    
    const showAvailability = participants.length === 1;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule a New Meeting</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleScheduleMeeting} className="space-y-6">
                            <Input label="Title / Purpose" id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="description" className="block text-sm font-medium text-neutral-600">Description / Agenda</label>
                                    <Button type="button" variant="ghost" size="sm" onClick={handleGenerateAgenda}>
                                        <BotMessageSquareIcon className="w-4 h-4 mr-2"/>
                                        AI Generate Agenda
                                    </Button>
                                </div>
                                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Set the agenda and goals for this meeting..." className="w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-neutral-400 text-neutral-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 mb-1">Attachments</label>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                                        <DocumentUploadIcon className="w-5 h-5 mr-2" />
                                        Attach a file
                                    </Button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    {fileName && <span className="text-sm text-neutral-600">{fileName}</span>}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="participants" className="block text-sm font-medium text-neutral-600 mb-1">
                                    Participants (1-on-1 only)
                                </label>
                                {participants.length < 1 && (
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            id="participants"
                                            type="email"
                                            placeholder="Enter participant's email"
                                            value={participantInput} 
                                            onChange={e => setParticipantInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddParticipant(); }}}
                                        />
                                        <Button 
                                            type="button" 
                                            onClick={handleAddParticipant} 
                                            disabled={!participantInput.trim().includes('@')}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2 mt-3 min-h-[2rem]">
                                    {participants.map(p => (
                                        <span key={p} className="flex items-center bg-primary/10 text-primary text-sm font-medium pl-3 pr-2 py-1 rounded-full transition-opacity">
                                            {p}
                                            <button type="button" onClick={() => removeParticipant(p)} className="ml-2 font-bold text-primary hover:text-blue-400 leading-none text-lg">&times;</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                             <div className="flex justify-end pt-4 border-t">
                                <Button type="submit" disabled={isScheduling || !title || !showAvailability || !selectedTimeSlot}>
                                    {isScheduling ? 'Scheduling...' : 'Schedule Meeting'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                {showAvailability ? (
                    <AvailabilityViewer 
                        participant={participants[0]} 
                        onSlotSelect={setSelectedTimeSlot}
                        selectedSlot={selectedTimeSlot}
                    />
                ) : (
                    <Card className="flex items-center justify-center min-h-[400px]">
                        <p className="text-neutral-500 p-4 text-center">Add a participant to check their availability for a 1-on-1 meeting.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default CreateMeetingPage;