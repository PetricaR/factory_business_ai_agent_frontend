import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { LoginPage } from './components/LoginPage';
import { createSession, streamQuery } from './services/sseService';
import type { Message, ToolCall, GoogleUser } from './types';
import { ConnectionStatus } from './types';
import { DEFAULT_BACKEND_URL, DEFAULT_APP_NAME } from './constants';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  
  // Load user from local storage on mount to persist login state, checking for expiration
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem('google_user');
      if (saved) {
        const user = JSON.parse(saved);
        // Check if session is expired (if exp field exists)
        // Date.now() is ms, exp is seconds
        if (user.exp && Date.now() >= user.exp * 1000) {
           console.debug("Stored Google session expired");
           localStorage.removeItem('google_user');
           return null;
        }
        return user;
      }
      return null;
    } catch (e) {
      console.error("Failed to load google user from storage", e);
      return null;
    }
  });

  // Initialize userId from googleUser if available, otherwise generic ID (though generic ID is less relevant now with forced login)
  const [userId, setUserId] = useState(() => {
    return googleUser ? googleUser.email : `user_${Date.now()}`;
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync Google User to LocalStorage and update UserId
  useEffect(() => {
    if (googleUser) {
      localStorage.setItem('google_user', JSON.stringify(googleUser));
      setUserId(googleUser.email);
    } else {
      localStorage.removeItem('google_user');
      // If we just logged out (googleUser became null), set a new anonymous userId to be safe
      setUserId(`user_${Date.now()}`);
    }
  }, [googleUser]);

  // When userId changes (login or logout), disconnect any existing session
  useEffect(() => {
    if (sessionId) {
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setSessionId(null);
      setMessages([]);
      setToolCalls([]);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [userId]);

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
            setToolCalls(prev => [...prev, { id: uuidv4(), functionName: event.functionName, args: event.args }]);
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
  
  const handleClearChat = () => {
    setMessages([]);
    setToolCalls([]);
  }

  // --- Render Logic ---

  if (!googleUser) {
    return <LoginPage onLoginSuccess={setGoogleUser} />;
  }

  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen flex font-sans">
      <Sidebar
        backendUrl={backendUrl}
        setBackendUrl={setBackendUrl}
        appName={appName}
        setAppName={setAppName}
        userId={userId}
        setUserId={setUserId}
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onClear={handleClearChat}
        sessionId={sessionId}
        googleUser={googleUser}
        setGoogleUser={setGoogleUser}
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