import React from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 border border-neutral-200">
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;