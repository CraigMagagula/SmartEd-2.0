
import React from 'react';
import type { Message } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { UserIcon, BrainCircuitIcon, Volume2Icon, VolumeXIcon } from './icons';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { isSpeaking, speak, stop } = useTextToSpeech();
  const isUser = message.sender === 'user';
  const isError = message.sender === 'ai' && message.text.startsWith('Error:');

  const handleSpeakClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(message.text);
    }
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isError ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-cyan-400'}`}>
          <BrainCircuitIcon className="w-6 h-6" />
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`p-4 rounded-2xl max-w-lg lg:max-w-xl ${
            isUser 
            ? 'bg-cyan-600 text-white rounded-br-none' 
            : isError
            ? 'bg-red-900/50 text-red-300 border border-red-500/30 rounded-bl-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}>
            <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        {!isUser && !isError && (
             <button onClick={handleSpeakClick} className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors">
                {isSpeaking ? <VolumeXIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
                <span>{isSpeaking ? 'Stop' : 'Read aloud'}</span>
            </button>
        )}
      </div>
      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-gray-400">
          <UserIcon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};
