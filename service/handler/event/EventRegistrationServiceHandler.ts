import { Alert } from "react-native"
import { eventRegistrationAPIService } from "@/server/service/api/event/registration/event-registration-api"

export interface RegistrationParams {
     eventId: string
     latitude: number | null
     longitude: number | null
     faceImageUri: string | null | undefined
     setLoading: React.Dispatch<React.SetStateAction<boolean>>
     onSuccess?: () => void
}

export async function EventRegistrationServiceHandler({
     eventId,
     latitude,
     longitude,
     faceImageUri,
     setLoading,
     onSuccess,
}: RegistrationParams) {
     console.log("[Handler] Starting registration handler...")
     console.log("[Handler] Event ID:", eventId)
     console.log("[Handler] Location:", { latitude, longitude })
     console.log("[Handler] Face image URI provided:", !!faceImageUri)

     if (!eventId || latitude === null || longitude === null) {
          console.error("[Handler] Missing required data:", { eventId, latitude, longitude })
          Alert.alert("Missing Data", "Cannot proceed with check-in.")
          return
     }

     if (!faceImageUri) {
          console.log("[Handler] Registering without facial verification.")
     } else {
          console.log("[Handler] Registering WITH facial verification")
          console.log("[Handler] Face URI:", faceImageUri.substring(0, 50) + "...")
     }

     setLoading(true)
     console.log("[Handler] Loading state set to true")

     try {
          console.log("[Handler] Calling API service...")
          const result = await eventRegistrationAPIService(
               eventId,
               latitude,
               longitude,
               faceImageUri || undefined
          )

          console.log("[Handler] API service returned:", result)

          if (result.success) {
               console.log("[Handler] Registration successful!")

               if (onSuccess) {
                    console.log("[Handler] Calling onSuccess callback...")
                    onSuccess()
               }

               Alert.alert(
                    "Registration Successful",
                    result.message || "You have been registered for the event.",
                    [
                         {
                              text: "OK",
                              onPress: () => console.log("[Handler] Success alert dismissed"),
                         },
                    ]
               )
          } else {
               console.error("[Handler] Registration failed:", result.message)
               const errorTitle = getErrorTitle(result.errorCode)

               Alert.alert(errorTitle, result.message || "Please try again.", [
                    {
                         text: "OK",
                         onPress: () => console.log("[Handler] Error alert dismissed"),
                    },
               ])
          }
     } catch (error: any) {
          console.error("[Handler] Caught error:", error)
          console.error("[Handler] Error message:", error.message)

          Alert.alert("Error", error.message || "Something went wrong.", [
               {
                    text: "OK",
                    onPress: () => console.log("[Handler] Exception alert dismissed"),
               },
          ])
     } finally {
          console.log("[Handler] Setting loading to false")
          setLoading(false)
     }
}

function getErrorTitle(errorCode?: string): string {
     const title = (() => {
          switch (errorCode) {
               case "VALIDATION_ERROR":
                    return "Verification Failed"
               case "INVALID_FILE_TYPE":
                    return "Invalid Image"
               case "BAD_REQUEST":
                    return "Invalid Request"
               case "INTERNAL_ERROR":
                    return "Server Error"
               default:
                    return "Registration Failed"
          }
     })()

     console.log("[Handler] Error title for code", errorCode, ":", title)
     return title
}
