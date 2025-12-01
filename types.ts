
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

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string; // Google's unique ID for the user
  exp?: number; // Token expiration timestamp (seconds)
}
