import React, { useState } from 'react';
import { SmartEdIcon, EnvelopeIcon, ArrowLeftIcon } from './icons';

interface SignInPageProps {
  onSignInSuccess: () => void;
  onBackToHome: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignInSuccess, onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd have validation and an API call here.
    // For this demo, we'll just proceed on any input.
    if (email && password) {
      onSignInSuccess();
    } else {
      alert('Please enter your email and password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50 flex flex-col justify-center items-center p-4 font-sans text-slate-700">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-2">
             <SmartEdIcon className="w-10 h-10" />
             <span className="text-3xl font-bold text-slate-800">SmartEd</span>
          </div>
          <p className="text-slate-500">Join thousands of learners worldwide</p>
        </header>

        <main className="w-full bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Get Started</h1>
          
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg mb-6">
            <button 
              onClick={() => setActiveTab('signin')} 
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === 'signin' ? 'bg-white shadow' : 'text-slate-500'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setActiveTab('signup')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === 'signup' ? 'bg-white shadow' : 'text-slate-500'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">Email</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                className="w-full px-4 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">Password</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" 
                className="w-full px-4 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity"
            >
              <EnvelopeIcon className="w-5 h-5" />
              Sign In
            </button>
          </form>
          
          <button 
            onClick={onBackToHome}
            className="w-full flex justify-center items-center gap-2 mt-4 px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </button>
        </main>
      </div>

      <footer className="mt-8 text-center text-slate-500 text-sm">
        <p>Join 50,000+ learners already using SmartEd</p>
      </footer>
    </div>
  );
};