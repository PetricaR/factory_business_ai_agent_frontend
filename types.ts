
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  id: string;
  function: string;
  content: string;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  STREAMING = 'STREAMING',
}
