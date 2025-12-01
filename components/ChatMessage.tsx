import React from 'react';
import type { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
  children?: React.ReactNode;
}

export const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message, isStreaming, children }) => {
  const { role, content } = message;
  const isUser = role === 'user';

  return (
    <div className={`group w-full text-gray-800 border-b border-black/10 dark:border-gray-900/50 ${isUser ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-[38rem] xl:max-w-3xl p-4 md:py-6 flex lg:px-0 m-auto">
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className="w-[30px]">
            {isUser ? (
                <div className="w-8 h-8 rounded-sm bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                   U
                </div>
            ) : (
                <div className="w-8 h-8 rounded-sm bg-[#10a37f] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                   <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M4.1 9.9 8 13.8l7.9-7.9"></path><path d="M20 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"></path></svg>
                </div>
            )}
          </div>
        </div>
        
        <div className="relative flex-1 overflow-hidden">
            <div className="prose prose-slate prose-sm max-w-none prose-p:my-2 prose-pre:bg-gray-800 prose-pre:text-white leading-7">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                    table: ({node, ...props}) => <div className="overflow-x-auto rounded-lg border border-gray-200 my-4 bg-white shadow-sm"><table className="w-full text-sm" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-gray-50 text-gray-700 border-b border-gray-200" {...props} />,
                    th: ({node, ...props}) => <th className="text-left font-semibold p-3" {...props} />,
                    tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-100" {...props} />,
                    tr: ({node, ...props}) => <tr className="hover:bg-gray-50/50" {...props} />,
                    td: ({node, ...props}) => <td className="p-3 align-top" {...props} />,
                    code: ({node, inline, className, children, ...props}: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className="bg-gray-100 text-red-500 rounded px-1 py-0.5 text-sm" {...props}>
                                {children}
                            </code>
                        )
                    }
                    }}
                >
                    {content}
                </ReactMarkdown>
                {isStreaming && !content.endsWith('▌') && <span className="inline-block animate-pulse font-bold text-gray-500">▍</span>}
            </div>
            {children}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
