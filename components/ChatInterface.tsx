
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { SendIcon, MicIcon, StopCircleIcon, LoadingIcon } from './icons';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  error: string | null;
  placeholder?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, placeholder }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setInputText('');
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-center space-x-3 justify-start">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                  <LoadingIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="bg-gray-700 p-3 rounded-lg max-w-lg">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-cyan-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-cyan-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-cyan-400 rounded-full"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            placeholder={isListening ? "Listening..." : (placeholder || "Ask a question about your document...")}
            rows={1}
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 resize-none focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow duration-200"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isLoading}
            className={`p-3 rounded-full transition-colors duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <StopCircleIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
          </button>
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};