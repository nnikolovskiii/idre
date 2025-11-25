import { API_CONFIG } from './api';

export interface WhiteboardSSEEvent {
    event: 'whiteboard_generation_complete' | 'whiteboard_generation_error';
    data: {
        whiteboard_id: string;
        node_id: string;
        node_type?: string;
        generated_content?: string;
        status: 'completed' | 'error';
        run_id: string;
        error?: string;
    };
}

export class WhiteboardSSEService {
    private eventSources: Map<string, EventSource> = new Map();

    /**
     * Subscribe to SSE events for a specific whiteboard
     * Uses whiteboard-based Redis channel instead of thread-based
     */
    subscribe(whiteboardId: string, onEvent: (event: WhiteboardSSEEvent) => void): () => void {
        // Close any existing connection for this whiteboard
        this.unsubscribe(whiteboardId);

        // --- FIX: Use API_CONFIG to get the correct URL and Port (8001) ---
        const apiUrl = API_CONFIG.getApiUrl();
        const url = `${apiUrl}/whiteboards/whiteboard/${whiteboardId}/sse`;

        console.log(`Connecting to whiteboard SSE for ${whiteboardId}:`, url);

        const eventSource = new EventSource(url, { withCredentials: true });

        this.eventSources.set(whiteboardId, eventSource);

        eventSource.onopen = () => {
            console.log(`Whiteboard SSE connection opened for ${whiteboardId}`);
        };

        eventSource.onmessage = (event) => {
            // Keep alive messages or initial connection messages might not be JSON
            if (event.data.includes("connected")) {
                console.log("SSE Connected message received");
                return;
            }

            try {
                const data = JSON.parse(event.data);
                console.log(`Whiteboard SSE message received for ${whiteboardId}:`, data);

                // Handle SSE events that match our interface
                if (data.event && ['whiteboard_generation_complete', 'whiteboard_generation_error'].includes(data.event)) {
                    onEvent(data as WhiteboardSSEEvent);
                }
            } catch (err) {
                console.error('Error parsing whiteboard SSE message:', err, event.data);
            }
        };

        eventSource.onerror = (error) => {
            console.error(`Whiteboard SSE connection error for ${whiteboardId}:`, error);
            // Don't close immediately on error, EventSource attempts auto-reconnect.
            // Only close if it's a fatal error or authentication failure (readyState 2 = CLOSED)
            if (eventSource.readyState === 2) {
                console.log("SSE Connection closed");
                this.eventSources.delete(whiteboardId);
            }
        };

        // Return unsubscribe function
        return () => {
            this.unsubscribe(whiteboardId);
        };
    }

    /**
     * Unsubscribe from SSE events for a specific whiteboard
     */
    unsubscribe(whiteboardId: string) {
        const eventSource = this.eventSources.get(whiteboardId);
        if (eventSource) {
            eventSource.close();
            this.eventSources.delete(whiteboardId);
            console.log('SSE connection closed for whiteboard:', whiteboardId);
        }
    }

    /**
     * Unsubscribe from all SSE events
     */
    unsubscribeAll() {
        this.eventSources.forEach((eventSource) => {
            eventSource.close();
        });
        this.eventSources.clear();
        console.log('All SSE connections closed');
    }
}

// Export singleton instance
export const whiteboardSSEService = new WhiteboardSSEService();