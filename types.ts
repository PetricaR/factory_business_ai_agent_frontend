
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  id: string;
  functionName: string;
  args: Record<string, any>;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  STREAMING = 'STREAMING',
}