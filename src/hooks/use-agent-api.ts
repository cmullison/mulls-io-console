import { useCallback, useRef, useState } from "react";

type AgentStatus = {
  isRunning: boolean;
  output: string;
};

type AgentResponse = {
  success: boolean;
  result: unknown;
  messages: string[];
  error?: string;
};

type UseAgentApiProps = {
  agent: string;
  onMessage?: (data: { type: string; status?: AgentStatus; toast?: { message: string; type: string } }) => void;
};

export function useAgentApi({ agent, onMessage }: UseAgentApiProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<AgentStatus>({ isRunning: false, output: "" });
  const abortControllerRef = useRef<AbortController | null>(null);

  const send = useCallback(async (message: string) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === "run") {
        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        // Set running state
        const runningStatus = { isRunning: true, output: "" };
        setStatus(runningStatus);
        onMessage?.({ type: "status", status: runningStatus });
        
        try {
          const response = await fetch(`/api/agents/${agent}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            signal: abortControllerRef.current.signal,
          });

          const result: AgentResponse = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || "Request failed");
          }

          // Send toast messages
          result.messages?.forEach((message) => {
            onMessage?.({
              type: "toast",
              toast: { message, type: "info" }
            });
          });

          // Set final status
          const finalStatus = { 
            isRunning: false, 
            output: JSON.stringify(result.result, null, 2) 
          };
          setStatus(finalStatus);
          onMessage?.({ type: "status", status: finalStatus });

        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            // Request was cancelled
            const cancelledStatus = { isRunning: false, output: status.output };
            setStatus(cancelledStatus);
            onMessage?.({ type: "status", status: cancelledStatus });
            return;
          }
          
          // Handle other errors
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          onMessage?.({
            type: "toast",
            toast: { message: `Error: ${errorMessage}`, type: "error" }
          });
          
          const errorStatus = { 
            isRunning: false, 
            output: JSON.stringify({ error: errorMessage }, null, 2) 
          };
          setStatus(errorStatus);
          onMessage?.({ type: "status", status: errorStatus });
        }
      } else if (data.type === "stop") {
        // Cancel the current request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        const stoppedStatus = { isRunning: false, output: status.output };
        setStatus(stoppedStatus);
        onMessage?.({ type: "status", status: stoppedStatus });
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  }, [agent, onMessage, status.output]);

  // Simulate connection for compatibility
  const connect = useCallback(() => {
    setIsConnected(true);
    // Send initial status
    onMessage?.({ type: "status", status });
  }, [onMessage, status]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    send,
    connect,
    disconnect,
    isConnected,
    status,
  };
}