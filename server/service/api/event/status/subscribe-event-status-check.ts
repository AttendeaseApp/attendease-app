import { IMessage } from "@stomp/stompjs";
import { stompConnect } from "@/server/utils/user-authenticated-context-ws";
import { EventStatusCheckResponse } from "@/domain/interface/event/status/event.status.check.response";

/**
 * Subscribe to a specific event's state updates
 */
export async function subscribeEventStatusCheck(
  eventId: string,
  callback: (state: EventStatusCheckResponse) => void,
) {
  const wsClient = await stompConnect();

  const subscription = wsClient.subscribe(
    "/topic/read-event-state",
    (message: IMessage) => {
      try {
        const body = JSON.parse(message.body) as EventStatusCheckResponse;
        if (body.eventId === eventId) {
          callback(body);
        }
      } catch (err) {
        console.error("Failed to parse STOMP message", err);
      }
    },
  );

  wsClient.publish({
    destination: `/app/observe-event-state/${eventId}`,
    body: "{}",
  });

  return subscription;
}
