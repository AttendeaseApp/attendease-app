import { useEffect, useState, useCallback } from "react"
import { EventRegistrationServiceHandler } from "@/service/handler/event/EventRegistrationServiceHandler"
import { getCurrentLocationPositioningService } from "@/utils/geolocation/geolocation-utility"

/**
 * Manages event registration and location.
 * Tracking is now handled by AttendanceTrackingContext.
 * Supports optional facial verification based on event config.
 *
 * @param eventId - The event being registered
 */
export function useEventRegistration(eventId: string) {
     const [latitude, setLatitude] = useState<number | null>(null)
     const [longitude, setLongitude] = useState<number | null>(null)
     const [loading, setLoading] = useState(false)
     const [locationLoading, setLocationLoading] = useState(true)

     useEffect(() => {
          getCurrentLocationPositioningService(setLocationLoading, setLatitude, setLongitude)
     }, [])

     const register = useCallback(
          (faceImageUri: string | null | undefined, onSuccess?: () => void) => {
               EventRegistrationServiceHandler({
                    eventId,
                    latitude,
                    longitude,
                    faceImageUri: faceImageUri || null,
                    setLoading,
                    onSuccess: onSuccess || (() => {}),
               })
          },
          [eventId, latitude, longitude]
     )

     return {
          latitude,
          longitude,
          loading,
          locationLoading,
          register,
     }
}
