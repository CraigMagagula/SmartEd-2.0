import React from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { QuizResult, StudySession } from '../types';

const todayISO = () => new Date().toISOString().split('T')[0];

export interface ProgressData {
    quizHistory: QuizResult[];
    studyHistory: StudySession[];
}

export const useProgressData = () => {
    const [progressData, setProgressData] = useLocalStorage<ProgressData>('progressData', {
        quizHistory: [],
        studyHistory: [],
    });

    const addStudySession = (minutes: number, rating: 'deep' | 'distracted') => {
        const newSession: StudySession = {
            date: todayISO(),
            minutes,
            rating,
        };
        setProgressData(prev => ({
            ...prev,
            studyHistory: [...prev.studyHistory, newSession],
        }));
    };

    const addQuizResult = (result: Omit<QuizResult, 'date'>) => {
        const newResult: QuizResult = {
            ...result,
            date: todayISO(),
        };
        setProgressData(prev => ({
            ...prev,
            quizHistory: [...prev.quizHistory, newResult],
        }));
    };
    
    // Add some sample data if the history is empty for demonstration purposes
    const initializeSampleData = () => {
         if (progressData.quizHistory.length === 0 && progressData.studyHistory.length === 0) {
            const today = new Date();
            const sampleQuizHistory: QuizResult[] = [];
            const sampleStudyHistory: StudySession[] = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0];

                // Sample study sessions
                const deepFocusMinutes = Math.floor(Math.random() * 45) + 15;
                const distractedMinutes = Math.floor(Math.random() * 30);
                if (deepFocusMinutes > 0) sampleStudyHistory.push({ date: dateString, minutes: deepFocusMinutes, rating: 'deep' });
                if (distractedMinutes > 0) sampleStudyHistory.push({ date: dateString, minutes: distractedMinutes, rating: 'distracted' });

                // Sample quiz results
                const subjects = ['Math', 'Science', 'History'];
                if (i % 2 === 0) { // Add quizzes every other day
                    const subject = subjects[Math.floor(Math.random() * subjects.length)];
                    const total = 10;
                    const score = Math.floor(Math.random() * 5) + 5; // score between 5 and 9
                    sampleQuizHistory.push({ date: dateString, subject, score, total });
                }
            }
             setProgressData({ quizHistory: sampleQuizHistory, studyHistory: sampleStudyHistory });
        }
    };
    
    // This effect runs once on mount to populate sample data if needed.
    React.useEffect(() => {
        initializeSampleData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        progressData,
        addStudySession,
        addQuizResult,
    };
};