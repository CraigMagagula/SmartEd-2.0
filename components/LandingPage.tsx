import React from 'react';
import { PersonalizationIcon, ClockIcon, BookOpenIcon, TargetIcon, SmartEdIcon } from './icons';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const features = [
  {
    name: 'AI-Powered Personalization',
    description: 'Adaptive learning that evolves with your unique learning style and performance.',
    icon: PersonalizationIcon,
  },
  {
    name: 'Smart Study Tools',
    description: 'Integrated Pomodoro timer, note-taking, and personalized study schedules.',
    icon: ClockIcon,
  },
  {
    name: 'Custom Content Generation',
    description: 'AI-generated quizzes, summaries, and study materials tailored to your curriculum.',
    icon: BookOpenIcon,
  },
  {
    name: 'Progress Tracking',
    description: 'Track your learning streaks, performance insights, and adaptive feedback.',
    icon: TargetIcon,
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="bg-gradient-to-b from-[#f3f4fe] to-white text-gray-800 font-sans min-h-screen">
      <div className="relative overflow-hidden">
        <header className="py-6 px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <SmartEdIcon className="w-9 h-9" />
              <span className="font-bold text-2xl text-gray-900">SmartEd</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onSignIn} className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</button>
              <button onClick={onGetStarted} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                Get Started
              </button>
            </div>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900">
            <span className="block">Your Personalized</span>
            <span className="block bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent pb-3">AI Study Buddy</span>
          </h1>
          <p className="mt-6 max-w-md mx-auto text-lg text-gray-600 sm:max-w-xl">
            SmartEd adapts to your unique learning style to help you study smarter, not harder. Get personalized quizzes, study schedules, and AI guidance tailored just for you.
          </p>
          <div className="mt-8">
            <button onClick={onGetStarted} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg text-lg hover:opacity-90 transition-opacity shadow-lg">
              Start Learning &rarr;
            </button>
          </div>
        </main>

        <div className="mt-24 sm:mt-32 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">Why Students Love SmartEd</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              Our AI-powered platform adapts to your learning style, helping you achieve better results with personalized study guidance.
            </p>
          </div>
          <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div key={feature.name} className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <feature.icon className="w-8 h-8 text-indigo-600"/>
                  </div>
                  <h3 className="mt-6 font-bold text-xl text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="py-16 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to Transform Your Learning?</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-indigo-200">
                Join thousands of students who are already studying smarter with AI-powered personalization.
              </p>
              <div className="mt-8">
                <button onClick={onGetStarted} className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg text-lg hover:bg-gray-100 transition-colors shadow-md">
                  Start Your Journey &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
