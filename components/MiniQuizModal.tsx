import React, { useState } from 'react';
import type { QuizQuestion } from '../services/geminiService';
import { XIcon, CheckIcon } from './icons';

interface MiniQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizQuestion[];
}

export const MiniQuizModal: React.FC<MiniQuizModalProps> = ({ isOpen, onClose, quiz }) => {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (questionIndex: number, option: string) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [questionIndex]: option }));
  };

  const score = quiz.reduce((acc, q, index) => (userAnswers[index] === q.answer ? acc + 1 : acc), 0);

  const getOptionClass = (questionIndex: number, option: string) => {
    if (!showResults) {
        return userAnswers[questionIndex] === option ? 'bg-violet-100 border-violet-400' : 'bg-white hover:bg-slate-50';
    }
    const isCorrect = option === quiz[questionIndex].answer;
    const isSelected = option === userAnswers[questionIndex];

    if (isCorrect) return 'bg-green-100 border-green-400';
    if (isSelected && !isCorrect) return 'bg-red-100 border-red-400';
    return 'bg-white';
  };
  
  const handleClose = () => {
      setUserAnswers({});
      setShowResults(false);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" aria-label="Close quiz">
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 text-center mb-4">Quick Quiz</h2>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2">
            {quiz.map((q, index) => (
                <div key={index}>
                    <p className="font-semibold text-slate-700 mb-2">{index + 1}. {q.question}</p>
                    <div className="space-y-2">
                        {q.options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleAnswerSelect(index, opt)}
                                disabled={showResults}
                                className={`w-full text-left p-3 border rounded-lg transition-colors ${getOptionClass(index, opt)}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <div className="pt-4 border-t border-slate-200 mt-4">
             {showResults ? (
                <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">Your score: {score} / {quiz.length}</p>
                    <button onClick={handleClose} className="mt-2 px-6 py-2 bg-violet-600 text-white font-semibold rounded-lg">Close</button>
                </div>
            ) : (
                <button
                    onClick={() => setShowResults(true)}
                    disabled={Object.keys(userAnswers).length !== quiz.length}
                    className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    Check Answers
                </button>
            )}
        </div>
      </div>
    </div>
  );
};