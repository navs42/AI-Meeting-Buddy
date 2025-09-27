import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-neutral-200">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-neutral-900">
            MeetSync
          </h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;