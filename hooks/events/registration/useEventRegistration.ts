import { useEffect, useState, useCallback } from "react";
import { EventRegistrationServiceHandler } from "@/service/handler/event/EventRegistrationServiceHandler";
import { getCurrentLocationPositioningService } from "@/utils/geolocation/geolocation-utility";

/**
 * Manages event registration and location.
 * Tracking is now handled by AttendanceTrackingContext.
 * Supports optional facial verification based on event config.
 *
 * @param eventId - The event being registered
 */
export function useEventRegistration(eventId: string) {
    // ← Removed locationId
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(true);

    useEffect(() => {
        getCurrentLocationPositioningService(setLocationLoading, setLatitude, setLongitude);
    }, []);

    const register = useCallback(
        (faceImageBase64: string | null | undefined, onSuccess?: () => void) => {
            EventRegistrationServiceHandler({
                eventId,
                latitude,
                longitude,
                faceImageBase64: faceImageBase64 || "",
                setLoading,
                onSuccess: onSuccess || (() => {}),
            });
        },
        [eventId, latitude, longitude],
    );

    return {
        latitude,
        longitude,
        loading,
        locationLoading,
        register,
    };
}
