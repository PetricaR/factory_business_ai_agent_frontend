
import React from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
  children?: React.ReactNode;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming, children }) => {
  const { role, content } = message;
  const isUser = role === 'user';
  
  const formattedContent = content.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ));

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0">
          A
        </div>
      )}
      <div className={`max-w-xl p-3 rounded-lg ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
        <div className="prose prose-invert prose-sm max-w-none">
            {formattedContent}
            {isStreaming && <span className="inline-block animate-pulse">▌</span>}
        </div>
        {children}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-white flex-shrink-0">
          U
        </div>
      )}
    </div>
  );
};
