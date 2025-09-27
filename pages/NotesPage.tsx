import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Meeting, Task } from '../types';
import * as api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BotMessageSquareIcon } from '../components/Icons';

const PeopleList: React.FC<{ onSelectPerson: (person: string | null) => void; selectedPerson: string | null; }> = ({ onSelectPerson, selectedPerson }) => {
    const { state } = useAppContext();
    const people = useMemo(() => {
        const allParticipants = new Set<string>();
        state.meetings.forEach(m => m.participants.forEach(p => allParticipants.add(p)));
        allParticipants.delete(state.user?.email || '');
        return Array.from(allParticipants);
    }, [state.meetings, state.user]);

    return (
        <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-sm p-4 min-h-[50vh] lg:h-[calc(100vh-12rem)] overflow-y-auto border border-neutral-200">
            <h3 className="font-semibold text-lg mb-4 text-neutral-900">Contacts</h3>
            <ul>
                {people.map(person => (
                    <li key={person}>
                        <button onClick={() => onSelectPerson(person)} className={`w-full text-left p-2 rounded-md text-neutral-700 ${selectedPerson === person ? 'bg-primary text-white' : 'hover:bg-neutral-100'}`}>
                            {person}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const MeetingHistory: React.FC<{ person: string | null; onSelectMeeting: (meeting: Meeting | null) => void; selectedMeetingId: string | null; }> = ({ person, onSelectMeeting, selectedMeetingId }) => {
    const { state } = useAppContext();
    const timezone = state.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const meetings = useMemo(() => {
        if (!person) return [];
        return state.meetings
            .filter(m => m.participants.includes(person) && new Date(m.startTime) < new Date())
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }, [state.meetings, person]);

    if (!person) {
        return <div className="w-full lg:w-1/4 flex items-center justify-center text-neutral-500 p-4 bg-white rounded-xl shadow-sm border border-neutral-200 min-h-[20vh] lg:min-h-0"><p>Select a person to view meeting history.</p></div>;
    }

    return (
        <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-sm p-4 min-h-[50vh] lg:h-[calc(100vh-12rem)] overflow-y-auto border border-neutral-200">
            <h3 className="font-semibold text-lg mb-4 text-neutral-900">History with {person}</h3>
            {meetings.length > 0 ? meetings.map(m => (
                 <button key={m.id} onClick={() => onSelectMeeting(m)} className={`w-full text-left p-3 mb-2 rounded-lg ${selectedMeetingId === m.id ? 'bg-primary text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-sm opacity-80">{new Date(m.startTime).toLocaleDateString([], { timeZone: timezone })}</p>
                </button>
            )) : <p className="text-neutral-500 mt-4">No past meetings with this person.</p>}
        </div>
    );
};

const NotesView: React.FC<{ meeting: Meeting | null }> = ({ meeting }) => {
    const { state, dispatch } = useAppContext();
    const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
    
    const handleExtractTasks = async () => {
        if (!meeting?.aiNotes) return;
        const notes = meeting.aiNotes;
        const taskRegex = /Action item: (.*)/gi;
        let match;
        const newTasks: string[] = [];
        
        while ((match = taskRegex.exec(notes)) !== null) {
            const taskText = match[1].trim().replace(/\.$/, ''); // Remove trailing period
            if (taskText && !state.tasks.some(t => t.text.toLowerCase() === taskText.toLowerCase())) {
                 newTasks.push(taskText);
            }
        }

        if (newTasks.length > 0) {
            for (const taskText of newTasks) {
                const newTask = await api.addTask(taskText);
                dispatch({ type: 'ADD_TASK', payload: newTask });
            }
            alert(`${newTasks.length} new task(s) extracted and added to your task list!`);
        } else {
            alert('No new action items found in the notes.');
        }
    };


    if (!meeting) {
        return <div className="flex-1 flex items-center justify-center text-neutral-500 p-4 bg-white rounded-xl shadow-sm border border-neutral-200 min-h-[20vh] lg:min-h-0"><p>Select a meeting to view notes.</p></div>;
    }
    
    return (
        <Card className="flex-1 min-h-[50vh] lg:h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-200 pr-4">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('ai')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'ai' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500 hover:text-neutral-700'}`}>Minutes of Meet</button>
                    <button onClick={() => setActiveTab('manual')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'manual' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500 hover:text-neutral-700'}`}>Manual Notes</button>
                </nav>
                {activeTab === 'ai' && meeting.aiNotes && (
                    <Button variant="ghost" size="sm" onClick={handleExtractTasks}>
                        <BotMessageSquareIcon className="w-4 h-4 mr-2" />
                        Extract Tasks
                    </Button>
                )}
            </div>
            <div className="py-4 overflow-y-auto px-6">
                <p className="text-sm whitespace-pre-wrap text-neutral-700 leading-relaxed">
                    {activeTab === 'ai' && (meeting.aiNotes || 'No AI-generated notes available.')}
                    {activeTab === 'manual' && (meeting.manualNotes || 'No manual notes available.')}
                </p>
            </div>
        </Card>
    );
};

const NotesPage: React.FC = () => {
    const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

    const handleSelectPerson = (person: string | null) => {
        setSelectedPerson(person);
        setSelectedMeeting(null);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <PeopleList onSelectPerson={handleSelectPerson} selectedPerson={selectedPerson} />
            <MeetingHistory person={selectedPerson} onSelectMeeting={setSelectedMeeting} selectedMeetingId={selectedMeeting?.id || null} />
            <NotesView meeting={selectedMeeting} />
        </div>
    );
};

export default NotesPage;