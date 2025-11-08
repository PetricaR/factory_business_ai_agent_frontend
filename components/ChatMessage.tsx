
import React from 'react';
import type { Message } from '../types';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';

interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
  children?: React.ReactNode;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming, children }) => {
  const { role, content } = message;
  const isUser = role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md">
          A
        </div>
      )}
      <div className={`max-w-3xl p-3 rounded-lg shadow-md ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
        <div className="prose prose-sm max-w-none prose-p:my-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({node, ...props}) => <div className="overflow-x-auto rounded-lg border border-gray-300 my-4 bg-white"><table className="w-full text-sm" {...props} /></div>,
                thead: ({node, ...props}) => <thead className="bg-gray-100 text-gray-700" {...props} />,
                th: ({node, ...props}) => <th className="text-left font-semibold p-3 border-b border-gray-300" {...props} />,
                tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200" {...props} />,
                tr: ({node, ...props}) => <tr className="even:bg-gray-50" {...props} />,
                td: ({node, ...props}) => <td className="p-3" {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
          {isStreaming && !content.endsWith('▌') && <span className="inline-block animate-pulse">▌</span>}
        </div>
        {children}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md">
          U
        </div>
      )}
    </div>
  );
};
