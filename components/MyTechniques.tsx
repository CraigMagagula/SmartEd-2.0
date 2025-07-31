import React, { useState } from 'react';
import { ArrowLeftIcon, InfoIcon } from './icons';
import PomodoroTimer from './PomodoroTimer';
import FeynmanTechnique from './FeynmanTechnique';
import ActiveRecallModal from './ActiveRecallModal';

interface MyTechniquesProps {
  setCurrentPage: (page: string) => void;
  onAddStudyTime: (session: { minutes: number; rating: 'deep' | 'distracted' }) => void;
}

const techniques = [
    {
        id: 'active-recall',
        name: 'Active Recall',
        description: 'Test yourself without looking at notes or materials',
        details: 'Actively retrieve information from memory instead of passive review.'
    },
    {
        id: 'pomodoro',
        name: 'Pomodoro Technique',
        description: '25-minute focused work sessions with short breaks',
        details: 'Work in focused intervals followed by short breaks to maintain concentration.'
    },
    {
        id: 'feynman',
        name: 'Feynman Technique',
        description: 'Explain concepts in simple terms to identify knowledge gaps',
        details: 'Teach the concept to someone else or explain it simply to identify what you don\'t understand.'
    }
];

interface TechniqueCardProps {
    id: string;
    name: string;
    description: string;
    details: string;
    onImplement: (id: string) => void;
}


const TechniqueCard: React.FC<TechniqueCardProps> = ({ id, name, description, details, onImplement }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-800">{name}</h3>
                <button className="text-slate-400 hover:text-slate-600">
                    <InfoIcon className="w-5 h-5" />
                </button>
            </div>
            <p className="mt-2 text-slate-600">{description}</p>
            <p className="mt-1 text-sm text-slate-500">{details}</p>
        </div>
        <button onClick={() => onImplement(id)} className="mt-6 w-full px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors">
            + Implement
        </button>
    </div>
);

export const MyTechniques: React.FC<MyTechniquesProps> = ({ setCurrentPage, onAddStudyTime }) => {
    const [isPomodoroModalOpen, setIsPomodoroModalOpen] = useState(false);
    const [isFeynmanModalOpen, setIsFeynmanModalOpen] = useState(false);
    const [isActiveRecallModalOpen, setIsActiveRecallModalOpen] = useState(false);

    const handleImplementClick = (techniqueId: string) => {
        if (techniqueId === 'pomodoro') {
            setIsPomodoroModalOpen(true);
        } else if (techniqueId === 'feynman') {
            setIsFeynmanModalOpen(true);
        } else if (techniqueId === 'active-recall') {
            setIsActiveRecallModalOpen(true);
        } else {
            alert(`Implementation for "${techniqueId}" is coming soon!`);
        }
    };
    
    const handleNavigateToQuiz = () => {
        setCurrentPage('Quiz Generator');
    };

  return (
    <>
        <PomodoroTimer 
            isOpen={isPomodoroModalOpen}
            onClose={() => setIsPomodoroModalOpen(false)}
            onSessionComplete={onAddStudyTime}
        />
        <FeynmanTechnique
            isOpen={isFeynmanModalOpen}
            onClose={() => setIsFeynmanModalOpen(false)}
        />
        <ActiveRecallModal 
            isOpen={isActiveRecallModalOpen}
            onClose={() => setIsActiveRecallModalOpen(false)}
            onNavigateToQuiz={handleNavigateToQuiz}
        />
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentPage('Overview')} className="p-2 rounded-md hover:bg-slate-200 transition-colors">
                <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-slate-900">My Techniques</h1>
                <p className="text-slate-500">Manage your personalized learning techniques</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
                System Recommended Techniques
                <span className="ml-2 bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">3</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techniques.map(tech => <TechniqueCard key={tech.id} {...tech} onImplement={handleImplementClick} />)}
            </div>
          </div>
        </div>
    </>
  );
};