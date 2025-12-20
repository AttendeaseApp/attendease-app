import { IMessage } from "@stomp/stompjs";
import { stompConnect } from "@/server/utils/user-authenticated-context-ws";
import { Event } from "@/domain/interface/event/session/event.session";

export async function subscribeToEventById(eventId: string, callback: (event: Event) => void) {
    const wsClient = await stompConnect();

    const subscription = wsClient.subscribe(`/user/queue/events/${eventId}`, (message: IMessage) => {
        try {
            const body = JSON.parse(message.body) as Event;
            if (body.eventId === eventId) {
                callback(body);
            }
        } catch (err) {
            console.error("Failed to parse STOMP message", err);
        }
    });

    wsClient.publish({
        destination: `/app/events/${eventId}`,
        body: "{}",
    });

    return subscription;
}
