
import { v4 as uuidv4 } from 'uuid';

interface StreamQueryConfig {
  backendUrl: string;
  appName: string;
  userId: string;
  sessionId: string;
  message: string;
}

type SseEvent = 
  | { type: 'text_chunk'; content: string }
  | { type: 'tool_call'; functionName: string; args: Record<string, any> }
  | { type: 'final'; content: string }
  | { type: 'error'; content: string };


export const createSession = async (backendUrl: string, appName: string, userId: string): Promise<string> => {
  const sessionId = uuidv4();
  const url = `${backendUrl}/apps/${appName}/users/${userId}/sessions`;
  
  const payload = {
    session_id: sessionId,
    state: {},
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 409) { // 409 Conflict means session already exists, which is fine
      return sessionId;
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to create session: ${response.status} ${errorText}`);
    }
  } catch (error) {
    throw new Error(`Network or other error creating session: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const streamQuery = async (
  config: StreamQueryConfig,
  onEvent: (event: SseEvent) => void,
  signal: AbortSignal
): Promise<void> => {
  const { backendUrl, appName, userId, sessionId, message } = config;
  const url = `${backendUrl}/run_sse`;

  const payload = {
    app_name: appName,
    user_id: userId,
    session_id: sessionId,
    new_message: {
      role: "user",
      parts: [{ "text": message }],
    },
    streaming: true,
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const seenToolCalls = new Set<string>();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last partial line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6);
          try {
            const eventData = JSON.parse(dataStr);
            
            if (eventData.content?.role === 'model' && Array.isArray(eventData.content.parts)) {
              const parts = eventData.content.parts;
              
              // Handle text parts as pure stream deltas
              const textContent = parts
                .filter((p: any) => p && typeof p.text === 'string')
                .map((p: any) => p.text)
                .join('');
              
              if (textContent) {
                onEvent({ type: 'text_chunk', content: textContent });
              }

              // Handle tool calls
              for (const part of parts) {
                if (part && part.function_call) {
                  const func = part.function_call;
                  const toolCallKey = JSON.stringify({ name: func.name, args: func.args });
                  if (!seenToolCalls.has(toolCallKey)) {
                      seenToolCalls.add(toolCallKey);
                      onEvent({
                        type: 'tool_call',
                        functionName: func.name,
                        args: func.args ?? {},
                      });
                  }
                }
              }
            } else if (eventData.error) {
                onEvent({ type: 'error', content: String(eventData.error) });
            }

          } catch (e) {
            console.warn('Failed to parse SSE data:', dataStr, e);
            // Handle malformed JSON that looks like an error
            if (typeof dataStr === 'string' && dataStr.includes('"error"')) {
                onEvent({ type: 'error', content: `Received error from server: ${dataStr}`});
            }
          }
        }
      }
    }

  } catch (error) {
     if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error during SSE stream:', error);
        onEvent({ type: 'error', content: error.message });
     }
  }
};
