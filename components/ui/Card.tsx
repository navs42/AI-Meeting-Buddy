import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Fix: Update Card component to accept and spread standard HTML div attributes for better flexibility.
const Card: React.FC<CardProps & React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border border-neutral-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Fix: Update CardHeader to accept standard div attributes like `onClick`.
// This resolves the error from passing an `onClick` handler in DashboardPage.tsx.
export const CardHeader: React.FC<CardProps & React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
    return <div className={`border-b border-neutral-200 pb-4 mb-6 ${className}`} {...props}>{children}</div>;
};

// Fix: Update CardTitle to accept and spread standard HTML heading attributes for consistency.
export const CardTitle: React.FC<CardProps & React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }> = ({ children, className = '', as: Component = 'h2', ...props }) => {
    return <Component className={`text-xl font-bold text-neutral-900 ${className}`} {...props}>{children}</Component>;
};

// Fix: Update CardContent to accept and spread standard HTML div attributes for consistency.
export const CardContent: React.FC<CardProps & React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
    return <div className={className} {...props}>{children}</div>;
};

export default Card;
