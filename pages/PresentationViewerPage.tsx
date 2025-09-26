import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Presentation, Slide } from '../types';
import * as api from '../services/api';
import Button from '../components/ui/Button';
import { ChevronsLeftIcon, ChevronsRightIcon } from '../components/Icons';

const PresentationViewerPage: React.FC = () => {
    const { presentationId } = useParams<{ presentationId: string }>();
    const navigate = useNavigate();
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPresentation = async () => {
            if (!presentationId) return;
            setLoading(true);
            try {
                const fetchedPresentation = await api.getPresentationById(presentationId);
                if (fetchedPresentation) {
                    setPresentation(fetchedPresentation);
                } else {
                    navigate('/presentations');
                }
            } catch (error) {
                console.error("Failed to fetch presentation", error);
                navigate('/presentations');
            } finally {
                setLoading(false);
            }
        };
        fetchPresentation();
    }, [presentationId, navigate]);

    const handleNextSlide = () => {
        if (presentation && currentSlideIndex < presentation.slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    const handlePrevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };
    
    const goToSlide = (index: number) => {
        setCurrentSlideIndex(index);
    }
    
    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading presentation...</div>;
    }

    if (!presentation) {
        return <div className="flex items-center justify-center h-full">Presentation not found.</div>;
    }
    
    const currentSlide = presentation.slides[currentSlideIndex];

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
             <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-neutral-900">{presentation.title}</h1>
                <Button variant="ghost" onClick={() => navigate('/presentations')}>
                    Back to Presentations
                </Button>
            </div>
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Main slide view */}
                <div className="flex-[3] flex flex-col bg-white rounded-xl shadow-sm border border-neutral-200">
                    <div className="p-6 border-b border-neutral-200">
                        <h2 className="text-xl font-bold text-primary">{currentSlide.title}</h2>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto whitespace-pre-wrap text-neutral-700">
                       {currentSlide.content}
                    </div>
                    <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
                         <Button onClick={handlePrevSlide} disabled={currentSlideIndex === 0}>
                            <ChevronsLeftIcon className="w-5 h-5 mr-2" /> Previous
                        </Button>
                        <span>Slide {currentSlideIndex + 1} of {presentation.slides.length}</span>
                        <Button onClick={handleNextSlide} disabled={currentSlideIndex === presentation.slides.length - 1}>
                             Next <ChevronsRightIcon className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* Thumbnails */}
                <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                     <h3 className="font-semibold text-neutral-800 mb-4">Slides</h3>
                     <div className="overflow-y-auto space-y-2 pr-2">
                        {presentation.slides.map((slide, index) => (
                             <button 
                                key={slide.id} 
                                onClick={() => goToSlide(index)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${index === currentSlideIndex ? 'border-primary bg-primary/10' : 'border-transparent bg-neutral-100 hover:bg-neutral-200'}`}
                             >
                                <p className="font-semibold text-sm text-neutral-800 truncate">{index + 1}. {slide.title}</p>
                            </button>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default PresentationViewerPage;
