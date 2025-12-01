import React, { useState, useRef, useEffect } from 'react';
import type { Message, ToolCall, ConnectionStatus } from '../types';
import { ChatMessage } from './ChatMessage';
import { ConnectionStatus as CS } from '../types';
import { ToolCallDisplay } from './ToolCallDisplay';

interface ChatWindowProps {
  messages: Message[];
  toolCalls: ToolCall[];
  onSendMessage: (prompt: string) => void;
  connectionStatus: ConnectionStatus;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, toolCalls, onSendMessage, connectionStatus }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isConnected = connectionStatus === CS.CONNECTED || connectionStatus === CS.STREAMING;
  const isStreaming = connectionStatus === CS.STREAMING;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, toolCalls]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && isConnected && !isStreaming) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="p-4 border-b border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm sticky top-0">
        <h1 className="text-2xl font-bold text-gray-900">🏭 Factory AI Agent</h1>
        <p className="text-sm text-gray-500">Romanian Business Intelligence Multi-Agent System</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
             {isConnected ? (
              <>
                <AiLogoIcon className="w-24 h-24 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-700">Ready to Assist</h2>
                <p>Ask about Romanian companies to get started.</p>
              </>
            ) : (
              <>
                 <div className="text-5xl mb-4">🔌</div>
                <h2 className="text-2xl font-semibold text-gray-700">Not Connected</h2>
                <p>Please use the sidebar to connect to the backend service.</p>
              </>
            )}
          </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessage key={msg.id} message={msg} isStreaming={isStreaming && index === messages.length - 1}>
            {msg.role === 'assistant' && index === messages.length - 1 && toolCalls.length > 0 && (
              <div className="mt-2">
                {toolCalls.map(tc => (
                  <ToolCallDisplay key={tc.id} toolCall={tc} />
                ))}
              </div>
            )}
          </ChatMessage>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConnected ? "Ask about Romanian companies..." : "Connect to send messages"}
            disabled={!isConnected || isStreaming}
            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200"
          />
          <button
            type="submit"
            disabled={!isConnected || isStreaming || !input.trim()}
            className="bg-indigo-600 text-white font-bold p-3 rounded-full hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

const AiLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Head shape */}
    <path 
      d="M18 10H6C4.89543 10 4 10.8954 4 12V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12C20 10.8954 19.1046 10 18 10Z" 
      className="text-gray-300" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Antenna */}
    <path 
      d="M12 10V6" 
      className="text-gray-300" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M12 4H12.01" 
      className="text-indigo-500" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Eyes */}
    <path 
      d="M9 15H9.01" 
      className="text-gray-700" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M15 15H15.01" 
      className="text-gray-700" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);


const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);