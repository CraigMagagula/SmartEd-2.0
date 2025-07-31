import React, { useState, useEffect } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { evaluateFeynmanExplanation, FeynmanEvaluation } from '../services/geminiService';
import { XIcon, MicIcon, StopCircleIcon, LoadingIcon, SparklesIcon, LightbulbIcon, BookTextIcon } from './icons';

interface FeynmanTechniqueProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeynmanTechnique: React.FC<FeynmanTechniqueProps> = ({ isOpen, onClose }) => {
  const [concept, setConcept] = useState('');
  const [explanation, setExplanation] = useState('');
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTextbookDef, setShowTextbookDef] = useState(false);

  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    if (transcript) {
      setExplanation(prev => prev + transcript);
    }
  }, [transcript]);

  const handleEvaluate = async () => {
    if (!concept.trim() || !explanation.trim()) {
      setError("Please provide both a concept and an explanation.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEvaluation(null);
    setShowTextbookDef(false);
    try {
      const result = await evaluateFeynmanExplanation(concept, explanation);
      setEvaluation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetWorkspace = () => {
      setConcept('');
      setExplanation('');
      setEvaluation(null);
      setError(null);
      setShowTextbookDef(false);
  };

  const handleClose = () => {
      resetWorkspace();
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col relative transform transition-all">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close Feynman workspace">
          <XIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">Feynman Technique Workspace</h2>
        <p className="text-center text-slate-500 mb-6">Explain a concept in your own words to find your knowledge gaps.</p>
        
        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
            {!evaluation && !isLoading && (
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="concept" className="block text-sm font-medium text-slate-700 mb-1">1. Choose a Concept</label>
                        <input
                            id="concept"
                            type="text"
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                            placeholder="e.g., Photosynthesis, Supply and Demand"
                            className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="explanation" className="block text-sm font-medium text-slate-700 mb-1">2. Explain It Simply</label>
                        <div className="relative">
                            <textarea
                                id="explanation"
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                rows={8}
                                placeholder="Explain the concept as if you were teaching it to a 12-year-old..."
                                className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 resize-none"
                                disabled={isListening}
                            />
                            <button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}`}
                                aria-label={isListening ? 'Stop recording' : 'Start recording explanation'}
                            >
                                {isListening ? <StopCircleIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                 </div>
            )}

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <LoadingIcon className="w-10 h-10 text-violet-600" />
                    <p className="text-slate-600 font-semibold">AI is analyzing your explanation...</p>
                    <p className="text-sm text-slate-500">This might take a moment.</p>
                </div>
            )}
            
            {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">{error}</div>}

            {evaluation && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <SparklesIcon className="w-6 h-6 text-violet-600" /> AI Evaluation Results
                        </h3>
                        <p className="text-slate-600 mt-1">For your explanation of: <span className="font-semibold">{concept}</span></p>
                    </div>
                    <div className="bg-violet-50 border-l-4 border-violet-500 p-4 rounded-r-lg">
                        <p className="font-bold text-violet-800">Clarity Score: {evaluation.clarityScore}/10</p>
                        <p className="text-violet-700">{evaluation.feedback}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><LightbulbIcon className="w-5 h-5 text-amber-500" /> Weak Spots to Review</h4>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                            {evaluation.weakSpots.map((spot, i) => <li key={i}>{spot}</li>)}
                        </ul>
                    </div>
                    {showTextbookDef && (
                         <div>
                            <h4 className="font-bold text-slate-700 flex items-center gap-2"><BookTextIcon className="w-5 h-5 text-green-600" /> Textbook Definition</h4>
                            <div className="mt-2 p-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-700">
                                <p>{evaluation.textbookDefinition}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        <div className="pt-6 border-t border-slate-200 flex items-center gap-4">
            {evaluation && (
                <>
                    <button 
                        onClick={() => setShowTextbookDef(s => !s)} 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-colors"
                    >
                        <BookTextIcon className="w-5 h-5" />
                        {showTextbookDef ? 'Hide Definition' : 'Compare with Textbook'}
                    </button>
                    <button 
                        onClick={resetWorkspace} 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition"
                    >
                        Try Another Concept
                    </button>
                </>
            )}
            {!evaluation && (
                 <button 
                    onClick={handleEvaluate} 
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                 >
                    {isLoading ? <LoadingIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                    <span>{isLoading ? 'Evaluating...' : 'Evaluate My Explanation'}</span>
                 </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default FeynmanTechnique;