
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { createSession, streamQuery } from './services/sseService';
import type { Message, ToolCall } from './types';
import { ConnectionStatus } from './types';
import { DEFAULT_BACKEND_URL, DEFAULT_APP_NAME } from './constants';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [userId, setUserId] = useState(`user_${Date.now()}`);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleConnect = useCallback(async () => {
    setConnectionStatus(ConnectionStatus.CONNECTING);
    try {
      const newSessionId = await createSession(backendUrl, appName, userId);
      setSessionId(newSessionId);
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setMessages([]);
    } catch (error) {
      console.error("Failed to connect:", error);
      alert(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [backendUrl, appName, userId]);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!sessionId || connectionStatus !== ConnectionStatus.CONNECTED) {
      alert("Please connect to the backend first.");
      return;
    }

    const userMessage: Message = { id: uuidv4(), role: 'user', content: prompt };
    const assistantMessage: Message = { id: uuidv4(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setConnectionStatus(ConnectionStatus.STREAMING);
    setToolCalls([]);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      await streamQuery(
        { backendUrl, appName, userId, sessionId, message: prompt },
        (event) => {
          if (event.type === 'text_chunk') {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id ? { ...msg, content: msg.content + event.content } : msg
            ));
          } else if (event.type === 'tool_call') {
            setToolCalls(prev => [...prev, { id: uuidv4(), function: event.function, content: event.content }]);
          } else if (event.type === 'error') {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id ? { ...msg, content: `${msg.content}\n\n**Error:** ${event.content}` } : msg
            ));
          }
        },
        signal
      );
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
         setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id ? { ...msg, content: `${msg.content}\n\n**Stream Error:** ${error.message}` } : msg
         ));
      }
    } finally {
      setConnectionStatus(ConnectionStatus.CONNECTED);
      abortControllerRef.current = null;
    }
  }, [sessionId, connectionStatus, backendUrl, appName, userId]);
  
  const handleQuickQuery = (query: string) => {
    handleSendMessage(query);
  };
  
  const handleClearChat = () => {
    setMessages([]);
    setToolCalls([]);
  }

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex font-sans">
      <Sidebar
        backendUrl={backendUrl}
        setBackendUrl={setBackendUrl}
        appName={appName}
        setAppName={setAppName}
        userId={userId}
        setUserId={setUserId}
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onQuickQuery={handleQuickQuery}
        onClear={handleClearChat}
        sessionId={sessionId}
      />
      <main className="flex-1 flex flex-col h-screen">
        <ChatWindow
          messages={messages}
          toolCalls={toolCalls}
          onSendMessage={handleSendMessage}
          connectionStatus={connectionStatus}
        />
      </main>
    </div>
  );
}
