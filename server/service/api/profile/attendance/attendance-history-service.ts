import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";
import { GET_ATTENDANCE_HISTORY_ENDPOINT } from "@/server/constants/endpoints";

/**
 * Fetches attendance history of the student.
 * It updates the provided state setters with the fetched data and loading state.
 *
 * @param setProfile
 * @param setLoading
 */
export async function getAllAttendanceHistory(
  setAttendanceHistories: React.Dispatch<React.SetStateAction<Event[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  try {
    const response = await userAuthenticatedContextFetch(
      GET_ATTENDANCE_HISTORY_ENDPOINT,
    );
    if (!response.ok) throw new Error("Failed to fetch Attendance History");
    const data = await response.json();
    setAttendanceHistories(data);
  } catch (error) {
    console.error("Error fetching profile:", error);
  } finally {
    setLoading(false);
  }
}
