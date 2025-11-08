
import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  sessionId: string | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, sessionId }) => {
  const getStatusInfo = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return { text: 'Connected (SSE)', color: 'bg-green-500', pulse: false };
      case ConnectionStatus.STREAMING:
        return { text: 'Streaming...', color: 'bg-blue-500', pulse: true };
      case ConnectionStatus.CONNECTING:
        return { text: 'Connecting...', color: 'bg-yellow-500', pulse: true };
      case ConnectionStatus.DISCONNECTED:
      default:
        return { text: 'Disconnected', color: 'bg-red-500', pulse: false };
    }
  };

  const { text, color, pulse } = getStatusInfo();

  return (
    <div>
      <div className="flex items-center">
        <span className={`h-3 w-3 rounded-full mr-2 ${color} ${pulse ? 'animate-pulse' : ''}`}></span>
        <span className="font-semibold">{text}</span>
      </div>
      {sessionId && (status === ConnectionStatus.CONNECTED || status === ConnectionStatus.STREAMING) && (
        <p className="text-xs text-gray-500 mt-1">Session: {sessionId.substring(0, 12)}...</p>
      )}
    </div>
  );
};
