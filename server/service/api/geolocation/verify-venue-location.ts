import { IMessage } from "@stomp/stompjs";
import { stompConnect } from "@/server/utils/user-authenticated-context-ws";
import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response";

/**
 * Verifies if user is at the event's venue location (during event)
 */
export async function verifyVenueLocation(eventId: string, latitude: number, longitude: number, callback: (data: LocationTrackingResponse) => void) {
    const client = await stompConnect();

    const subscription = client.subscribe("/user/queue/venue-location-verification", (message: IMessage) => {
        try {
            const body = JSON.parse(message.body) as LocationTrackingResponse;
            callback(body);
            console.log("Venue location verified:", body);
        } catch (e) {
            console.error("Failed to parse venue location response:", e);
        }
    });

    client.publish({
        destination: "/app/verify-venue-location",
        body: JSON.stringify({ eventId, latitude, longitude }),
    });

    return subscription;
}
