import { IMessage } from "@stomp/stompjs"
import { stompConnect } from "@/server/utils/user-authenticated-context-ws"
import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response"

/**
 * Verifies if user is at the event's registration location
 */
export async function verifyRegistrationLocation(
     eventId: string,
     latitude: number,
     longitude: number,
     callback: (data: LocationTrackingResponse) => void
) {
     if (latitude === null || longitude === null) {
          console.warn("Cannot verify location: coordinates are null")
          return { unsubscribe: () => {} }
     }

     try {
          const client = await stompConnect()
          if (!client.connected) {
               console.warn("STOMP client not connected yet, waiting...")
               await new Promise((resolve) => setTimeout(resolve, 500))
          }
          console.log("Subscribing to registration location verification...")
          const subscription = client.subscribe(
               "/user/queue/registration-location-verification",
               (message: IMessage) => {
                    try {
                         const body = JSON.parse(message.body) as LocationTrackingResponse
                         console.log("Registration location response received:", body)
                         callback(body)
                    } catch (e) {
                         console.error("Failed to parse registration location response:", e)
                    }
               }
          )
          await new Promise((resolve) => setTimeout(resolve, 100))

          console.log("Publishing registration location verification request:", {
               eventId,
               latitude,
               longitude,
          })

          client.publish({
               destination: "/app/verify-registration-location",
               body: JSON.stringify({ eventId, latitude, longitude }),
          })

          console.log("Registration location verification request sent")

          return subscription
     } catch (error) {
          console.error("Error in verifyRegistrationLocation:", error)
          return { unsubscribe: () => {} }
     }
}

/**
 * Verifies if user is at the event's venue location (for ongoing events)
 */
export async function verifyVenueLocation(
     eventId: string,
     latitude: number,
     longitude: number,
     callback: (data: LocationTrackingResponse) => void
) {
     if (latitude === null || longitude === null) {
          console.warn("Cannot verify venue location: coordinates are null")
          return { unsubscribe: () => {} }
     }

     try {
          const client = await stompConnect()

          if (!client.connected) {
               console.warn("STOMP client not connected yet, waiting...")
               await new Promise((resolve) => setTimeout(resolve, 500))
          }

          console.log("Subscribing to venue location verification...")

          const subscription = client.subscribe(
               "/user/queue/venue-location-verification",
               (message: IMessage) => {
                    try {
                         const body = JSON.parse(message.body) as LocationTrackingResponse
                         console.log("Venue location response received:", body)
                         callback(body)
                    } catch (e) {
                         console.error("Failed to parse venue location response:", e)
                    }
               }
          )

          await new Promise((resolve) => setTimeout(resolve, 100))

          console.log("Publishing venue location verification request:", {
               eventId,
               latitude,
               longitude,
          })

          client.publish({
               destination: "/app/verify-venue-location",
               body: JSON.stringify({ eventId, latitude, longitude }),
          })

          console.log("Venue location verification request sent")

          return subscription
     } catch (error) {
          console.error("Error in verifyVenueLocation:", error)
          return { unsubscribe: () => {} }
     }
}
