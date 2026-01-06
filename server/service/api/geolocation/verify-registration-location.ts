import { IMessage } from "@stomp/stompjs";
import { stompConnect } from "@/server/utils/user-authenticated-context-ws";
import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response";

/**
 * Verifies if user is at the event's registration location
 */
export async function verifyRegistrationLocation(eventId: string, latitude: number, longitude: number, callback: (data: LocationTrackingResponse) => void) {
    if (latitude === null || longitude === null) {
        console.warn("Cannot verify location: coordinates are null");
        return { unsubscribe: () => {} };
    }

    const client = await stompConnect();

    const subscription = client.subscribe("/user/queue/registration-location-verification", (message: IMessage) => {
        try {
            const body = JSON.parse(message.body) as LocationTrackingResponse;
            callback(body);
            console.log("Registration location verified:", body);
        } catch (e) {
            console.error("Failed to parse registration location response:", e);
        }
    });

    client.publish({
        destination: "/app/verify-registration-location",
        body: JSON.stringify({ eventId, latitude, longitude }),
    });

    return subscription;
}
