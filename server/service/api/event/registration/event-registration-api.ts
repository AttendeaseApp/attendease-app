import { REGISTER_STUDENT_ON_EVENT_ENDPOINT } from "@/server/constants/endpoints";
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";

export async function eventRegistrationAPIService(eventId: string, locationId: string, latitude: number, longitude: number, faceImageBase64?: string) {
    try {
        const body: any = {
            eventId,
            locationId,
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
                message: errorData.message,
            };
        }

        const data = await response.json();
        return {
            success: true,
            message: data.message,
            data,
        };
    } catch (error: any) {
        console.error("error:", error);
        return {
            success: false,
            message: error.message,
        };
    }
}
