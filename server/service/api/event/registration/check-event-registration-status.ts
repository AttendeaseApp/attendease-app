import { CHECK_ATTENDANCE_STATUS } from "@/server/constants/endpoints";
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

export async function checkEventRegistrationStatus(
  eventId: string,
): Promise<RegistrationStatusResponse> {
  try {
    const response = await userAuthenticatedContextFetch(
      CHECK_ATTENDANCE_STATUS(eventId),
      { method: "GET" },
    );

    if (!response.ok) {
      throw new Error("Failed to check registration status");
    }

    return (await response.json()) as RegistrationStatusResponse;
  } catch (error) {
    console.error("Registration status check error:", error);
    throw error;
  }
}
