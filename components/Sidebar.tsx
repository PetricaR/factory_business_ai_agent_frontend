import React from 'react';
import type { ConnectionStatus } from '../types';
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
  onQuickQuery: (query: string) => void;
  onClear: () => void;
  sessionId: string | null;
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
  onQuickQuery,
  onClear,
  sessionId,
}) => {
  const isConnected = connectionStatus === 'CONNECTED' || connectionStatus === 'STREAMING';
  const isConnecting = connectionStatus === 'CONNECTING';

  return (
    <aside className="w-80 bg-gray-950 p-4 flex flex-col border-r border-gray-700 h-screen overflow-y-auto">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-white mb-4">⚙️ Configuration</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">🎯 Backend</h3>
            <div className="space-y-3">
              <Input label="Backend URL" value={backendUrl} onChange={setBackendUrl} disabled={isConnected} />
              <Input label="App Name" value={appName} onChange={setAppName} disabled={isConnected} />
              <Input label="User ID" value={userId} onChange={setUserId} disabled={isConnected} />
            </div>
          </div>

          <button
            onClick={onConnect}
            disabled={isConnecting || isConnected}
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isConnecting ? (
               <Spinner />
            ) : (
              <>
                <PlugIcon className="h-5 w-5 mr-2" /> Connect
              </>
            )}
          </button>
        </div>

        <hr className="border-gray-700 my-6" />

        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-3">📊 Status</h3>
          <StatusIndicator status={connectionStatus} sessionId={sessionId} />
        </div>

        <hr className="border-gray-700 my-6" />
        
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-3">💡 Quick Actions</h3>
          <div className="space-y-2">
            <ActionButton onClick={() => onQuickQuery("Ce îmi poți spune despre SEFINNI din Buzau?")} disabled={!isConnected}>
              🏢 Analyze Company
            </ActionButton>
            <ActionButton onClick={() => onQuickQuery("Analizeaza CUI 35790107")} disabled={!isConnected}>
              💰 Financials
            </ActionButton>
            <ActionButton onClick={onClear} disabled={!isConnected} variant="secondary">
              🗑️ Clear Chat
            </ActionButton>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Input: React.FC<{ label: string; value: string; onChange: (val: string) => void; disabled?: boolean }> = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-700 disabled:text-gray-400"
    />
  </div>
);

const ActionButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; variant?: 'primary' | 'secondary' }> = ({ onClick, disabled, children, variant = 'primary' }) => {
  const baseClasses = "w-full text-left font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryClasses = "bg-gray-800 hover:bg-gray-700";
  const secondaryClasses = "bg-red-900/50 hover:bg-red-800/60";
  
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

const PlugIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M11.25 2.25a.75.75 0 00-1.5 0v3.085c0 .32.135.626.373.838l3.117 2.727a.75.75 0 001.03-1.092L12 6.132V2.25z" />
    <path fillRule="evenodd" d="M12.25 10.315a.75.75 0 00-1.03 1.092l1.69 1.478a.75.75 0 101.03-1.092l-1.69-1.478z" clipRule="evenodd" />
    <path d="M13 12.065a.75.75 0 00-1.03 1.092l.33.289a3.25 3.25 0 01-3.6 4.304 3.25 3.25 0 01-3.6-4.304l.33-.289a.75.75 0 00-1.03-1.092l-.33.289a4.75 4.75 0 005.215 6.277 4.75 4.75 0 005.215-6.277l-.33-.289z" />
    <path fillRule="evenodd" d="M7.75 10.315a.75.75 0 011.03 1.092L7.09 12.885a.75.75 0 01-1.03-1.092l1.69-1.478z" clipRule="evenodd" />
    <path d="M8.75 2.25a.75.75 0 011.5 0v3.085c0 .32-.135.626-.373.838L6.76 8.901a.75.75 0 01-1.03-1.092L8 6.132V2.25z" />
  </svg>
);