import { IMessage } from "@stomp/stompjs"
import { stompConnect } from "@/server/utils/user-authenticated-context-ws"
import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response"

/**
 * Verifies venue location with auto-upgrade for PARTIALLY_REGISTERED students
 */
export async function verifyVenueLocationWithAutoUpgrade(
     eventId: string,
     latitude: number,
     longitude: number,
     callback: (data: LocationTrackingResponse) => void
) {
     if (latitude === null || longitude === null) {
          console.warn("Cannot verify venue location with auto-upgrade: coordinates are null")
          return { unsubscribe: () => {} }
     }

     try {
          const client = await stompConnect()

          if (!client.connected) {
               console.warn("STOMP client not connected yet, waiting...")
               await new Promise((resolve) => setTimeout(resolve, 500))
          }

          console.log("Subscribing to venue location auto-upgrade...")

          const subscription = client.subscribe(
               "/user/queue/venue-location-auto-upgrade",
               (message: IMessage) => {
                    try {
                         const body = JSON.parse(message.body) as LocationTrackingResponse
                         console.log("Venue auto-upgrade response received:", body)

                         if (body.autoUpgraded) {
                              console.log("Auto-upgrade successful!")
                         }

                         callback(body)
                    } catch (e) {
                         console.error("Failed to parse venue auto-upgrade response:", e)
                    }
               }
          )

          await new Promise((resolve) => setTimeout(resolve, 100))

          console.log("Publishing venue location auto-upgrade request:", {
               eventId,
               latitude,
               longitude,
          })

          client.publish({
               destination: "/app/verify-venue-location-with-upgrade",
               body: JSON.stringify({ eventId, latitude, longitude }),
          })

          console.log("Venue location auto-upgrade request sent")

          return subscription
     } catch (error) {
          console.error("Error in verifyVenueLocationWithAutoUpgrade:", error)
          return { unsubscribe: () => {} }
     }
}
