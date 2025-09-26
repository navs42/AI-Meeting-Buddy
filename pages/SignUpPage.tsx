import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import * as api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SignUpPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { dispatch } = useAppContext();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { user, token } = await api.signup(name, email, password);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
                <Input id="name" type="text" required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} label="Full Name" />
                <Input id="email-address" type="email" autoComplete="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} label="Email Address" />
                <Input id="password" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} label="Password" />
                <Input id="confirm-password" type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} label="Confirm Password" />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
            </div>
            <p className="text-center text-sm text-neutral-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary-focus">
                    Sign In
                </Link>
            </p>
        </form>
    );
};

export default SignUpPage;