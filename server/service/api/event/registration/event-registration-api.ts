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
     console.log("[API] Starting event registration...")
     console.log("[API] Event ID:", eventId)
     console.log("[API] Location:", { latitude, longitude })
     console.log("[API] Face image provided:", !!faceImageUri)

     if (faceImageUri) {
          console.log("[API] Face image URI:", faceImageUri.substring(0, 50) + "...")
     }

     try {
          const formData = new FormData()
          const registrationData = {
               eventId,
               latitude,
               longitude,
          }

          console.log("[API] Registration data:", registrationData)
          formData.append("registrationData", JSON.stringify(registrationData))

          if (faceImageUri && faceImageUri.trim() !== "") {
               console.log("[API] Processing face image...")

               const uriParts = faceImageUri.split(".")
               const fileExtension = uriParts[uriParts.length - 1]

               const faceImageFile = {
                    uri: faceImageUri,
                    type: `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`,
                    name: `face-verification.${fileExtension}`,
               } as any

               console.log("[API] Face image details:", {
                    extension: fileExtension,
                    type: faceImageFile.type,
                    name: faceImageFile.name,
               })

               formData.append("faceImage", faceImageFile)
               console.log("[API] Face image added to form data")
          } else {
               console.log("[API] No face image to add")
          }

          console.log("[API] Sending request to:", REGISTER_STUDENT_ON_EVENT_ENDPOINT)

          const response = await userAuthenticatedContextFetch(REGISTER_STUDENT_ON_EVENT_ENDPOINT, {
               method: "POST",
               body: formData,
          })

          console.log("[API] Response status:", response.status)
          console.log("[API] Response OK:", response.ok)

          if (!response.ok) {
               console.log("[API] Registration failed with status:", response.status)

               let errorData
               try {
                    errorData = await response.json()
                    console.log("[API] Error response:", errorData)
               } catch (parseError) {
                    console.error("[API] Failed to parse error response:", parseError)
                    errorData = { message: "Registration failed" }
               }

               return {
                    success: false,
                    message: errorData.message || "Registration failed",
                    errorCode: errorData.errorCode,
               }
          }

          const data = await response.json()
          console.log("[API] Registration successful!")
          console.log("[API] Response data:", data)

          return {
               success: true,
               message: data.message || "Registration successful",
               data,
          }
     } catch (error: any) {
          console.error("[API] Event registration error:", error)
          console.error("[API] Error name:", error.name)
          console.error("[API] Error message:", error.message)
          console.error("[API] Error stack:", error.stack)

          return {
               success: false,
               message: error.message || "An error occurred during registration",
          }
     }
}
