import { subscribeEventStatusCheck } from "@/server/service/api/event/status/subscribe-event-status-check";
import { EventStatusCheckResponse } from "@/domain/interface/event/status/event.status.check.response";

export async function useEventStatusCheck(eventId: string): Promise<{
    success: boolean;
    data?: EventStatusCheckResponse;
    message?: string;
}> {
    return new Promise((resolve) => {
        let subscription: any = null;

        subscribeEventStatusCheck(eventId, (state) => {
            resolve({
                success: true,
                data: state,
                message: "Event status fetched successfully",
            });

            subscription?.unsubscribe();
        })
            .then((sub) => {
                subscription = sub;
            })
            .catch((error) => {
                console.error("WebSocket subscription failed", error);
                resolve({
                    success: false,
                    message: error.message || "Failed to fetch event status",
                });
            });
    });
}
