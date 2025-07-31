
import React, { useState } from 'react';
import type { Message } from '../types';
import { getStudyCoachResponse } from '../services/geminiService';
import { ChatInterface } from './ChatInterface';
import { ArrowLeftIcon, SparklesIcon } from './icons';

interface AIStudyCoachProps {
  setCurrentPage: (page: string) => void;
}

export const AIStudyCoach: React.FC<AIStudyCoachProps> = ({ setCurrentPage }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI Study Coach. How can I help you today? You can ask me to explain a concept, summarize a topic, or just give you some motivation!",
      sender: 'ai',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (text: string) => {
    const newUserMessage: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await getStudyCoachResponse(text);
      const newAiMessage: Message = { id: Date.now() + 1, text: responseText, sender: 'ai' };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      const errorAiMessage: Message = { id: Date.now() + 1, text: `Error: ${errorMessage}`, sender: 'ai' };
      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
        <div className="flex items-center gap-4 p-4 flex-shrink-0">
            <button onClick={() => setCurrentPage('Overview')} className="p-2 rounded-md hover:bg-slate-200 transition-colors">
                <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <SparklesIcon className="w-8 h-8 text-violet-600" />
                    AI Study Coach
                </h1>
                <p className="text-slate-500">Your personal AI-powered learning assistant.</p>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                error={error}
                placeholder="Ask your AI Study Coach anything..."
            />
        </div>
    </div>
  );
};
