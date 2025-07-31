import React, { useState } from 'react';
import type { QuizQuestion } from '../services/geminiService';
import { CheckIcon, XIcon } from './icons';

interface QuizDisplayProps {
  quiz: QuizQuestion[];
  onCompleteQuiz: (result: { score: number; total: number }) => void;
}

export const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz, onCompleteQuiz }) => {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);

  const score = quiz.reduce((acc, q, index) => (userAnswers[index] === q.answer ? acc + 1 : acc), 0);

  const handleAnswerSelect = (questionIndex: number, option: string) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmit = () => {
    setShowResults(true);
    onCompleteQuiz({ score, total: quiz.length });
  };

  const getOptionClass = (questionIndex: number, option: string) => {
    if (!showResults) return userAnswers[questionIndex] === option ? 'bg-violet-200 border-violet-500' : 'border-slate-300 hover:border-violet-400';
    const correctAnswer = quiz[questionIndex].answer;
    const userAnswer = userAnswers[questionIndex];
    if (option === correctAnswer) return 'bg-green-100 border-green-500';
    if (option === userAnswer && option !== correctAnswer) return 'bg-red-100 border-red-500';
    return 'border-slate-300';
  };
  
  const getIconForOption = (questionIndex: number, option: string) => {
    if (!showResults) return null;
    const correctAnswer = quiz[questionIndex].answer;
    const userAnswer = userAnswers[questionIndex];
    if (option === correctAnswer) return <CheckIcon className="w-5 h-5 text-green-600" />;
    if (option === userAnswer && option !== correctAnswer) return <XIcon className="w-5 h-5 text-red-600" />;
    return null;
  };

  return (
    <div className="space-y-8">
      {showResults && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <h2 className="text-2xl font-bold text-slate-800">Quiz Results</h2>
            <p className="text-4xl font-bold my-2 text-violet-600">{score} / {quiz.length}</p>
            <p className="text-slate-500">Great job! Review your answers below.</p>
        </div>
      )}

      {quiz.map((q, index) => (
        <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="font-semibold text-lg text-slate-800 mb-4">
            <span className="font-bold text-violet-600">Q{index + 1}:</span> {q.question}
            </p>
            <div className="space-y-3">
            {q.options.map((option, optionIndex) => (
                <button key={optionIndex} onClick={() => handleAnswerSelect(index, option)} disabled={showResults} className={`w-full flex items-center justify-between text-left p-3 border-2 rounded-md transition-colors text-slate-700 ${getOptionClass(index, option)}`}>
                <span>{option}</span>
                {getIconForOption(index, option)}
                </button>
            ))}
            </div>
        </div>
      ))}
      
      {!showResults && (
        <div className="flex gap-4">
            <button onClick={handleSubmit} disabled={Object.keys(userAnswers).length !== quiz.length} className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                Submit Quiz
            </button>
        </div>
      )}
    </div>
  );
};
