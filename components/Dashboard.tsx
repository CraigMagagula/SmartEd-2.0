import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useProgressData } from '../hooks/useProgressData';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { Overview } from './Overview';
import { MyTechniques } from './MyTechniques';
import { QuizGenerator } from './QuizGenerator';
import { Notes } from './Notes';
import { Library } from './Library';
import { PhotoSolver } from './PhotoSolver';
import { AIStudyCoach } from './AIStudyCoach';
import { YouTubeSearch } from './YouTubeSearch';
import { Progress } from './Progress';
import { TestPapers } from './TestPapers';
import type { QuizResult } from '../types';


interface DashboardProps {
  onSignOut: () => void;
}

export interface WeeklyGoal {
    description: string;
    totalHours: number;
    completedHours: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSignOut }) => {
  const [currentPage, setCurrentPage] = useState('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Centralized state management using custom hooks
  const { progressData, addStudySession, addQuizResult } = useProgressData();

  // Legacy state for Overview page (can be refactored to use progressData later)
  const [studyTimeToday, setStudyTimeToday] = useLocalStorage<number>('studyTimeToday', 45); // in minutes
  const [quizzesCompleted, setQuizzesCompleted] = useLocalStorage<number>('quizzesCompleted', 5);
  const [weeklyGoal, setWeeklyGoal] = useLocalStorage<WeeklyGoal>('weeklyGoal', {
    description: "Study Math for 5h",
    totalHours: 5,
    completedHours: 2.5
  });

  const handleAddStudyTime = (minutes: number) => {
    // This is for the simple counter on Overview. It's separate from the detailed progress data.
    setStudyTimeToday(prev => prev + minutes);
  };
  
  const handleSessionComplete = (session: { minutes: number, rating: 'deep' | 'distracted' }) => {
    addStudySession(session.minutes, session.rating);
    handleAddStudyTime(session.minutes); // Also update the simple daily counter
  };

  const handleCompleteQuiz = (result: Omit<QuizResult, 'date'>) => {
    addQuizResult(result);
    setQuizzesCompleted(prev => prev + 1); // Update simple counter
  };

  const handleSetWeeklyGoal = (newGoal: { description: string, totalHours: number }) => {
    setWeeklyGoal({
      ...newGoal,
      completedHours: 0,
    });
  };

  const handleUpdateGoalProgress = (hours: number) => {
    setWeeklyGoal(prev => ({
        ...prev,
        completedHours: Math.min(prev.totalHours, prev.completedHours + hours)
    }));
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'Overview':
        return <Overview 
            studyTimeToday={studyTimeToday}
            quizzesCompleted={quizzesCompleted}
            weeklyGoal={weeklyGoal}
            onSetWeeklyGoal={handleSetWeeklyGoal}
            onUpdateGoalProgress={handleUpdateGoalProgress}
        />;
      case 'My Techniques':
        return <MyTechniques setCurrentPage={setCurrentPage} onAddStudyTime={handleSessionComplete} />;
      case 'Quiz Generator':
        return <QuizGenerator setCurrentPage={setCurrentPage} onCompleteQuiz={handleCompleteQuiz} />;
      case 'Smart Notes & Summaries':
        return <Notes setCurrentPage={setCurrentPage} />;
      case 'Library':
        return <Library setCurrentPage={setCurrentPage} />;
      case 'Photo Solver':
        return <PhotoSolver setCurrentPage={setCurrentPage} />;
      case 'AI Study Coach':
        return <AIStudyCoach setCurrentPage={setCurrentPage} />;
      case 'YouTube Search':
        return <YouTubeSearch setCurrentPage={setCurrentPage} />;
      case 'Test Papers':
        return <TestPapers setCurrentPage={setCurrentPage} />;
      case 'Progress':
        return <Progress setCurrentPage={setCurrentPage} progressData={progressData} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-2 text-slate-800">{currentPage}</h2>
              <p className="text-slate-500">This page is under construction. Check back soon!</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onSignOut={onSignOut} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
