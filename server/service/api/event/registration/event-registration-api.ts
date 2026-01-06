import { REGISTER_STUDENT_ON_EVENT_ENDPOINT } from "@/server/constants/endpoints";
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";

/**
 * Registers a student for an event.
 * Backend will verify location using the event's registration location.
 *
 * @param eventId - The event to register for
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @param faceImageBase64 - Optional base64 face image for facial verification
 * @returns Registration result with success status and message
 */
export async function eventRegistrationAPIService(eventId: string, latitude: number, longitude: number, faceImageBase64?: string) {
    try {
        const body: any = {
            eventId,
            latitude,
            longitude,
        };

        if (faceImageBase64 && faceImageBase64.trim() !== "") {
            body.faceImageBase64 = faceImageBase64;
        }

        const response = await userAuthenticatedContextFetch(REGISTER_STUDENT_ON_EVENT_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                message: errorData.message || "Registration failed",
            };
        }

        const data = await response.json();
        return {
            success: true,
            message: data.message || "Registration successful",
            data,
        };
    } catch (error: any) {
        console.error("Event registration error:", error);
        return {
            success: false,
            message: error.message || "An error occurred during registration",
        };
    }
}
