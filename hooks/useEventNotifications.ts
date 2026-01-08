import { useEffect, useRef, useState } from "react";
import { subscribeToEvents } from "@/server/service/api/homepage/subscribe-events";
import { Event } from "@/domain/interface/event/session/event.session";
import { EventStatus } from "@/domain/enums/event/status/event.status.enum";
import * as Notifications from "expo-notifications";

interface NotificationState {
  lastNotifiedEvents: Set<string>;
  previousEvents: Event[];
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// TODO: IMPLEMENTATION
export function useEventNotifications() {
  const [events, setEvents] = useState<Event[]>([]);
  const notificationState = useRef<NotificationState>({
    lastNotifiedEvents: new Set(),
    previousEvents: [],
  });

  useEffect(() => {
    async function requestPermissions() {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permissions not granted");
        return false;
      }

      return true;
    }

    requestPermissions();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initWebSocket() {
      unsubscribe = await subscribeToEvents((newEvents) => {
        setEvents(newEvents);
        checkForNewEvents(newEvents);
      });
    }

    initWebSocket();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const checkForNewEvents = async (currentEvents: Event[]) => {
    const { previousEvents, lastNotifiedEvents } = notificationState.current;

    if (previousEvents.length === 0) {
      notificationState.current.previousEvents = currentEvents;
      return;
    }

    const previousEventIds = new Set(previousEvents.map((e) => e.eventId));

    const newEvents = currentEvents.filter(
      (event) =>
        !previousEventIds.has(event.eventId) &&
        !lastNotifiedEvents.has(event.eventId),
    );

    const statusChangedEvents = currentEvents.filter((event) => {
      const prevEvent = previousEvents.find((e) => e.eventId === event.eventId);

      if (!prevEvent) return false;

      const statusChanged =
        (event.eventStatus === EventStatus.ONGOING &&
          prevEvent.eventStatus !== EventStatus.ONGOING) ||
        (event.eventStatus === EventStatus.REGISTRATION &&
          prevEvent.eventStatus !== EventStatus.REGISTRATION);

      const notAlreadyNotified = !lastNotifiedEvents.has(
        `${event.eventId}-${event.eventStatus}`,
      );

      return statusChanged && notAlreadyNotified;
    });

    for (const event of newEvents) {
      await sendEventNotification(event, "new");
      lastNotifiedEvents.add(event.eventId);
    }

    for (const event of statusChangedEvents) {
      await sendEventNotification(event, "status_change");
      lastNotifiedEvents.add(`${event.eventId}-${event.eventStatus}`);
    }

    notificationState.current.previousEvents = currentEvents;
  };

  const sendEventNotification = async (
    event: Event,
    type: "new" | "status_change",
  ) => {
    try {
      const notificationContent = getNotificationContent(event, type);

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null,
      });

      console.log(`Notification sent for event: ${event.eventName} (${type})`);
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  return { events };
}

function getNotificationContent(event: Event, type: "new" | "status_change") {
  const baseContent = {
    data: {
      eventId: event.eventId,
      registrationLocationId: event.registrationLocationId || "",
      venueLocationId: event.venueLocationId || "",
      eventStatus: event.eventStatus,
      type,
    },
  };

  if (type === "new") {
    return {
      ...baseContent,
      title: "New Event Available!",
      body: `${event.eventName} has been scheduled. Tap to view details.`,
      sound: true,
    };
  }

  switch (event.eventStatus) {
    case EventStatus.ONGOING:
      return {
        ...baseContent,
        title: "Event Started!",
        body: `${event.eventName} is now ongoing. Register now!`,
        sound: true,
      };

    case EventStatus.REGISTRATION:
      return {
        ...baseContent,
        title: "Registration Open!",
        body: `Registration for ${event.eventName} is now open.`,
        sound: true,
      };

    case EventStatus.UPCOMING:
      return {
        ...baseContent,
        title: "Event Coming Soon",
        body: `${event.eventName} is coming up soon.`,
        sound: false,
      };

    default:
      return {
        ...baseContent,
        title: "Event Update",
        body: `${event.eventName} status changed to ${event.eventStatus}`,
        sound: false,
      };
  }
}
export function useNotificationResponse() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { eventId } = response.notification.request.content.data as {
          eventId?: string;
        };

        if (eventId) {
          console.log("User tapped notification for event:", eventId);
        }
      },
    );

    return () => subscription.remove();
  }, []);
}
