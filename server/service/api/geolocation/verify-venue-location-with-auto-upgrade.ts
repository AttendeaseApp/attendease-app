import { IMessage } from "@stomp/stompjs";
import { stompConnect } from "@/server/utils/user-authenticated-context-ws";
import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response";

export async function verifyVenueLocationWithAutoUpgrade(
  eventId: string,
  latitude: number,
  longitude: number,
  callback: (data: LocationTrackingResponse) => void,
) {
  const client = await stompConnect();

  const subscription = client.subscribe(
    "/user/queue/venue-location-auto-upgrade",
    (message: IMessage) => {
      try {
        const body = JSON.parse(message.body) as LocationTrackingResponse;
        callback(body);
      } catch (e) {
        console.error("Failed to parse venue auto-upgrade response:", e);
      }
    },
  );

  client.publish({
    destination: "/app/verify-venue-location-with-upgrade",
    body: JSON.stringify({ eventId, latitude, longitude }),
  });

  return subscription;
}
