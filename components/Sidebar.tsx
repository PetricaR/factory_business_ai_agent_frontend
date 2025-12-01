import React, { useState } from 'react';
import type { ConnectionStatus, GoogleUser } from '../types';
import { StatusIndicator } from './StatusIndicator';

interface SidebarProps {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  appName: string;
  setAppName: (name: string) => void;
  userId: string;
  setUserId: (id: string) => void;
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  onClear: () => void;
  sessionId: string | null;
  googleUser: GoogleUser | null;
  setGoogleUser: (user: GoogleUser | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  backendUrl,
  setBackendUrl,
  appName,
  setAppName,
  userId,
  setUserId,
  connectionStatus,
  onConnect,
  onClear,
  sessionId,
  googleUser,
  setGoogleUser
}) => {
  const isConnected = connectionStatus === 'CONNECTED' || connectionStatus === 'STREAMING';
  const isConnecting = connectionStatus === 'CONNECTING';

  const handleSignOut = () => {
    if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.disableAutoSelect();
    }
    setGoogleUser(null);
  };

  return (
    <aside className="w-[400px] bg-white flex flex-col border-r border-gray-200 h-screen shadow-xl z-10 flex-shrink-0">
      <div className="flex-1 overflow-y-auto p-5">
        
        {/* User Profile Section */}
        <div className="mb-8">
           {googleUser && (
             <div className="animate-fade-in bg-gray-50 rounded-xl p-4 border border-gray-100 relative group">
                <div className="flex items-center space-x-3 mb-3">
                  {googleUser.picture ? (
                    <img src={googleUser.picture} alt={googleUser.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-bold text-xl">
                      {googleUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-900 text-sm truncate">{googleUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{googleUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded py-2 hover:bg-gray-50 hover:text-red-600 transition-colors"
                >
                  Sign Out
                </button>
             </div>
           )}
        </div>

        <div className="space-y-6">
             {/* Connection Info */}
            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Connection Settings</h3>
                <div className="space-y-3">
                  <Input label="Backend URL" value={backendUrl} onChange={setBackendUrl} disabled={isConnected} />
                  <Input label="App Name" value={appName} onChange={setAppName} disabled={isConnected} />
                  
                  {/* User ID is read-only */}
                  <div className="relative opacity-75">
                    <Input 
                        label="User ID" 
                        value={userId} 
                        onChange={setUserId} 
                        disabled={true} 
                    />
                    <div className="absolute right-2 top-7">
                         <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {googleUser ? 'Auto-linked' : 'Guest'}
                         </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                    <button
                        onClick={onConnect}
                        disabled={isConnecting || isConnected}
                        className={`w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center shadow-sm transition-all
                            ${isConnected 
                                ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isConnecting ? (
                        <Spinner />
                        ) : isConnected ? (
                        <>
                            <span className="mr-2 text-lg">✓</span> Connected
                        </>
                        ) : (
                        <>
                            Connect Session
                        </>
                        )}
                    </button>
                </div>
            </div>

            <hr className="border-gray-100" />
            
            <div>
               <StatusIndicator status={connectionStatus} sessionId={sessionId} />
            </div>

        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <ActionButton onClick={onClear} disabled={!isConnected} variant="secondary">
            <span className="mr-2">🗑️</span> Clear Conversation
        </ActionButton>
      </div>
    </aside>
  );
};

const Input: React.FC<{ label: string; value: string; onChange: (val: string) => void; disabled?: boolean }> = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:bg-gray-50 disabled:text-gray-500"
    />
  </div>
);

const ActionButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; variant?: 'primary' | 'secondary' }> = ({ onClick, disabled, children, variant = 'primary' }) => {
  const baseClasses = "w-full flex items-center justify-center font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm";
  const primaryClasses = "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700";
  const secondaryClasses = "bg-white border border-red-200 hover:bg-red-50 text-red-600";
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variant === 'primary' ? primaryClasses : secondaryClasses}`}>
      {children}
    </button>
  );
}

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);