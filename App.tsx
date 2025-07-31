import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { SignInPage } from './components/SignInPage';

export default function App(): React.ReactNode {
  const [view, setView] = useState('landing'); // states: 'landing', 'signin', 'dashboard'

  const handleNavigateToSignIn = () => {
    setView('signin');
  };

  const handleSignInSuccess = () => {
    setView('dashboard');
  };
  
  const handleBackToHome = () => {
    setView('landing');
  };

  const handleSignOut = () => {
    setView('landing');
  };

  switch (view) {
    case 'signin':
      return <SignInPage onSignInSuccess={handleSignInSuccess} onBackToHome={handleBackToHome} />;
    case 'dashboard':
      return <Dashboard onSignOut={handleSignOut} />;
    case 'landing':
    default:
      return <LandingPage onGetStarted={handleNavigateToSignIn} onSignIn={handleNavigateToSignIn} />;
  }
}