
import React, { useState, useRef, useEffect } from 'react';
import type { Message, ToolCall, ConnectionStatus } from '../types';
import { ChatMessage } from './ChatMessage';
import { ConnectionStatus as CS } from '../types';
import { ToolCallDisplay } from './ToolCallDisplay';

interface ChatWindowProps {
  messages: Message[];
  toolCalls: ToolCall[];
  onSendMessage: (prompt: string, files?: File[]) => void;
  connectionStatus: ConnectionStatus;
}

const animationStyles = `
@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
`;

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, toolCalls, onSendMessage, connectionStatus }) => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStreaming = connectionStatus === CS.STREAMING;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, toolCalls]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((input.trim() || files.length > 0) && !isStreaming) {
      onSendMessage(input.trim(), files);
      setInput('');
      setFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <style>{animationStyles}</style>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
             <h2 className="text-2xl font-semibold text-gray-800 mb-2">Factory AI Agent</h2>
             <p className="text-gray-500 max-w-md">
               I'm your Business Intelligence assistant. Ask me about Romanian companies, financial data, or market trends.
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-10 max-w-2xl w-full">
                <ExampleCard text="Summarize the top 3 tech companies in Bucharest" onClick={(text) => onSendMessage(text)} />
                <ExampleCard text="What is the turnover for Dacia Plant in 2023?" onClick={(text) => onSendMessage(text)} />
                <ExampleCard text="Compare profit margins for IT sector vs Retail" onClick={(text) => onSendMessage(text)} />
                <ExampleCard text="Analyze the risk factors for construction firms" onClick={(text) => onSendMessage(text)} />
             </div>
          </div>
        ) : (
          <div className="flex flex-col pb-32">
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
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
             {/* Status Text Indicator */}
             {isStreaming && (
                <div className="flex items-center gap-2 mb-2 px-1 animate-pulse">
                    <span className="w-2 h-2 bg-[#10a37f] rounded-full"></span>
                    <span className="text-xs font-medium text-gray-500">Generating response...</span>
                </div>
             )}

             <div className="relative flex flex-col p-3 bg-white border border-gray-300 shadow-md rounded-xl focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden transition-shadow duration-200">
                
                {/* File Previews */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-1">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 animate-fade-in">
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2">
                    {/* Hidden File Input */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        onChange={handleFileChange}
                    />
                    
                    {/* Attachment Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="Attach file"
                        disabled={isStreaming}
                    >
                        <PaperClipIcon className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message..."
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 w-full resize-none border-0 bg-transparent py-2 px-1 focus:ring-0 focus-visible:ring-0 max-h-[200px] overflow-y-auto outline-none text-gray-800 placeholder-gray-400"
                        style={{ minHeight: '24px' }}
                    />
                    
                    <button
                        onClick={handleSubmit}
                        disabled={(!input.trim() && files.length === 0) || isStreaming}
                        className={`p-1.5 rounded-md transition-all ${
                            (input.trim() || files.length > 0) && !isStreaming 
                            ? 'bg-[#10a37f] text-white hover:bg-[#0d8a6a]' 
                            : 'bg-transparent text-gray-300 cursor-not-allowed'
                        }`}
                    >
                        {isStreaming ? (
                             <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
                        ) : (
                            <PaperAirplaneIcon className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {/* Dynamic Progress Bar */}
                {isStreaming && (
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-transparent via-[#10a37f] to-transparent w-1/2" style={{ animation: 'indeterminate 1.5s infinite linear' }}></div>
                    </div>
                )}
             </div>
             <p className="text-center text-xs text-gray-400 mt-2">
                Factory AI Agent may produce inaccurate information about people, places, or facts.
             </p>
        </div>
      </div>
    </div>
  );
};

const ExampleCard: React.FC<{ text: string, onClick: (text: string) => void }> = ({ text, onClick }) => (
    <button 
        onClick={() => onClick(text)}
        className="text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 text-left transition-colors text-gray-600 hover:text-gray-900"
    >
        "{text}" →
    </button>
);

const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const PaperClipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
