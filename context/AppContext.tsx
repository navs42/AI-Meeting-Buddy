import React, { createContext, useReducer, useContext, useEffect } from 'react';
// Fix: Import Presentation type.
import type { User, Meeting, Task, Notification, Presentation } from '../types';
import * as api from '../services/api';
import { initializeDB } from '../services/database';

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  meetings: Meeting[];
  tasks: Task[];
  notifications: Notification[];
  // Fix: Add presentations to the global app state.
  presentations: Presentation[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  // Fix: Add presentations to the SET_DATA action payload.
  | { type: 'SET_DATA'; payload: { meetings: Meeting[]; tasks: Task[]; notifications: Notification[]; presentations: Presentation[] } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_MEETING'; payload: Meeting }
  | { type: 'UPDATE_MEETING'; payload: Meeting }
  | { type: 'DELETE_MEETING'; payload: string }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_USER_PROFILE'; payload: User };

const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  meetings: [],
  tasks: [],
  notifications: [],
  // Fix: Initialize presentations in the initial state.
  presentations: [],
  loading: true,
  error: null,
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, user: action.payload.user };
    case 'LOGOUT':
      localStorage.removeItem('authToken');
      return { ...initialState, isAuthenticated: false, loading: false };
    case 'SET_DATA':
      return { ...state, ...action.payload, loading: false };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'ADD_MEETING':
      return { ...state, meetings: [...state.meetings, action.payload] };
    case 'UPDATE_MEETING':
       return { 
         ...state, 
         meetings: state.meetings.map(m => m.id === action.payload.id ? action.payload : m)
       };
    case 'DELETE_MEETING':
      return {
        ...state,
        meetings: state.meetings.filter(m => m.id !== action.payload),
      };
    case 'DISMISS_NOTIFICATION':
       return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload)};
    case 'UPDATE_USER_PROFILE':
       return { ...state, user: action.payload };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Initialize the local storage database on first load
    initializeDB();

    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const user = await api.getProfile();
          // If profile fetch is successful, we are authenticated.
          // The data fetching will be triggered by the other useEffect.
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        } catch (error) {
          // If token is invalid or profile fetch fails, log out.
          dispatch({ type: 'LOGOUT' });
        }
      } else {
         // No token, so we are logged out.
         // LOGOUT action also sets loading to false.
         dispatch({ type: 'LOGOUT' });
      }
    };
    checkAuth();
  }, []); // Run only once on initial component mount.

  useEffect(() => {
    // This effect runs whenever the authentication status changes.
    if (state.isAuthenticated) {
      const fetchData = async () => {
        try {
          // Fix: Fetch presentations along with other application data.
          const [meetings, tasks, notifications, presentations] = await Promise.all([
            api.getMeetings(),
            api.getTasks(),
            api.getNotifications(),
            api.getPresentations(),
          ]);
          // SET_DATA sets the fetched data and also sets loading to false.
          dispatch({ type: 'SET_DATA', payload: { meetings, tasks, notifications, presentations } });
        } catch (error) {
          console.error("Failed to fetch application data:", error);
          // If fetching data fails, log the user out to handle the error state.
          dispatch({ type: 'LOGOUT' });
        }
      };

      fetchData();
    }
  }, [state.isAuthenticated]); // Dependency on isAuthenticated ensures this runs on login.

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);