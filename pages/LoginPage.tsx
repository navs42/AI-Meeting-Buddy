import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import * as api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { dispatch } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, token } = await api.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm -space-y-px">
        <Input
          id="email-address"
          type="email"
          autoComplete="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Email Address"
        />
        <div className="h-2"/>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label="Password"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <a href="#" className="font-medium text-primary hover:text-primary-focus">
            Forgot your password?
          </a>
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
      <p className="text-center text-sm text-neutral-600">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:text-primary-focus">
          Sign Up
        </Link>
      </p>
    </form>
  );
};

export default LoginPage;