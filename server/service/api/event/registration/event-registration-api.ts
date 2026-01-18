import { REGISTER_STUDENT_ON_EVENT_ENDPOINT } from "@/server/constants/endpoints"
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch"

/**
 * Registers a student for an event using multipart form data.
 * Backend will verify location using the event's registration location.
 *
 * @param eventId - The event to register for
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @param faceImageUri - Optional URI to the captured face image for facial verification
 * @returns Registration result with success status and message
 */
export async function eventRegistrationAPIService(
     eventId: string,
     latitude: number,
     longitude: number,
     faceImageUri?: string
) {
     try {
          const formData = new FormData()
          const registrationData = {
               eventId,
               latitude,
               longitude,
          }
          formData.append("registrationData", JSON.stringify(registrationData))

          if (faceImageUri && faceImageUri.trim() !== "") {
               const uriParts = faceImageUri.split(".")
               const fileExtension = uriParts[uriParts.length - 1]
               const faceImageFile = {
                    uri: faceImageUri,
                    type: `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`,
                    name: `face-verification.${fileExtension}`,
               } as any
               formData.append("faceImage", faceImageFile)
          }

          const response = await userAuthenticatedContextFetch(REGISTER_STUDENT_ON_EVENT_ENDPOINT, {
               method: "POST",
               body: formData,
          })

          if (!response.ok) {
               const errorData = await response.json()
               return {
                    success: false,
                    message: errorData.message || "Registration failed",
                    errorCode: errorData.errorCode,
               }
          }

          const data = await response.json()
          return {
               success: true,
               message: data.message || "Registration successful",
               data,
          }
     } catch (error: any) {
          console.error("Event registration error:", error)
          return {
               success: false,
               message: error.message || "An error occurred during registration",
          }
     }
}
