/*
 * =================================================================
 * BACKEND INTEGRATION NOTES
 * =================================================================
 * This file currently uses a mock API with data from localStorage
 * to allow the frontend to function without a real backend.
 *
 * When you are ready to connect to your backend, you will need to
 * replace the logic in these functions with actual API calls.
 *
 * EXAMPLE:
 *
 * const API_BASE_URL = 'http://your-backend-url.com/api';
 *
 * export const getMeetings = async (): Promise<Meeting[]> => {
 *   try {
 *     const token = localStorage.getItem('authToken');
 *     const response = await fetch(`${API_BASE_URL}/meetings`, {
 *       method: 'GET',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'Authorization': `Bearer ${token}`,
 *       },
 *     });
 *
 *     if (!response.ok) {
 *       // Handle non-successful responses (e.g., 401, 404, 500)
 *       throw new Error(`API call failed with status: ${response.status}`);
 *     }
 *
 *     const data = await response.json();
 *     return data.meetings; // Assuming the backend returns { meetings: [...] }
 *
 *   } catch (error) {
 *     console.error("Failed to fetch meetings:", error);
 *     // Optionally, re-throw the error or return a default value
 *     throw error;
 *   }
 * };
 *
 * You would then apply similar logic to all other functions in this file.
 * Remember to handle request bodies for POST/PUT requests and parse responses.
 * =================================================================
 */
// Fix: Import Presentation type to be used in new API functions.
import type { User, Meeting, Task, Notification, Presentation } from '../types';
import { getDB, setDB } from './database';

const MOCK_DELAY = 200;

// A list of mock users that can be "found" via search
const mockUsers: User[] = [
    { id: 'user-2', name: 'Jane Smith', email: 'jane.smith@example.com', company: 'Innovate Inc.', timezone: 'America/New_York' },
    { id: 'user-3', name: 'Mike Chen', email: 'mike.chen@example.com', company: 'Innovate Inc.', timezone: 'America/Los_Angeles' },
    { id: 'user-4', name: 'Sara Lee', email: 'sara.lee@example.com', company: 'Innovate Inc.', timezone: 'Europe/London' },
    { id: 'user-5', name: 'Bob Jones', email: 'bob.jones@example.com', company: 'Solutions Co.', timezone: 'America/Chicago' },
    { id: 'user-6', name: 'Sam Wilson', email: 'sam.wilson@example.com', company: 'Solutions Co.', timezone: 'America/Denver' },
    { id: 'user-7', name: 'Olivia Davis', email: 'olivia.davis@example.com', company: 'Solutions Co.', timezone: 'Australia/Sydney' },
    { id: 'user-8', name: 'David Brown', email: 'david.brown@example.com', company: 'Innovate Inc.', timezone: 'Asia/Tokyo' },
    { id: 'user-9', name: 'Emily White', email: 'emily.white@example.com', company: 'Solutions Co.', timezone: 'Europe/Paris' },
];


// Mock API Functions
const apiRequest = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), MOCK_DELAY));
}

export const login = (email: string, pass: string): Promise<{ token: string, user: User }> => {
    console.log(`Logging in with ${email}/${pass}`);
    const db = getDB();
    if (email === 'test@example.com' && pass === 'password') {
        const token = 'fake-auth-token';
        localStorage.setItem('authToken', token);
        return apiRequest({ token, user: db.user });
    }
    return Promise.reject('Invalid credentials');
}

export const signup = (name: string, email: string, pass: string): Promise<{ token:string, user: User }> => {
    console.log(`Signing up ${name} with ${email}/${pass}`);
    const db = getDB();
    const token = 'fake-auth-token';
    localStorage.setItem('authToken', token);
    const newUser = { ...db.user, name, email };
    setDB({ ...db, user: newUser });
    return apiRequest({ token, user: newUser });
}

export const getProfile = (): Promise<User> => {
    const db = getDB();
    return apiRequest(db.user);
}

export const updateProfile = (userData: Partial<User>): Promise<User> => {
    const db = getDB();
    const updatedUser = { ...db.user, ...userData };
    setDB({ ...db, user: updatedUser });
    return apiRequest(updatedUser);
};


export const getMeetings = (): Promise<Meeting[]> => {
    const db = getDB();
    return apiRequest(db.meetings);
}

export const getMeetingById = (id: string): Promise<Meeting | undefined> => {
    const db = getDB();
    const meeting = db.meetings.find(m => m.id === id);
    return apiRequest(meeting);
}

export const createMeeting = (meetingData: Omit<Meeting, 'id'>): Promise<Meeting> => {
    const db = getDB();
    const newMeeting: Meeting = { ...meetingData, id: `m-${Date.now()}` };
    db.meetings.push(newMeeting);
    setDB(db);
    return apiRequest(newMeeting);
}

