import { IMessage } from "@stomp/stompjs";
import { stompConnect } from "@/server/utils/user-authenticated-context-ws";
import { Event } from "@/domain/interface/event/session/event.session";
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";
import { REST_EVENT_RETRIEVAL } from "@/server/constants/endpoints";

/**
 * Fetch initial events via HTTP
 */
async function fetchInitialEvents(): Promise<Event[]> {
    try {
        const response =
            await userAuthenticatedContextFetch(REST_EVENT_RETRIEVAL);
        if (!response.ok) {
            console.error("Failed to fetch events:", response.status);
            return [];
        }
        const events: Event[] = await response.json();
        return events;
    } catch (err) {
        console.error("Failed to fetch initial events:", err);
        return [];
    }
}

/**
 * Subscribe to ongoing homepage events.
 * Fetches initial data, then listens for real-time updates
 */
export async function subscribeToEvents(callback: (events: Event[]) => void) {
    console.log("[WebSocket] Fetching initial events...");
    const initialEvents = await fetchInitialEvents();
    callback(initialEvents);
    const wsClient = await stompConnect();
    const subscription = wsClient.subscribe(
        "/topic/homepage-events",
        (message: IMessage) => {
            try {
                const events: Event[] = JSON.parse(message.body);
                console.log(`[WebSocket] Received ${events.length} events`);
                callback(events);
            } catch (err) {
                console.error("Failed to parse homepage events:", err);
            }
        },
    );

    console.log(
        "[WebSocket] Subscribed to homepage events - waiting for broadcasts",
    );

    return () => {
        console.log("[WebSocket] Unsubscribing from homepage events");
        subscription.unsubscribe();
    };
}
