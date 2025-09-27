import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import * as api from '../services/api';
import type { Meeting } from '../types';
import { BellIcon, UserIcon, LogOutIcon, ChevronDownIcon, MenuIcon } from './Icons';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';

const Clock: React.FC = () => {
    const { state } = useAppContext();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const timezone = state.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const location = timezone.split('/').pop()?.replace(/_/g, ' ') || 'Local Time';

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(time);
    
    const timeString = parts.map(({type, value}) => {
        switch (type) {
            case 'timeZoneName':
                return '';
            default:
                return value;
        }
    }).join('').replace(/, $/, '').trim();

    const tzName = parts.find(p => p.type === 'timeZoneName')?.value || '';


    return (
        <div className="hidden sm:flex items-center gap-2 text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
            <span className="font-semibold text-sm text-neutral-800">{location}</span>
            <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-mono text-neutral-600 tabular-nums">{timeString}</span>
                <span className="text-xs font-semibold text-neutral-500">{tzName}</span>
            </div>
        </div>
    );
};


const NotificationsDropdown: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');


  const handleAccept = async (id: string) => {
    try {
      const newMeeting = await api.acceptMeeting(id);
      dispatch({ type: 'ADD_MEETING', payload: newMeeting });
      dispatch({ type: 'DISMISS_NOTIFICATION', payload: id });
    } catch (error) {
      console.error("Failed to accept meeting", error);
    }
  };
  
  const handleDecline = async () => {
    if (!selectedNotificationId) return;
    try {
      console.log(`Declining meeting ${selectedNotificationId} with reason: ${declineReason}`);
      await api.declineMeeting(selectedNotificationId);
      dispatch({ type: 'DISMISS_NOTIFICATION', payload: selectedNotificationId });
      setDeclineModalOpen(false);
      setSelectedNotificationId(null);
      setDeclineReason('');
    } catch (error) {
       console.error("Failed to decline meeting", error);
    }
  };
  
  const handleReschedule = () => {
    if (!selectedNotificationId) return;
    console.log(`Requesting reschedule for meeting ${selectedNotificationId}. New time: ${rescheduleDateTime}. Reason: ${rescheduleReason}`);
    // In a real app, this would trigger a different API call. For now, we'll just dismiss it.
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: selectedNotificationId });
    setRescheduleModalOpen(false);
    setSelectedNotificationId(null);
    setRescheduleDateTime('');
    setRescheduleReason('');
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-[100] border border-neutral-200">
      <div className="p-4 font-semibold border-b border-neutral-200 text-neutral-900">Notifications</div>
      <div className="p-2 max-h-96 overflow-y-auto">
        {state.notifications.length > 0 ? state.notifications.map(n => (
          <div key={n.id} className="p-3 rounded-lg hover:bg-neutral-100">
            <p className="text-sm text-neutral-700">
              Meeting scheduled from <span className="font-semibold text-secondary">{n.from}</span> for "{n.meetingTitle}".
            </p>
            
          </div>
        )) : <p className="text-sm text-neutral-500 p-4 text-center">No new notifications</p>}
      </div>
      
      <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Reschedule Meeting">
        <div className="space-y-4">
          <p className="text-neutral-600">Propose a new time for this meeting.</p>
          <Input 
            label="Proposed Date & Time"
            type="datetime-local"
            value={rescheduleDateTime}
            onChange={(e) => setRescheduleDateTime(e.target.value)}
          />
          <textarea
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              rows={3}
              placeholder="Add a comment (optional)"
              className="w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-neutral-400 text-neutral-900"
          />
        </div>
         <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRescheduleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReschedule}>Request Reschedule</Button>
          </div>
      </Modal>
    </div>
  );
};

const ProfileDropdown: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        navigate('/login');
    };

    return (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-[100] py-1 border border-neutral-200">
            <button onClick={() => navigate('/profile')} className="w-full text-left flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                <UserIcon className="w-4 h-4 mr-2"/> Profile
            </button>
            <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                <LogOutIcon className="w-4 h-4 mr-2"/> Logout
            </button>
        </div>
    );
};

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { state } = useAppContext();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-neutral-50/80 backdrop-blur-lg border-b border-neutral-200">
             <div className="flex items-center">
                <button onClick={onMenuClick} className="text-neutral-500 hover:text-primary mr-4 md:hidden" aria-label="Open sidebar">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900">Welcome, {state.user?.name}!</h2>
                    <p className="text-sm text-neutral-500">Let's make today productive.</p>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                 <Clock />
                 <div ref={notificationsRef} className="relative">
                    <button onClick={() => setNotificationsOpen(o => !o)} className="relative text-neutral-500 hover:text-primary">
                        <BellIcon className="w-6 h-6" />
                        {state.notifications.length > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>}
                    </button>
                    {notificationsOpen && <NotificationsDropdown />}
                </div>
                <div ref={profileRef} className="relative">
                    <button onClick={() => setProfileOpen(p => !p)} className="flex items-center gap-2 text-neutral-600 hover:text-primary">
                        <UserIcon className="w-8 h-8 p-1 bg-neutral-200 text-neutral-600 rounded-full" />
                        <span className="hidden md:inline font-medium">{state.user?.name}</span>
                        <ChevronDownIcon className="w-4 h-4"/>
                    </button>
                    {profileOpen && <ProfileDropdown />}
                </div>
            </div>
        </header>
    );
};

export default Header;