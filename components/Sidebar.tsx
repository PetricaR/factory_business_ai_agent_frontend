import React, { useState } from 'react';
import type { ConnectionStatus, GoogleUser, ChatSession } from '../types';
import { SettingsModal } from './SettingsModal';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  appName: string;
  setAppName: (name: string) => void;
  userId: string;
  googleUser: GoogleUser | null;
  setGoogleUser: (user: GoogleUser | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  backendUrl,
  setBackendUrl,
  appName,
  setAppName,
  userId,
  googleUser,
  setGoogleUser
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = () => {
    if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.disableAutoSelect();
    }
    setGoogleUser(null);
  };

  return (
    <>
      <aside className="w-[260px] bg-[#202123] flex flex-col h-screen text-white flex-shrink-0 relative transition-all duration-300">
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-3 py-3 border border-white/20 rounded-md hover:bg-[#2A2B32] transition-colors text-sm text-white"
          >
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New chat
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-2 p-3 pt-0">
            {sessions.length === 0 && (
                <div className="text-gray-500 text-xs text-center mt-10">No chat history</div>
            )}
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center gap-3 px-3 py-3 text-sm rounded-md transition-colors truncate break-all ${
                  currentSessionId === session.id ? 'bg-[#343541]' : 'hover:bg-[#2A2B32]'
                }`}
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-gray-400" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="flex-1 text-left truncate">{session.title}</span>
                
                {/* Delete Button (visible on hover) */}
                <div 
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white ${currentSessionId === session.id ? 'block' : 'hidden group-hover:block'}`}
                >
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </div>
                {/* Gradient fade for long text */}
                <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l ${currentSessionId === session.id ? 'from-[#343541]' : 'from-[#202123] group-hover:from-[#2A2B32]'} to-transparent pointer-events-none group-hover:w-16`}></div>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile / Footer */}
        <div className="border-t border-white/20 p-3 relative">
            {showUserMenu && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-[#050509] border border-white/20 rounded-md shadow-lg overflow-hidden z-20">
                    <button 
                        onClick={() => { setIsSettingsOpen(true); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#343541] flex items-center gap-2"
                    >
                         <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.82 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                         Settings
                    </button>
                    <div className="h-px bg-white/20 my-1"></div>
                    <button 
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#343541] flex items-center gap-2"
                    >
                         <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                         Log out
                    </button>
                </div>
            )}
            
            <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 w-full hover:bg-[#2A2B32] p-2 rounded-md transition-colors text-left"
            >
                {googleUser?.picture ? (
                    <img src={googleUser.picture} alt="" className="w-8 h-8 rounded-sm" />
                ) : (
                    <div className="w-8 h-8 rounded-sm bg-green-700 flex items-center justify-center text-white font-bold text-xs">
                        {googleUser?.name?.charAt(0) || 'U'}
                    </div>
                )}
                <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-semibold truncate text-white">{googleUser?.name || 'Guest User'}</div>
                </div>
                 <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
            </button>
        </div>
      </aside>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        backendUrl={backendUrl}
        setBackendUrl={setBackendUrl}
        appName={appName}
        setAppName={setAppName}
        userId={userId}
      />
    </>
  );
};
