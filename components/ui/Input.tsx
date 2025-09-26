import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-600 mb-1">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
          <input
            id={id}
            ref={ref}
            className={`w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-neutral-400 text-neutral-900 ${icon ? 'pl-10' : ''} ${props.disabled ? 'cursor-not-allowed opacity-60 bg-neutral-100' : ''}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;