export const updateMeeting = (meetingData: Meeting): Promise<Meeting> => {
    const db = getDB();
    const meetingIndex = db.meetings.findIndex(m => m.id === meetingData.id);
    if (meetingIndex > -1) {
        db.meetings[meetingIndex] = meetingData;
        setDB(db);
        return apiRequest(meetingData);
    }
    return Promise.reject('Meeting not found');
};

export const deleteMeeting = (meetingId: string): Promise<{ success: boolean }> => {
    const db = getDB();
    const initialLength = db.meetings.length;
    db.meetings = db.meetings.filter(m => m.id !== meetingId);
    if(db.meetings.length < initialLength) {
        setDB(db);
        return apiRequest({ success: true });
    }
    return Promise.reject('Meeting not found');
};


export const getTasks = (): Promise<Task[]> => {
    const db = getDB();
    return apiRequest(db.tasks);
}

export const addTask = (text: string): Promise<Task> => {
    const db = getDB();
    const newTask: Task = { id: `t-${Date.now()}`, text, completed: false };
    db.tasks.push(newTask);
    setDB(db);
    return apiRequest(newTask);
}

export const updateTask = (task: Task): Promise<Task> => {
    const db = getDB();
    db.tasks = db.tasks.map(t => t.id === task.id ? task : t);
    setDB(db);
    return apiRequest(task);
}

export const deleteTask = (taskId: string): Promise<{ success: boolean }> => {
    const db = getDB();
    db.tasks = db.tasks.filter(t => t.id !== taskId);
    setDB(db);
    return apiRequest({ success: true });
}

export const getNotifications = (): Promise<Notification[]> => {
    const db = getDB();
    return apiRequest(db.notifications);
}

export const acceptMeeting = (notificationId: string): Promise<Meeting> => {
    const db = getDB();
    const notification = db.notifications.find(n => n.id === notificationId);
    if (!notification) return Promise.reject("Notification not found");
    
    const newMeeting: Meeting = {
        id: notification.meetingId,
        title: notification.meetingTitle,
        description: 'Newly accepted meeting.',
        participants: [db.user.email, notification.from],
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 5 * 24.5 * 60 * 60 * 1000).toISOString()
    };
    db.meetings.push(newMeeting);
    db.notifications = db.notifications.filter(n => n.id !== notificationId);
    setDB(db);
    return apiRequest(newMeeting);
}

export const declineMeeting = (notificationId: string): Promise<{ success: true }> => {
    const db = getDB();
    db.notifications = db.notifications.filter(n => n.id !== notificationId);
    setDB(db);

    return apiRequest({ success: true });
}

// Mock function to get availability for a given person on a specific date.
// In a real app, this would query a calendar API.
export const getAvailability = (email: string, date: Date): Promise<string[]> => {
    console.log(`Fetching availability for ${email} on ${date.toDateString()}`);
    // Simple hashing of email to create deterministic "random" busy slots
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    const busySlots = new Set<string>();
    const dayOfWeek = date.getDay();

    // Add some base busy slots based on email hash
    const baseHour1 = Math.abs(hash % 8) + 9; // 9 AM - 4 PM
    const baseHour2 = Math.abs(Math.floor(hash / 7) % 8) + 9;
    busySlots.add(`${String(baseHour1).padStart(2, '0')}:00`);
    busySlots.add(`${String(baseHour1).padStart(2, '0')}:30`);
    busySlots.add(`${String(baseHour2).padStart(2, '0')}:00`);

    // Add more busy slots on weekdays
    if (dayOfWeek > 0 && dayOfWeek < 6) {
        busySlots.add('12:00'); // Lunch
        busySlots.add('12:30'); // Lunch
        const extraBusyHour = Math.abs(Math.floor(hash / 3) % 8) + 9;
        busySlots.add(`${String(extraBusyHour).padStart(2, '0')}:30`);
    }
    
    return apiRequest(Array.from(busySlots));
}

export const searchUserByEmail = (email: string): Promise<User | null> => {
    const foundUser = mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    return apiRequest(foundUser || null);
};

// Fix: Add mock API function to get all presentations.
export const getPresentations = (): Promise<Presentation[]> => {
    const db = getDB();
    return apiRequest(db.presentations || []);
}

// Fix: Add mock API function to get a single presentation by its ID.
export const getPresentationById = (id: string): Promise<Presentation | undefined> => {
    const db = getDB();
    const presentation = (db.presentations || []).find(p => p.id === id);
    return apiRequest(presentation);
};
