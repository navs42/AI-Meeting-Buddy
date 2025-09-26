import React, { useState } from 'react';
import { BotMessageSquareIcon } from './Icons';
import Input from './ui/Input';
import Button from './ui/Button';

const FloatingAIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary-hover transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    aria-label="Toggle AI Assistant"
                >
                    <BotMessageSquareIcon className="w-8 h-8" />
                </button>
            </div>
            {isOpen && (
                 <div className="fixed bottom-24 right-6 z-50 w-full max-w-sm h-[60vh] max-h-[40rem] bg-white rounded-xl shadow-2xl border border-neutral-200 flex flex-col animate-slide-up">
                     <div className="p-4 border-b border-neutral-200 flex justify-between items-center flex-shrink-0">
                        <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                           <BotMessageSquareIcon className="w-6 h-6 text-primary"/>
                           AI Assistant
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-neutral-800 text-2xl leading-none">&times;</button>
                     </div>
                     <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
                        {/* Chat history goes here */}
                         <div className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">A</div>
                            <div className="bg-primary/10 p-3 rounded-lg rounded-tl-none text-neutral-800">
                                <p>Hi! How can I help you prepare for your day?</p>
                            </div>
                        </div>
                         <div className="flex gap-2 justify-end">
                            <div className="bg-neutral-200 p-3 rounded-lg rounded-br-none text-neutral-800">
                                <p>Summarize my notes from the Q3 review.</p>
                            </div>
                        </div>
                     </div>
                     <div className="p-4 border-t border-neutral-200 flex gap-2 flex-shrink-0">
                        <Input 
                            type="text" 
                            placeholder="Ask AI Buddy..." 
                            className="flex-1"
                        />
                        <Button>Send</Button>
                     </div>
                 </div>
            )}
        </>
    );
};

export default FloatingAIChatbot;
