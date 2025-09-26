import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import * as api from '../services/api';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// Fix: Replace direct call to Intl.supportedValuesOf with a robust fallback to prevent compilation errors and support older environments.
// Use the Intl API to get a list of all IANA timezones, with a fallback.
const timezones = (() => {
  // The `(Intl as any)` cast is used to bypass a TypeScript error in environments
  // with older lib definitions that don't recognize `supportedValuesOf`.
  if (typeof (Intl as any).supportedValuesOf === 'function') {
    return (Intl as any).supportedValuesOf('timeZone');
  }
  // Fallback to a curated list of common timezones if the API is not available.
  return [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Africa/Cairo',
    'Asia/Tokyo',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Australia/Sydney',
    'Pacific/Honolulu',
    'UTC',
  ];
})();

const ProfilePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [name, setName] = useState(state.user?.name || '');
    const [company, setCompany] = useState(state.user?.company || '');
    const [timezone, setTimezone] = useState(state.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage(null);
        try {
            const updatedUser = await api.updateProfile({ name, company, timezone });
            dispatch({ type: 'UPDATE_USER_PROFILE', payload: updatedUser });
            setStatusMessage({ type: 'success', text: 'Changes saved successfully!' });
        } catch (error) {
            console.error("Failed to save profile", error);
            setStatusMessage({ type: 'error', text: 'Failed to save changes.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSaveChanges}>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input label="Full Name" id="name" value={name} onChange={e => setName(e.target.value)} />
                        <Input label="Email" id="email" value={state.user?.email || ''} readOnly disabled />
                        <Input label="Company" id="company" value={company} onChange={e => setCompany(e.target.value)} />
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Time Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <label htmlFor="timezone" className="block text-sm font-medium text-neutral-600 mb-1">Select Timezone</label>
                        <select id="timezone" value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-neutral-900">
                            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                    </CardContent>
                </Card>
                
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input label="Current Password" id="current-password" type="password" />
                        <Input label="New Password" id="new-password" type="password" />
                        <Input label="Confirm New Password" id="confirm-password" type="password" />
                    </CardContent>
                </Card>

                <div className="flex justify-end items-center gap-4">
                    {statusMessage && (
                      <p className={`text-sm ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {statusMessage.text}
                      </p>
                    )}
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;