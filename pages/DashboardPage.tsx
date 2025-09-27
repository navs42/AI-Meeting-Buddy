import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Meeting } from '../types';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MoreHorizontalIcon } from '../components/Icons';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import * as api from '../services/api';

const LiveAndUpcoming: React.FC<{ 
    onSelectMeeting: (meeting: Meeting) => void,
    onDelete: (id: string) => void;
    onReschedule: (meeting: Meeting) => void;
}> = ({ onSelectMeeting, onDelete, onReschedule }) => {
    const { state } = useAppContext();
    const navigate = useNavigate();
    const now = new Date();
    const timezone = state.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    const liveMeeting = state.meetings.find(m => new Date(m.startTime) <= now && now <= new Date(m.endTime));
    
    const upcomingMeetings = state.meetings
        .filter(m => {
            const startTime = new Date(m.startTime);
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return startTime > now && startTime < sevenDaysFromNow;
        })
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Live & Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                {liveMeeting && (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <p className="font-bold text-lg text-green-800">Live: {liveMeeting.title}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-green-600">{new Date(liveMeeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', timeZone: timezone })} - {new Date(liveMeeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', timeZone: timezone })}</p>
                            <Button variant="secondary" size="sm" onClick={() => navigate(`/meeting/live/${liveMeeting.id}`)}>Join Now</Button>
                        </div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    <h3 className="text-md font-semibold text-neutral-700 mt-2">This Week</h3>
                    {upcomingMeetings.length > 0 ? (
                        upcomingMeetings.map((meeting, index) => (
                            <div key={meeting.id} className="relative w-full text-left p-3 rounded-lg bg-neutral-100 border border-neutral-200 hover:bg-primary/10 hover:border-primary/50 transition-colors" style={{ zIndex: upcomingMeetings.length - index }}>
                                <div onClick={() => onSelectMeeting(meeting)} className="cursor-pointer pr-10">
                                    <p className="font-semibold text-neutral-800">{meeting.title}</p>
                                    <p className="text-sm text-neutral-600">
                                        {new Date(meeting.startTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', timeZone: timezone })}
                                    </p>
                                </div>
                                <div className="absolute top-1/2 -translate-y-1/2 right-2">
                                    <button onClick={() => setOpenMenuId(openMenuId === meeting.id ? null : meeting.id)} className="p-1 rounded-full hover:bg-neutral-300/50 text-neutral-500">
                                        <MoreHorizontalIcon className="w-5 h-5"/>
                                    </button>
                                     {openMenuId === meeting.id && (
                                        <div ref={menuRef} className="absolute right-0 top-8 mt-1 w-40 bg-white rounded-md shadow-lg z-50 border border-neutral-200 py-1">
                                            <button onClick={() => { onReschedule(meeting); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">Reschedule</button>
                                            <button onClick={() => alert('Invite link copied!')} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">Copy Invite</button>
                                            <button onClick={() => { onDelete(meeting.id); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-neutral-500 text-sm mt-2">No upcoming meetings in the next 7 days.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const MeetingDetails: React.FC<{ meeting: Meeting | null }> = ({ meeting }) => {
    const { state } = useAppContext();

    const relevantPastMeetings = useMemo(() => {
        if (!meeting) return [];
        const now = new Date();
        const currentParticipants = meeting.participants.filter(p => p !== state.user?.email);
        
        return state.meetings.filter(m => {
            if (m.id === meeting.id || new Date(m.startTime) >= now) return false;
            return m.participants.some(p => currentParticipants.includes(p));
        }).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 3);
    }, [meeting, state.meetings, state.user]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                {meeting ? (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-primary">{meeting.title}</h3>
                        {(meeting.aiNotes || meeting.manualNotes) && (
                             <div>
                                <h4 className="font-semibold text-neutral-700">Notes & Prep</h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap bg-neutral-50 p-3 rounded-md mt-1 border">
                                    {meeting.aiNotes || meeting.manualNotes}
                                </p>
                            </div>
                        )}
                        <div>
                            <h4 className="font-semibold text-neutral-700">Description</h4>
                            <p className="text-neutral-600 whitespace-pre-wrap">{meeting.description || 'No description provided.'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-neutral-700">Documents</h4>
                            {meeting.documents && meeting.documents.length > 0 ? (
                                <ul className="list-disc list-inside text-neutral-600">
                                    {meeting.documents.map(doc => <li key={doc.name}><a href={doc.url} className="text-primary hover:underline">{doc.name}</a></li>)}
                                </ul>
                            ) : <p className="text-neutral-500">No documents attached.</p>}
                        </div>
                         {relevantPastMeetings.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-neutral-700 mt-4 border-t pt-4">Relevant Past Notes</h4>
                                <div className="space-y-3 mt-2">
                                {relevantPastMeetings.map(pastMeeting => (
                                    <div key={pastMeeting.id} className="p-2 bg-neutral-100 rounded-md text-sm">
                                        <p className="font-semibold text-neutral-800">{pastMeeting.title} ({new Date(pastMeeting.startTime).toLocaleDateString()})</p>
                                        <p className="text-neutral-600 truncate">Notes: {pastMeeting.aiNotes || pastMeeting.manualNotes || 'N/A'}</p>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-neutral-500">Select a meeting to see its details.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


const DailyScheduleView: React.FC<{ selectedDate: Date }> = ({ selectedDate }) => {
    const { state } = useAppContext();
    const timezone = state.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const meetingsOnSelectedDate = useMemo(() => {
        return state.meetings
            .filter(m => {
                const start = new Date(m.startTime);
                // Adjust for timezone differences if necessary, but toDateString is usually sufficient for day-level comparison
                return start.toDateString() === selectedDate.toDateString();
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [selectedDate, state.meetings]);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getMeetingPosition = (meeting: Meeting) => {
        const start = new Date(meeting.startTime);
        const end = new Date(meeting.endTime);
        const totalMinutesInDay = 24 * 60;
        
        const startMinute = start.getHours() * 60 + start.getMinutes();
        const endMinute = end.getHours() * 60 + end.getMinutes();
        const duration = Math.max(15, endMinute - startMinute); // Min height of 15 mins

        const top = (startMinute / totalMinutesInDay) * 100;
        const height = (duration / totalMinutesInDay) * 100;

        return { top: `${top}%`, height: `${height}%` };
    };

    return (
        <Card className="h-full flex flex-col min-h-[400px]">
            <CardHeader>
                <CardTitle>Schedule for {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto relative">
                <div className="absolute inset-0 grid grid-rows-24">
                    {/* Hour markers */}
                    {hours.map(hour => (
                        <div key={hour} className="relative border-t border-neutral-200">
                             <span className="absolute -top-2.5 left-0 text-xs text-neutral-400 bg-white px-1 z-10">
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="absolute inset-0 top-0 left-14 right-2 sm:right-4">
                    {meetingsOnSelectedDate.map(meeting => (
                       <div
  key={meeting.id}
  className="absolute left-14 right-2 sm:right-4 bg-primary/80 rounded-md px-2 py-1 text-white z-10 border border-primary-focus cursor-pointer hover:bg-primary flex flex-col justify-center"
  style={getMeetingPosition(meeting)}
>
  <p className="font-semibold text-xs text-center leading-tight truncate">
    {meeting.title}
  </p>
  <p className="text-[10px] opacity-80 text-center leading-tight">
    {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    {" - "}
    {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </p>
</div>




                    ))}
                </div>
                 {meetingsOnSelectedDate.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-neutral-500">No meetings scheduled for this day.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const MeetingCalendar: React.FC<{ onDateSelect: (date: Date) => void; selectedDate: Date; }> = ({ onDateSelect, selectedDate }) => {
    const { state } = useAppContext();
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const meetingsByDay = useMemo(() => {
        const map = new Map<string, boolean>();
        state.meetings.forEach(m => {
            const dayKey = new Date(m.startTime).toDateString();
            map.set(dayKey, true);
        });
        return map;
    }, [state.meetings]);

    const daysInGrid = useMemo(() => {
        const days = [];
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const startDayOfMonth = new Date(year, month, 1).getDay();
        const endDayOfMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < startDayOfMonth; i++) {
            days.push(null);
        }
        for (let i = 1; i <= endDayOfMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const today = new Date();

    return (
        <Card className="h-full">
            <CardHeader className="flex justify-between items-center">
                <CardTitle>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
                <div className="space-x-1">
                    <Button variant="ghost" size="sm" onClick={handlePrevMonth}>&lt;</Button>
                    <Button variant="ghost" size="sm" onClick={() => { onDateSelect(today); setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }}>Today</Button>
                    <Button variant="ghost" size="sm" onClick={handleNextMonth}>&gt;</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2 text-center font-semibold text-xs text-neutral-500 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {daysInGrid.map((day, index) => (
                        day ? (
                            <button 
                                key={index} 
                                onClick={() => onDateSelect(day)}
                                className={`p-1 rounded-full flex flex-col items-center justify-center aspect-square transition-colors text-neutral-700 ${
                                    day.toDateString() === selectedDate.toDateString()
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-primary/10'
                                }`}
                            >
                                <span className={`text-sm ${
                                    day.toDateString() === today.toDateString() && day.toDateString() !== selectedDate.toDateString()
                                    ? 'text-primary font-bold'
                                    : ''
                                }`}>
                                    {day.getDate()}
                                </span>
                                {meetingsByDay.has(day.toDateString()) && (
                                    <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                        day.toDateString() === selectedDate.toDateString() ? 'bg-white' : 'bg-secondary'
                                    }`}></span>
                                )}
                            </button>
                        ) : <div key={index} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const DashboardPage: React.FC = () => {
    const { dispatch } = useAppContext();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedMeetingForDetails, setSelectedMeetingForDetails] = useState<Meeting | null>(null);

    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [selectedMeetingToReschedule, setSelectedMeetingToReschedule] = useState<Meeting | null>(null);
    const [rescheduleDateTime, setRescheduleDateTime] = useState('');

    // Create meeting modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        participants: '',
        documents: ''
    });

    const handleDelete = async (id: string) => {
        if(window.confirm('Are you sure you want to delete this meeting?')) {
            try {
                await api.deleteMeeting(id);
                dispatch({ type: 'DELETE_MEETING', payload: id });
                if (selectedMeetingForDetails?.id === id) {
                    setSelectedMeetingForDetails(null);
                }
            } catch (error) {
                console.error("Failed to delete meeting", error);
            }
        }
    }
    
    const openRescheduleModal = (meeting: Meeting) => {
        setSelectedMeetingToReschedule(meeting);
        const currentStartTime = new Date(new Date(meeting.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setRescheduleDateTime(currentStartTime);
        setRescheduleModalOpen(true);
    };
    
    const handleReschedule = async () => {
        if (!selectedMeetingToReschedule || !rescheduleDateTime) return;
        const newStartTime = new Date(rescheduleDateTime);
        const duration = new Date(selectedMeetingToReschedule.endTime).getTime() - new Date(selectedMeetingToReschedule.startTime).getTime();
        const newEndTime = new Date(newStartTime.getTime() + duration);
        
        const updatedMeeting: Meeting = {
            ...selectedMeetingToReschedule,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
        };

        try {
            const result = await api.updateMeeting(updatedMeeting);
            dispatch({ type: 'UPDATE_MEETING', payload: result });
            if (selectedMeetingForDetails?.id === result.id) {
                setSelectedMeetingForDetails(result);
            }
            setRescheduleModalOpen(false);
            setSelectedMeetingToReschedule(null);
        } catch(error) {
            console.error("Failed to reschedule meeting", error);
        }
    };

    const handleCreateMeeting = async () => {
        if (!newMeeting.title || !newMeeting.startTime || !newMeeting.endTime) {
            alert('Please fill in all required fields');
            return;
        }

        const meeting: Omit<Meeting, 'id'> = {
            title: newMeeting.title,
            description: newMeeting.description,
            participants: newMeeting.participants.split(',').map(email => email.trim()).filter(Boolean),
            startTime: new Date(newMeeting.startTime).toISOString(),
            endTime: new Date(newMeeting.endTime).toISOString(),
            documents: newMeeting.documents ? [{ name: newMeeting.documents, url: '#' }] : [],
            waitingRoom: false,
            passcode: '',
            aiNotes: '',
            manualNotes: ''
        };

        try {
            const result = await api.createMeeting(meeting);
            dispatch({ type: 'ADD_MEETING', payload: result });
            
            // Reset form and close modal
            setNewMeeting({
                title: '',
                description: '',
                startTime: '',
                endTime: '',
                participants: '',
                documents: ''
            });
            setCreateModalOpen(false);
            
            // Select the new meeting for details
            setSelectedMeetingForDetails(result);
            
            // Update selected date if the meeting is on a different day
            const meetingDate = new Date(result.startTime);
            setSelectedDate(meetingDate);
        } catch(error) {
            console.error("Failed to create meeting", error);
            alert("Failed to create meeting. Please try again.");
        }
    };

    const openCreateModal = () => {
        // Pre-fill with current date/time
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const startTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0);
        const endTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0);
        
        setNewMeeting({
            title: '',
            description: '',
            startTime: startTime.toISOString().slice(0, 16),
            endTime: endTime.toISOString().slice(0, 16),
            participants: '',
            documents: ''
        });
        setCreateModalOpen(true);
    };


    return (
        <div className="space-y-6">
            {/* Header with Create Meeting Button */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <Button 
                    onClick={openCreateModal} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Meeting
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
                <LiveAndUpcoming 
                    onSelectMeeting={setSelectedMeetingForDetails}
                    onDelete={handleDelete}
                    onReschedule={openRescheduleModal}
                />
                <MeetingDetails meeting={selectedMeetingForDetails} />
                <MeetingCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                <DailyScheduleView selectedDate={selectedDate} />
            </div>

            {/* Create Meeting Modal */}
            <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Meeting">
                <div className="space-y-4">
                    <Input 
                        label="Meeting Title *"
                        type="text"
                        value={newMeeting.title}
                        onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                        placeholder="Enter meeting title"
                    />
                    <Input 
                        label="Description"
                        type="text"
                        value={newMeeting.description}
                        onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                        placeholder="Enter meeting description"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Start Time *"
                            type="datetime-local"
                            value={newMeeting.startTime}
                            onChange={(e) => setNewMeeting({...newMeeting, startTime: e.target.value})}
                        />
                        <Input 
                            label="End Time *"
                            type="datetime-local"
                            value={newMeeting.endTime}
                            onChange={(e) => setNewMeeting({...newMeeting, endTime: e.target.value})}
                        />
                    </div>
                    <Input 
                        label="Participants (comma-separated emails)"
                        type="text"
                        value={newMeeting.participants}
                        onChange={(e) => setNewMeeting({...newMeeting, participants: e.target.value})}
                        placeholder="john@example.com, jane@example.com"
                    />
                    <Input 
                        label="Document Name (optional)"
                        type="text"
                        value={newMeeting.documents}
                        onChange={(e) => setNewMeeting({...newMeeting, documents: e.target.value})}
                        placeholder="Enter document name"
                    />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateMeeting}>Create Meeting</Button>
                </div>
            </Modal>

            {/* Reschedule Modal */}
            <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Reschedule Meeting">
                <div className="space-y-4">
                    <p className="text-neutral-600">Select a new date and time for "{selectedMeetingToReschedule?.title}".</p>
                    <Input 
                        label="New Date & Time"
                        type="datetime-local"
                        value={rescheduleDateTime}
                        onChange={(e) => setRescheduleDateTime(e.target.value)}
                    />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setRescheduleModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleReschedule}>Save Changes</Button>
                </div>
            </Modal>
        </div>
    );
};

export default DashboardPage;