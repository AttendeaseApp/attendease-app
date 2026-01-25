import { useState, useEffect } from "react"
import { verifyRegistrationLocation } from "@/server/service/api/geolocation/verify-registration-location"

interface LocationStatus {
     isInside: boolean
     message: string
}

export function useLocationVerification(
     eventId: string,
     latitude: number | null,
     longitude: number | null
) {
     const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null)
     const [verifyingLocation, setVerifyingLocation] = useState(false)

     useEffect(() => {
          async function verifyLocation() {
               if (latitude === null || longitude === null || !eventId) return

               try {
                    setVerifyingLocation(true)
                    const response = await verifyRegistrationLocation(eventId, latitude, longitude)
                    setLocationStatus({
                         isInside: response.inside,
                         message: response.message,
                    })
               } catch (error) {
                    console.error("Failed to verify registration location:", error)
                    setLocationStatus({
                         isInside: false,
                         message: "Unable to verify location. Please try again.",
                    })
               } finally {
                    setVerifyingLocation(false)
               }
          }

          verifyLocation()
     }, [eventId, latitude, longitude])

     return {
          locationStatus,
          verifyingLocation,
          setLocationStatus,
     }
}
