import { IMessage } from "@stomp/stompjs";
import { stompConnect } from "@/server/utils/user-authenticated-context-ws";
import { Event } from "@/domain/interface/event/session/event.session";

/**
 * Subscribe to ongoing homepage events.
 * Returns the unsubscribe function.
 */
export async function subscribeToEvents(callback: (events: Event[]) => void) {
    const wsClient = await stompConnect();
    const subscription = wsClient.subscribe("/topic/homepage-events", (message: IMessage) => {
        try {
            const events: Event[] = JSON.parse(message.body);
            callback(events);
        } catch (err) {
            console.error("Failed to parse homepage events:", err);
        }
    });
    console.log("[WebSocket] Subscribed to homepage events");

    wsClient.publish({
        destination: "/app/homepage-events",
        body: "{}",
    });

    return () => {
        console.log("[WebSocket] Unsubscribing homepage events");
        subscription.unsubscribe();
    };
}
