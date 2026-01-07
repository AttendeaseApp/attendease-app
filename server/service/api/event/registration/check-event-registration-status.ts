import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";

export interface RegistrationStatusResponse {
    isRegistered: boolean;
    attendanceStatus?: string;
    registrationTime?: string;
    attendanceRecordId?: string;
    registrationLocationName?: string;
    message: string;
    academicYearName?: string;
    semester?: number;
}

export async function checkEventRegistrationStatus(eventId: string): Promise<RegistrationStatusResponse> {
    try {
        const response = await userAuthenticatedContextFetch(`/api/student/event/registration/status/${eventId}`, { method: "GET" });

        if (!response.ok) {
            throw new Error("Failed to check registration status");
        }

        return await response.json();
    } catch (error: any) {
        console.error("Registration status check error:", error);
        throw error;
    }
}
