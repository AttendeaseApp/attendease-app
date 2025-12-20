import { IMessage } from "@stomp/stompjs";
import { stompConnect } from "@/server/utils/user-authenticated-context-ws";

export interface LocationTrackingResponse {
    inside: boolean;
    message: string;
}

/**
 * Subscribes to /user/queue/location-tracking for personal responses
 */
export async function subscribeToLiveLocationVerificationResponse(callback: (data: LocationTrackingResponse) => void) {
    const client = await stompConnect();

    return client.subscribe("/user/queue/location-tracking", (message: IMessage) => {
        try {
            const body = JSON.parse(message.body) as LocationTrackingResponse;
            callback(body);
        } catch (e) {
            console.error("Failed to parse location WS message:", e);
        }
    });
}
