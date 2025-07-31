import React, { useState, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, RotateCcwIcon, XIcon, BellIcon, BrainCircuitIcon, WindIcon } from './icons';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionComplete: (session: { minutes: number, rating: 'deep' | 'distracted' }) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ isOpen, onClose, onSessionComplete }) => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [view, setView] = useState<'setup' | 'timer' | 'rating'>('setup');
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  const lastWorkMinutes = React.useRef(workMinutes);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };
  
  const showNotification = useCallback((title: string, body: string) => {
    if (notificationPermission === 'granted') {
      new Notification(title, { body });
    }
  }, [notificationPermission]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && secondsLeft > 0) {
      interval = window.setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);
      if (mode === 'work') {
        showNotification('Work session over!', 'Time for a break.');
        lastWorkMinutes.current = workMinutes;
        setView('rating');
      } else {
        showNotification('Break is over!', 'Time to get back to work.');
        setMode('work');
        setSecondsLeft(workMinutes * 60);
        setIsActive(true); // Automatically start the next work session
      }
    }

    return () => clearInterval(interval);
  }, [isActive, secondsLeft, mode, workMinutes, breakMinutes, showNotification]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode('work');
    setSecondsLeft(workMinutes * 60);
  };
  
  const handleStartSession = () => {
      setSecondsLeft(workMinutes * 60);
      setMode('work');
      setView('timer');
      setIsActive(true);
  }
  
  const handleClose = () => {
    setIsActive(false);
    setView('setup');
    onClose();
  }
  
  const handleRatingSubmit = (rating: 'deep' | 'distracted') => {
      onSessionComplete({ minutes: lastWorkMinutes.current, rating });
      // Start the break
      setMode('break');
      setSecondsLeft(breakMinutes * 60);
      setView('timer');
      setIsActive(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const renderSetup = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 text-center">Pomodoro Timer</h2>
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Session Presets</label>
            <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setWorkMinutes(25); setBreakMinutes(5); }} className={`p-3 rounded-lg border-2 transition-colors ${workMinutes === 25 ? 'border-violet-600 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300'}`}>
                <p className="font-semibold text-slate-800">25 min work</p>
                <p className="text-sm text-slate-500">5 min break</p>
            </button>
            <button onClick={() => { setWorkMinutes(50); setBreakMinutes(10); }} className={`p-3 rounded-lg border-2 transition-colors ${workMinutes === 50 ? 'border-violet-600 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300'}`}>
                <p className="font-semibold text-slate-800">50 min work</p>
                <p className="text-sm text-slate-500">10 min break</p>
            </button>
            </div>
        </div>
        <div className="flex justify-center">
            <button onClick={handleStartSession} className="w-full px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors">
                Start Session
            </button>
        </div>
        {notificationPermission !== 'granted' && (
            <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">Enable notifications to get alerts when sessions end.</p>
                <button onClick={requestNotificationPermission} className="mt-2 text-sm font-semibold text-violet-600 hover:underline flex items-center justify-center w-full gap-1">
                    <BellIcon className="w-4 h-4" />
                    Enable Notifications
                </button>
            </div>
        )}
    </div>
  );
  
  const renderTimer = () => {
    const totalSeconds = (mode === 'work' ? workMinutes : breakMinutes) * 60;
    const progressPercentage = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
    
    return (
        <div className="flex flex-col items-center space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 text-center">Pomodoro Timer</h2>
            <div className="relative w-56 h-56">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-slate-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle 
                        className={mode === 'work' ? 'text-violet-600' : 'text-green-500'}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={(2 * Math.PI * 45) * (1 - progressPercentage / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className={`text-5xl font-bold text-slate-800 tracking-tighter`}>{formatTime(secondsLeft)}</p>
                    <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">{mode}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={toggleTimer} className="w-20 h-20 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-violet-700 transition" aria-label={isActive ? 'Pause timer' : 'Start timer'}>
                {isActive ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
              </button>
              <button onClick={resetTimer} className="w-14 h-14 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center shadow-md hover:bg-slate-300 transition" aria-label="Reset Timer">
                <RotateCcwIcon className="w-7 h-7" />
              </button>
            </div>

            <button onClick={() => { setIsActive(false); setView('setup'); }} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                Back to Settings
            </button>
          </div>
    );
  };
  
  const renderRating = () => (
      <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Session Complete!</h2>
          <p className="text-slate-600">How was your focus during that session?</p>
          <div className="flex gap-4 pt-2">
              <button 
                onClick={() => handleRatingSubmit('deep')}
                className="flex-1 flex flex-col items-center p-4 border-2 border-slate-200 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition"
              >
                  <BrainCircuitIcon className="w-10 h-10 text-violet-600 mb-2"/>
                  <span className="font-semibold text-slate-800">Deep Focus</span>
              </button>
              <button 
                onClick={() => handleRatingSubmit('distracted')}
                className="flex-1 flex flex-col items-center p-4 border-2 border-slate-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
              >
                   <WindIcon className="w-10 h-10 text-orange-500 mb-2"/>
                   <span className="font-semibold text-slate-800">Distracted</span>
              </button>
          </div>
      </div>
  );

  const renderContent = () => {
      switch(view) {
          case 'setup': return renderSetup();
          case 'timer': return renderTimer();
          case 'rating': return renderRating();
          default: return renderSetup();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close Pomodoro Timer">
          <XIcon className="w-6 h-6" />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default PomodoroTimer;
