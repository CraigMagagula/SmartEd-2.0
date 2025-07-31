

import React, { useState } from 'react';
import { generateStudyPlan, StudyBlock } from '../services/geminiService';
import { 
    ClockIcon, 
    ActivityIcon, 
    TrendingUpIcon, 
    AwardIcon, 
    TargetIcon, 
    ShieldCheckIcon, 
    LightbulbIcon, 
    CalendarDaysIcon, 
    LoadingIcon, 
    RocketIcon 
} from './icons';
import type { WeeklyGoal as WeeklyGoalType } from './Dashboard';

interface WeeklyGoal extends WeeklyGoalType {}

interface OverviewProps {
    studyTimeToday: number;
    quizzesCompleted: number;
    weeklyGoal: WeeklyGoal;
    onSetWeeklyGoal: (newGoal: { description: string, totalHours: number }) => void;
    onUpdateGoalProgress: (hours: number) => void;
}


const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string, subtitle: string, color: string }> = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
    </div>
);

const Badge: React.FC<{ icon: React.ElementType, title: string, unlocked: boolean }> = ({ icon: Icon, title, unlocked }) => (
    <div className={`text-center transition-opacity ${unlocked ? 'opacity-100' : 'opacity-40'}`}>
        <div className={`relative inline-block`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${unlocked ? 'bg-amber-100' : 'bg-slate-200'}`}>
                <Icon className={`w-10 h-10 ${unlocked ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
        </div>
        <p className={`mt-2 text-sm font-semibold ${unlocked ? 'text-slate-700' : 'text-slate-500'}`}>{title}</p>
    </div>
);

const BadgesPanel = () => {
    const badges: { title: string; unlocked: boolean; icon: React.ElementType }[] = [
        { title: 'Quiz Whiz', unlocked: true, icon: AwardIcon },
        { title: '3-Day Streak', unlocked: true, icon: TrendingUpIcon },
        { title: 'Session Starter', unlocked: true, icon: RocketIcon },
        { title: 'Perfect Score', unlocked: false, icon: TargetIcon },
        { title: 'Night Owl', unlocked: false, icon: ClockIcon },
        { title: 'Master Learner', unlocked: false, icon: ShieldCheckIcon },
    ];
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-violet-600" />
                My Badges
            </h3>
            <div className="grid grid-cols-3 gap-4">
                {badges.map(badge => <Badge key={badge.title} {...badge} />)}
            </div>
        </div>
    );
};

const GoalSetterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (newGoal: { description: string; totalHours: number }) => void;
    currentGoal: WeeklyGoal;
}> = ({ isOpen, onClose, onSave, currentGoal }) => {
    const [description, setDescription] = useState(currentGoal.description);
    const [totalHours, setTotalHours] = useState(currentGoal.totalHours);

    React.useEffect(() => {
        if (isOpen) {
            setDescription(currentGoal.description);
            setTotalHours(currentGoal.totalHours);
        }
    }, [isOpen, currentGoal]);

    const handleSave = () => {
        if (description.trim() && totalHours > 0) {
            onSave({ description, totalHours: Number(totalHours) });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4 transform transition-all">
                <h2 className="text-xl font-bold text-slate-800">Set Your Weekly Goal</h2>
                <div>
                    <label htmlFor="goal-desc" className="block text-sm font-medium text-slate-700 mb-1">Goal Description</label>
                    <input
                        id="goal-desc"
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        placeholder="e.g., Master calculus concepts"
                    />
                </div>
                <div>
                    <label htmlFor="goal-hours" className="block text-sm font-medium text-slate-700 mb-1">Target Hours</label>
                    <input
                        id="goal-hours"
                        type="number"
                        value={totalHours}
                        onChange={e => setTotalHours(Number(e.target.value))}
                        className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        min="1"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition">Save Goal</button>
                </div>
            </div>
        </div>
    );
};


const GoalTracker: React.FC<{ goal: WeeklyGoal, onOpenModal: () => void, onUpdateProgress: (hours: number) => void }> = ({ goal, onOpenModal, onUpdateProgress }) => {
    const progress = goal.totalHours > 0 ? (goal.completedHours / goal.totalHours) * 100 : 0;
    
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <TargetIcon className="w-6 h-6 text-violet-600" />
                Weekly Goal
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-slate-700 truncate pr-2" title={goal.description}>{goal.description}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-sm font-bold text-slate-500">{goal.completedHours.toFixed(1)} / {goal.totalHours}h</p>
                        <button 
                            onClick={() => onUpdateProgress(0.5)} 
                            className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg hover:bg-green-200 transition"
                            aria-label="Add 30 minutes to progress"
                        >
                          +
                        </button>
                    </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-violet-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <button onClick={onOpenModal} className="w-full mt-2 text-sm text-center text-violet-600 font-semibold hover:underline">Set New Goal</button>
            </div>
        </div>
    );
};

