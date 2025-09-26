import React, { useState, useEffect, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import type { User } from '../types';

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue];
};

const UserCalendarView: React.FC<{ user: User }> = ({ user }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [busySlots, setBusySlots] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            const slots = await api.getAvailability(user.email, selectedDate);
            setBusySlots(new Set(slots));
            setLoading(false);
        };
        fetchAvailability();
    }, [user, selectedDate]);
    
    const handleDateChange = (days: number) => {
        setSelectedDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    });

    return (
         <Card className="mt-6 flex flex-col min-h-[400px]">
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Schedule for {user.name}</CardTitle>
                 <div className="text-right">
                    <p className="font-semibold">{selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <div className="flex gap-1 justify-end mt-1">
                       <Button type="button" size="sm" variant="ghost" onClick={() => handleDateChange(-1)}>&lt; Prev Day</Button>
                       <Button type="button" size="sm" variant="ghost" onClick={() => handleDateChange(1)}>Next Day &gt;</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto relative">
                {loading ? <p className="text-center p-8">Loading calendar...</p> : (
                    <>
                        <div className="absolute inset-0 grid grid-rows-24">
                            {hours.map(hour => (
                                <div key={hour} className="relative border-t border-neutral-200">
                                    <span className="absolute -top-2.5 left-0 text-xs text-neutral-400 bg-white px-1 z-10">
                                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="absolute inset-0 top-0 left-14 right-2 sm:right-4">
                           {timeSlots.map(slot => {
                               if (!busySlots.has(slot)) return null;
                               const [hour, minute] = slot.split(':').map(Number);
                               const top = ((hour * 60 + minute) / (24 * 60)) * 100;
                               const height = (30 / (24 * 60)) * 100;
                               
                               return (
                                   <div
                                        key={slot}
                                        className="absolute w-full bg-red-400/70 rounded-md p-1.5 text-white overflow-hidden z-10 border border-red-600"
                                        style={{ top: `${top}%`, height: `${height}%` }}
                                        title={`Busy at ${new Date(`1970-01-01T${slot}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'})}`}
                                    >
                                        <p className="font-semibold text-xs text-red-900">Busy</p>
                                    </div>
                               );
                           })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const ConnectionsPage: React.FC = () => {
    const [searchEmail, setSearchEmail] = useState('');
    const [searchedUser, setSearchedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [recentHistory, setRecentHistory] = useLocalStorage<User[]>('connectionsHistory', []);

    const handleSearch = async (emailToSearch: string) => {
        if (!emailToSearch.trim()) return;
        setLoading(true);
        setError('');
        setSearchedUser(null);
        
        try {
            const user = await api.searchUserByEmail(emailToSearch);
            if (user) {
                setSearchedUser(user);
                // Add to recent history, avoiding duplicates
                setRecentHistory(prev => {
                    const newHistory = prev.filter(u => u.id !== user.id);
                    return [user, ...newHistory].slice(0, 5); // Keep last 5
                });
            } else {
                setError('User not found.');
            }
        } catch (e) {
            setError('An error occurred during search.');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(searchEmail);
    };
    
    const handleRecentClick = (user: User) => {
        setSearchEmail(user.email);
        handleSearch(user.email);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Find a Colleague's Availability</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                        <Input
                            type="email"
                            placeholder="Enter email address..."
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            className="flex-grow"
                            aria-label="Search by email"
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </CardContent>
            </Card>

            {recentHistory.length > 0 && !searchedUser && (
                <div>
                    <h2 className="text-xl font-bold text-neutral-800 mb-4">Recent History</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentHistory.map(user => (
                            <Card key={user.id} className="cursor-pointer hover:border-primary" onClick={() => handleRecentClick(user)}>
                                <CardContent className="pt-6">
                                    <p className="font-bold text-lg text-neutral-900">{user.name}</p>
                                    <p className="text-sm text-neutral-500">{user.email}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            
            {searchedUser && (
                <UserCalendarView user={searchedUser} />
            )}
        </div>
    );
};

export default ConnectionsPage;