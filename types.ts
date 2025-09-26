export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  timezone?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  participants: string[];
  startTime: string;
  endTime: string;
  documents?: { name: string; url: string }[];
  aiNotes?: string;
  manualNotes?: string;
  passcode?: string;
  waitingRoom?: boolean;
  hostVideoOn?: boolean;
  participantVideoOn?: boolean;
}

export interface Task {
  id:string;
  text: string;
  completed: boolean;
  meetingId?: string;
}

export interface Notification {
  id: string;
  type: 'meeting_request';
  from: string;
  meetingTitle: string;
  meetingId: string;
}

// Fix: Add Slide and Presentation types for presentation feature.
export interface Slide {
  id: string;
  title: string;
  content: string;
}

export interface Presentation {
  id: string;
  title: string;
  description: string;
  slides: Slide[];
}
