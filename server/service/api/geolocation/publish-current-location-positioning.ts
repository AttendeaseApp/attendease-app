import { stompConnect } from "@/server/utils/user-authenticated-context-ws";

/**
 * Sends the current location to backend WebSocket controller
 */
export async function publishCurrentLocationPositioning(locationId: string, latitude: number, longitude: number) {
    const client = await stompConnect();

    client.publish({
        destination: "/app/observe-current-location",
        body: JSON.stringify({
            locationId,
            latitude,
            longitude,
        }),
    });
}
