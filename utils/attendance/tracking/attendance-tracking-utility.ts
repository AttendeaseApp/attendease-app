import * as Location from "expo-location";
import { Alert } from "react-native";
import { attendanceTrackingService } from "@/server/service/api/attendance/tracking/attendance-tracking-service";
import { useEventStatusCheck } from "../../../hooks/events/status/useEventStatusCheck";

interface StartAttendanceTrackingParams {
    eventId: string;
    locationId: string;
    setIsTracking: (tracking: boolean) => void;
    setLatitude: (lat: number) => void;
    setLongitude: (lng: number) => void;
    setLastTrackingTime: (time: string) => void;
}

/**
 * Returns a function that starts automated attendance tracking with periodic location pings.
 * Only sends pings when the event status is ONGOING.
 *
 * This is NOT a React hook - it's a regular function that returns a setup function.
 *
 * @returns Function to start tracking that returns an interval ID
 */
export function useStartAttendanceTracking() {
    return ({ eventId, locationId, setIsTracking, setLatitude, setLongitude, setLastTrackingTime }: StartAttendanceTrackingParams): ReturnType<typeof setInterval> => {
        setIsTracking(true);

        const trackingInterval = setInterval(async () => {
            try {
                const statusResult = await useEventStatusCheck(eventId);

                if (!statusResult.success || !statusResult.data) {
                    console.log("Failed to fetch event status, skipping ping");
                    return;
                }

                const { eventIsOngoing, eventHasEnded, statusMessage } = statusResult.data;

                // If event has ended, don't ping
                if (eventHasEnded) {
                    console.log("Event has ended, skipping ping");
                    return;
                }

                // Only ping if event is ongoing
                if (!eventIsOngoing) {
                    console.log(`Event not ongoing (${statusMessage}), skipping ping`);
                    return;
                }

                // Event is ongoing, proceed with location ping
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Permission Denied", "Location permission is required for attendance tracking.");
                    return;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

                const { latitude, longitude } = location.coords;
                setLatitude(latitude);
                setLongitude(longitude);

                await attendanceTrackingService(eventId, locationId, latitude, longitude);

                const now = new Date();
                const timeString = now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });
                setLastTrackingTime(timeString);

                console.log("Attendance ping successful:", timeString);
            } catch (error: any) {
                console.error("Error during attendance tracking:", error.message || error);
            }
        }, 300000); // Every 5 minutes

        return trackingInterval;
    };
}
