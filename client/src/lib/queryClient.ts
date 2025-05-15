import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Progress update types for WebSocket communication
export interface ProgressUpdate {
  stage: string;
  message: string;
  progress: number; // 0-100
  detail: string;
  applicationId?: number;
}

// WebSocket connection manager for real-time progress updates
export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private socket: WebSocket | null = null;
  private callbacks: Map<number, (update: ProgressUpdate) => void> = new Map();
  private connectionPromise: Promise<WebSocket> | null = null;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }
  
  public async getConnection(): Promise<WebSocket> {
    // Return existing connection promise if connection is in progress
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    // Return existing socket if already connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }
    
    // Create a new connection
    this.connectionPromise = new Promise<WebSocket>((resolve, reject) => {
      try {
        console.log("WebSocket connecting...");
        // Determine correct protocol
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        // Create new WebSocket connection
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log("WebSocket connected successfully");
          this.socket = socket;
          this.connectionPromise = null;
          resolve(socket);
        };
        
        socket.onclose = (event) => {
          console.log("WebSocket connection closed", event.code, event.reason);
          this.socket = null;
          this.connectionPromise = null;
          
          // Attempt to reconnect after a short delay if not closed cleanly
          if (!event.wasClean) {
            console.log("Connection closed unexpectedly, will try to reconnect in 3 seconds...");
            setTimeout(() => {
              console.log("Attempting WebSocket reconnection...");
              this.getConnection().catch(err => {
                console.error("Reconnection attempt failed:", err);
              });
            }, 3000);
          }
        };
        
        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.socket = null;
          this.connectionPromise = null;
          
          // Don't reject the promise as it can cause unhandled rejections
          // Instead, resolve with null to indicate error but prevent crashes
          resolve(null as any);
        };
        
        socket.onmessage = (event) => {
          try {
            console.log("WebSocket message received:", event.data);
            const data = JSON.parse(event.data) as ProgressUpdate;
            
            // Route to appropriate callback if applicationId is present
            if (data.applicationId && this.callbacks.has(data.applicationId)) {
              console.log(`Progress update for app #${data.applicationId}: ${data.stage} (${data.progress}%)`);
              const callback = this.callbacks.get(data.applicationId);
              if (callback) {
                callback(data);
              }
            } else {
              // Log when we get a message that doesn't match any registered callback
              console.log("No callback found for message:", data);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
        this.connectionPromise = null;
        reject(error);
      }
    });
    
    return this.connectionPromise;
  }
  
  public registerCallback(applicationId: number, callback: (update: ProgressUpdate) => void): () => void {
    this.callbacks.set(applicationId, callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(applicationId);
    };
  }
  
  public close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
