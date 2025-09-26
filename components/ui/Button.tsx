import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary focus:ring-offset-white',
    secondary: 'bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary focus:ring-offset-white',
    ghost: 'bg-transparent text-neutral-700 border border-neutral-300 hover:bg-neutral-100 focus:ring-neutral-500 focus:ring-offset-white',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-offset-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${props.className || ''}`;

  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};

export default Button;