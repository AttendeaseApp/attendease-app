import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response"
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch"
import { VERIFY_EVENT_VENUE_WITH_LOCATION_UPGRADE } from "@/server/constants/endpoints"

/**
 * Verifies venue location with auto-upgrade for PARTIALLY_REGISTERED students
 */
export async function verifyVenueLocationWithAutoUpgrade(
     eventId: string,
     latitude: number,
     longitude: number
): Promise<LocationTrackingResponse> {
     if (latitude === null || longitude === null) {
          console.warn("Cannot verify venue location with auto-upgrade: coordinates are null")
          throw new Error("Invalid coordinates: latitude and longitude are required")
     }

     try {
          console.log("Sending venue location auto-upgrade request:", {
               eventId,
               latitude,
               longitude,
          })

          const response = await userAuthenticatedContextFetch(
               VERIFY_EVENT_VENUE_WITH_LOCATION_UPGRADE,
               {
                    method: "POST",
                    body: JSON.stringify({ eventId, latitude, longitude }),
               }
          )

          if (!response.ok) {
               const errorText = await response.text()
               console.error("Venue location auto-upgrade failed:", errorText)
               throw new Error(`Venue location auto-upgrade failed: ${response.status}`)
          }

          const data = (await response.json()) as LocationTrackingResponse
          console.log("Venue auto-upgrade response received:", data)

          if (data.autoUpgraded) {
               console.log("Auto-upgrade successful!")
          }

          return data
     } catch (error) {
          console.error("Error in verifyVenueLocationWithAutoUpgrade:", error)
          throw error
     }
}
