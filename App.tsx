import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { LoginPage } from './components/LoginPage';
import { createSession, streamQuery } from './services/sseService';
import type { Message, ToolCall, GoogleUser, ChatSession } from './types';
import { ConnectionStatus } from './types';
import { DEFAULT_BACKEND_URL, DEFAULT_APP_NAME } from './constants';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  
  // -- Auth State --
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem('google_user');
      if (saved) {
        const user = JSON.parse(saved);
        if (user.exp && Date.now() >= user.exp * 1000) {
           localStorage.removeItem('google_user');
           return null;
        }
        return user;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [userId, setUserId] = useState(() => googleUser ? googleUser.email : `user_${Date.now()}`);

  // -- Session State --
  // We store all sessions metadata here
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Messages map: sessionId -> Message[]
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  // Current view derived state
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.CONNECTED);
  const abortControllerRef = useRef<AbortController | null>(null);

  // -- Persistence --

  // Save user
  useEffect(() => {
    if (googleUser) {
      localStorage.setItem('google_user', JSON.stringify(googleUser));
      setUserId(googleUser.email);
    } else {
      localStorage.removeItem('google_user');
      setUserId(`user_${Date.now()}`);
    }
  }, [googleUser]);

  // Load History on Mount
  useEffect(() => {
    if (userId) {
        try {
            const historyStr = localStorage.getItem(`chat_history_${userId}`);
            if (historyStr) {
                const history = JSON.parse(historyStr);
                setSessions(history.sessions || []);
                setAllMessages(history.messages || {});
            } else {
                setSessions([]);
                setAllMessages({});
            }
        } catch(e) {
            console.error("Failed to load history", e);
        }
    }
  }, [userId]);

  // Save History on Update
  useEffect(() => {
      if (userId) {
          const history = {
              sessions,
              messages: allMessages
          };
          localStorage.setItem(`chat_history_${userId}`, JSON.stringify(history));
      }
  }, [sessions, allMessages, userId]);

  // Update current messages view when switching session
  useEffect(() => {
      if (currentSessionId && allMessages[currentSessionId]) {
          setMessages(allMessages[currentSessionId]);
      } else {
          setMessages([]);
      }
      setToolCalls([]); // Clear tool calls when switching (or store them too if needed, simplified for now)
  }, [currentSessionId, allMessages]);

  
  // -- Handlers --

  const handleNewChat = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setCurrentSessionId(null);
      setMessages([]);
      setToolCalls([]);
  };

  const handleSelectSession = (id: string) => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      setCurrentSessionId(id);
      setConnectionStatus(ConnectionStatus.CONNECTED);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      
      const newAllMessages = { ...allMessages };
      delete newAllMessages[id];
      setAllMessages(newAllMessages);

      if (currentSessionId === id) {
          handleNewChat();
      }
  };

  const handleSendMessage = useCallback(async (prompt: string, files: File[] = []) => {
    let activeSessionId = currentSessionId;
    let isNewSession = false;

    // 1. Initialize Session if needed
    if (!activeSessionId) {
        setConnectionStatus(ConnectionStatus.CONNECTING);
        try {
            activeSessionId = await createSession(backendUrl, appName, userId);
            isNewSession = true;
            setCurrentSessionId(activeSessionId);
        } catch (error) {
            console.error("Failed to create session", error);
            alert("Could not start a new conversation. Check backend URL.");
            setConnectionStatus(ConnectionStatus.CONNECTED); // Reset
            return;
        }
    }

    // 2. Optimistic UI Update
    // Process files as placeholder (append to text)
    let fullContent = prompt;
    if (files.length > 0) {
        const fileInfo = files.map(f => `[Attachment: ${f.name}]`).join('\n');
        fullContent = prompt ? `${prompt}\n\n${fileInfo}` : fileInfo;
    }

    const userMessage: Message = { id: uuidv4(), role: 'user', content: fullContent };
    const assistantMessage: Message = { id: uuidv4(), role: 'assistant', content: '' };
    
    // Update local state helpers
    const updateMessagesForSession = (sid: string, newMsgs: Message[]) => {
        setAllMessages(prev => ({
            ...prev,
            [sid]: newMsgs
        }));
    };

    const currentMsgs = allMessages[activeSessionId!] || [];
    const updatedMsgs = [...currentMsgs, userMessage, assistantMessage];
    updateMessagesForSession(activeSessionId!, updatedMsgs);

    // 3. Create Session Entry in Sidebar if new
    if (isNewSession) {
        const titleSource = prompt || "New Chat";
        const newSession: ChatSession = {
            id: activeSessionId!,
            title: titleSource.length > 30 ? titleSource.substring(0, 30) + '...' : titleSource,
            createdAt: Date.now(),
            messageCount: 1
        };
        setSessions(prev => [newSession, ...prev]);
    }

    setConnectionStatus(ConnectionStatus.STREAMING);
    setToolCalls([]);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      await streamQuery(
        { backendUrl, appName, userId, sessionId: activeSessionId!, message: fullContent },
        (event) => {
          if (event.type === 'text_chunk') {
            setAllMessages(prevAll => {
                const sessionMsgs = prevAll[activeSessionId!] || [];
                const lastMsg = sessionMsgs[sessionMsgs.length - 1];
                if (lastMsg && lastMsg.id === assistantMessage.id) {
                    const updatedLastMsg = { ...lastMsg, content: lastMsg.content + event.content };
                    const newSessionMsgs = [...sessionMsgs.slice(0, -1), updatedLastMsg];
                    return { ...prevAll, [activeSessionId!]: newSessionMsgs };
                }
                return prevAll;
            });
          } else if (event.type === 'tool_call') {
            setToolCalls(prev => [...prev, { id: uuidv4(), functionName: event.functionName, args: event.args }]);
          } else if (event.type === 'error') {
             setAllMessages(prevAll => {
                const sessionMsgs = prevAll[activeSessionId!] || [];
                const lastMsg = sessionMsgs[sessionMsgs.length - 1];
                if (lastMsg) {
                    const updatedLastMsg = { ...lastMsg, content: lastMsg.content + `\n\n**Error:** ${event.content}` };
                    return { ...prevAll, [activeSessionId!]: [...sessionMsgs.slice(0, -1), updatedLastMsg] };
                }
                return prevAll;
             });
          }
        },
        signal
      );
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
         // Handle stream error
         setAllMessages(prevAll => {
            const sessionMsgs = prevAll[activeSessionId!] || [];
            const lastMsg = sessionMsgs[sessionMsgs.length - 1];
             if (lastMsg) {
                const updatedLastMsg = { ...lastMsg, content: lastMsg.content + `\n\n**Connection Error:** ${error.message}` };
                return { ...prevAll, [activeSessionId!]: [...sessionMsgs.slice(0, -1), updatedLastMsg] };
            }
            return prevAll;
         });
      }
    } finally {
      setConnectionStatus(ConnectionStatus.CONNECTED);
      abortControllerRef.current = null;
    }
  }, [backendUrl, appName, userId, currentSessionId, allMessages]);

  if (!googleUser) {
    return <LoginPage onLoginSuccess={setGoogleUser} />;
  }

  return (
    <div className="flex h-screen font-sans bg-white overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        backendUrl={backendUrl}
        setBackendUrl={setBackendUrl}
        appName={appName}
        setAppName={setAppName}
        userId={userId}
        googleUser={googleUser}
        setGoogleUser={setGoogleUser}
      />
      <main className="flex-1 flex flex-col h-full relative">
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