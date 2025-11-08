
import React, { useState, useRef, useEffect } from 'react';
import type { Message, ToolCall, ConnectionStatus } from '../types';
import { ChatMessage } from './ChatMessage';
import { ConnectionStatus as CS } from '../types';

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
    <div className="flex flex-col h-full bg-gray-900">
      <header className="p-4 border-b border-gray-700 shadow-md">
        <h1 className="text-2xl font-bold text-white">🏭 Factory AI Agent</h1>
        <p className="text-sm text-gray-400">Romanian Business Intelligence Multi-Agent System</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
             {isConnected ? (
              <>
                <div className="text-5xl mb-4">🤖</div>
                <h2 className="text-2xl font-semibold">Ready to Assist</h2>
                <p>Ask about Romanian companies to get started.</p>
              </>
            ) : (
              <>
                 <div className="text-5xl mb-4">🔌</div>
                <h2 className="text-2xl font-semibold">Not Connected</h2>
                <p>Please use the sidebar to connect to the backend service.</p>
              </>
            )}
          </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessage key={msg.id} message={msg} isStreaming={isStreaming && index === messages.length - 1}>
            {msg.role === 'assistant' && index === messages.length - 1 && toolCalls.length > 0 && (
              <div className="mt-4 space-y-2">
                {toolCalls.map(tc => (
                  <div key={tc.id} className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm flex items-center">
                    <span className="text-lg mr-2">🔧</span>
                    <span className="font-mono text-gray-300">{tc.content}</span>
                  </div>
                ))}
              </div>
            )}
          </ChatMessage>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConnected ? "Ask about Romanian companies..." : "Connect to send messages"}
            disabled={!isConnected || isStreaming}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-700"
          />
          <button
            type="submit"
            disabled={!isConnected || isStreaming || !input.trim()}
            className="bg-indigo-600 text-white font-bold p-2 rounded-full hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L10.999 7.5l-6.53 6.53a.75.75 0 00.826.95l4.95-1.414a.75.75 0 00.95-.826l-1.414-4.95z" />
        <path d="M6.25 18.25a.75.75 0 00.75-.75V10.5a.75.75 0 00-1.5 0v7a.75.75 0 00.75.75z" />
    </svg>
);