const SmartInsights = () => {
    const insights: { text: string; action: string; }[] = [
        { text: 'Your quiz scores in Science are lower than average. Consider reviewing recent topics.', action: 'Review Science' },
        { text: 'You study most effectively in the morning. Try scheduling important tasks then.', action: 'View Schedule' },
    ];
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <LightbulbIcon className="w-6 h-6 text-violet-600" />
                Smart Insights
            </h3>
            <ul className="space-y-4">
                {insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mt-1">
                            <RocketIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-slate-600">{insight.text}</p>
                            <button className="text-sm font-semibold text-violet-600 hover:underline">{insight.action} &rarr;</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const AiStudyPlanner: React.FC = () => {
    const [availability, setAvailability] = useState<string[]>([]);
    const [goal, setGoal] = useState<string>('Revise Biology Chapter 3 and practice 10 algebra problems.');
    const [plan, setPlan] = useState<StudyBlock[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAvailabilityChange = (day: string) => {
        setAvailability(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleGeneratePlan = async () => {
        if (availability.length === 0) {
            setError('Please select at least one available day.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setPlan(null);
        try {
            const result = await generateStudyPlan(availability, goal);
            if (result.plan && result.plan.length > 0) {
                setPlan(result.plan);
            } else {
                setError("The AI couldn't generate a plan. Try adjusting your goals or availability.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                <CalendarDaysIcon className="w-6 h-6 text-violet-600" />
                AI Study Planner
            </h3>
            <p className="text-sm text-slate-500 mb-4">Let AI create a weekly study schedule based on your goals and availability.</p>

            {!plan && !isLoading && (
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">1. What are your study goals for this week?</label>
                        <input
                            type="text"
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                            placeholder="e.g., Study for Math test"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">2. When are you available to study?</label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {days.map(day => (
                                <button
                                    key={day}
                                    onClick={() => handleAvailabilityChange(day)}
                                    className={`px-2 py-2 text-sm font-semibold rounded-md border-2 transition-colors ${
                                        availability.includes(day) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:border-violet-400'
                                    }`}
                                >
                                    {day.substring(0,3)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleGeneratePlan} disabled={isLoading || !goal || availability.length === 0} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                        <span>Generate Plan</span>
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                </div>
            )}
            
            {isLoading && (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                    <LoadingIcon className="w-8 h-8 text-violet-600" />
                    <p className="text-slate-600 font-semibold">AI is crafting your plan...</p>
                </div>
            )}

            {plan && (
                <div>
                    <ul className="space-y-3">
                        {plan.map((item, index) => (
                             <li key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="font-bold text-slate-800">{item.day} - {item.time}</p>
                                <p className="text-slate-600">{item.task} ({item.duration})</p>
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => { setPlan(null); setError(null); }} className="w-full mt-4 text-sm text-center text-violet-600 font-semibold hover:underline">
                        Generate New Plan
                    </button>
                </div>
            )}
        </div>
    );
};

export const Overview: React.FC<OverviewProps> = ({ studyTimeToday, quizzesCompleted, weeklyGoal, onSetWeeklyGoal, onUpdateGoalProgress }) => {
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    const handleSaveGoal = (newGoal: { description: string, totalHours: number }) => {
        onSetWeeklyGoal(newGoal);
        setIsGoalModalOpen(false);
    };

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    };

    return (
        <>
            <GoalSetterModal 
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                onSave={handleSaveGoal}
                currentGoal={weeklyGoal}
            />
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={ClockIcon} title="Today's Study Time" value={formatMinutes(studyTimeToday)} subtitle="Keep up the focus!" color="bg-sky-500" />
                    <StatCard icon={ActivityIcon} title="Weekly Progress" value={`${weeklyGoal.completedHours.toFixed(1)} / ${weeklyGoal.totalHours}h`} subtitle="You're on track!" color="bg-amber-500" />
                    <StatCard icon={TrendingUpIcon} title="Study Streak" value="3 days" subtitle="Keep it up!" color="bg-green-500" />
                    <StatCard icon={AwardIcon} title="Quizzes Completed" value={String(quizzesCompleted)} subtitle="Test your knowledge" color="bg-rose-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <AiStudyPlanner />
                        <SmartInsights />
                    </div>
                    <div className="space-y-6">
                        <GoalTracker 
                            goal={weeklyGoal}
                            onOpenModal={() => setIsGoalModalOpen(true)}
                            onUpdateProgress={onUpdateGoalProgress}
                        />
                        <BadgesPanel />
                    </div>
                </div>
            </div>
        </>
    );
};