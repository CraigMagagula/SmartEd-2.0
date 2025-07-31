import React, { useState } from 'react';
import { generateFlashcards } from '../services/geminiService';
import type { Flashcard } from '../types';
import { XIcon, HelpCircleIcon, LayersIcon, LoadingIcon, RefreshCwIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';

interface ActiveRecallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToQuiz: () => void;
}

const ActiveRecallModal: React.FC<ActiveRecallModalProps> = ({ isOpen, onClose, onNavigateToQuiz }) => {
    const [view, setView] = useState<'choice' | 'generate' | 'study'>('choice');
    const [notes, setNotes] = useState('');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!notes.trim()) {
            setError("Please paste your notes to generate flashcards.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateFlashcards(notes);
            if (result && result.length > 0) {
                setFlashcards(result);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setView('study');
            } else {
                setError("The AI couldn't create flashcards from this text. Please try again with different notes.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetState = () => {
        setView('choice');
        setNotes('');
        setFlashcards([]);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setError(null);
        setIsLoading(false);
    };
    
    const handleClose = () => {
        resetState();
        onClose();
    };
    
    const handleNextCard = () => {
        setIsFlipped(false);
        // Use a short timeout to allow the flip-back animation to be seen before content changes
        setTimeout(() => {
            setCurrentCardIndex(prev => (prev + 1) % flashcards.length);
        }, 150);
    };

    const handlePrevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150);
    };

    if (!isOpen) return null;

    const renderContent = () => {
        switch (view) {
            case 'generate':
                return (
                    <>
                        <h3 className="text-xl font-bold text-slate-800 text-center">Generate Flashcards from Notes</h3>
                        <p className="text-slate-500 text-center mb-4">Paste your study material below, and AI will create flashcards for you.</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={10}
                            placeholder="Paste your notes here..."
                            className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 resize-none"
                        />
                        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                        <div className="flex flex-col items-center gap-3 mt-4">
                            <button onClick={handleGenerate} disabled={isLoading || !notes.trim()} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                                {isLoading ? <LoadingIcon className="w-5 h-5" /> : <LayersIcon className="w-5 h-5" />}
                                <span>{isLoading ? 'Generating...' : 'Generate Flashcards'}</span>
                            </button>
                            <button onClick={() => setView('choice')} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Back</button>
                        </div>
                    </>
                );

            case 'study':
                const card = flashcards[currentCardIndex];
                return (
                     <>
                        <h3 className="text-xl font-bold text-slate-800 text-center">Study Flashcards</h3>
                        <p className="text-slate-500 text-center mb-4">{currentCardIndex + 1} / {flashcards.length}</p>

                        <div className="w-full h-64 [perspective:1000px]">
                            <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? 'rotate-y-180' : ''}`}>
                                {/* Front of card */}
                                <div className="absolute w-full h-full [backface-visibility:hidden] bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center p-6">
                                    <p className="text-2xl font-bold text-slate-800 text-center">{card.term}</p>
                                </div>
                                {/* Back of card */}
                                <div className="absolute w-full h-full [backface-visibility:hidden] bg-slate-100 border-2 border-slate-200 rounded-xl flex items-center justify-center p-6 rotate-y-180">
                                    <p className="text-lg text-slate-700 text-center">{card.definition}</p>
                                </div>
                            </div>
                        </div>
                        
                        <button onClick={() => setIsFlipped(!isFlipped)} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition">
                            <RefreshCwIcon className="w-5 h-5" />
                            Flip Card
                        </button>
                        
                        <div className="flex justify-between items-center mt-4">
                            <button onClick={handlePrevCard} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200" aria-label="Previous Card"><ArrowLeftIcon className="w-5 h-5" /></button>
                            <button onClick={handleNextCard} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200" aria-label="Next Card"><ArrowRightIcon className="w-5 h-5" /></button>
                        </div>

                         <button onClick={resetState} className="w-full mt-4 text-sm text-center text-violet-600 font-semibold hover:underline">
                            Start Over
                        </button>
                    </>
                );

            case 'choice':
            default:
                return (
                    <>
                        <h3 className="text-xl font-bold text-slate-800 text-center">Begin Active Recall</h3>
                        <p className="text-slate-500 text-center mb-6">Choose a method to test your knowledge.</p>
                        <div className="space-y-4">
                            <button onClick={() => { handleClose(); onNavigateToQuiz(); }} className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="w-10 h-10 flex items-center justify-center bg-violet-100 text-violet-600 rounded-lg">
                                    <HelpCircleIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-left">Start a Quiz Session</p>
                                    <p className="text-sm text-slate-500 text-left">Generate a custom quiz on any topic.</p>
                                </div>
                            </button>
                            <button onClick={() => setView('generate')} className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-600 rounded-lg">
                                    <LayersIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-left">Generate Flashcards</p>
                                    <p className="text-sm text-slate-500 text-left">Create flashcards from your notes with AI.</p>
                                </div>
                            </button>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative transform transition-all">
                <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="space-y-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ActiveRecallModal;