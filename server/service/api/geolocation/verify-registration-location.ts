import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response"
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch"
import {
     VERIFY_EVENT_REGISTRATION_LOCATION,
     VERIFY_EVENT_VENUE_LOCATION,
} from "@/server/constants/endpoints"

/**
 * Verifies if user is at the event's registration location
 */
export async function verifyRegistrationLocation(
     eventId: string,
     latitude: number,
     longitude: number
): Promise<LocationTrackingResponse> {
     if (latitude === null || longitude === null) {
          console.warn("Cannot verify location: coordinates are null")
          throw new Error("Invalid coordinates: latitude and longitude are required")
     }

     try {
          console.log("Sending registration location verification request:", {
               eventId,
               latitude,
               longitude,
          })

          const response = await userAuthenticatedContextFetch(VERIFY_EVENT_REGISTRATION_LOCATION, {
               method: "POST",
               body: JSON.stringify({ eventId, latitude, longitude }),
          })

          if (!response.ok) {
               const errorText = await response.text()
               console.error("Registration location verification failed:", errorText)
               throw new Error(`Registration location verification failed: ${response.status}`)
          }

          const data = (await response.json()) as LocationTrackingResponse
          console.log("Registration location response received:", data)
          return data
     } catch (error) {
          console.error("Error in verifyRegistrationLocation:", error)
          throw error
     }
}

/**
 * Verifies if user is at the event's venue location (for ongoing events)
 */
export async function verifyVenueLocation(
     eventId: string,
     latitude: number,
     longitude: number
): Promise<LocationTrackingResponse> {
     if (latitude === null || longitude === null) {
          console.warn("Cannot verify venue location: coordinates are null")
          throw new Error("Invalid coordinates: latitude and longitude are required")
     }

     try {
          console.log("Sending venue location verification request:", {
               eventId,
               latitude,
               longitude,
          })

          const response = await userAuthenticatedContextFetch(VERIFY_EVENT_VENUE_LOCATION, {
               method: "POST",
               body: JSON.stringify({ eventId, latitude, longitude }),
          })

          if (!response.ok) {
               const errorText = await response.text()
               console.error("Venue location verification failed:", errorText)
               throw new Error(`Venue location verification failed: ${response.status}`)
          }

          const data = (await response.json()) as LocationTrackingResponse
          console.log("Venue location response received:", data)
          return data
     } catch (error) {
          console.error("Error in verifyVenueLocation:", error)
          throw error
     }
}
