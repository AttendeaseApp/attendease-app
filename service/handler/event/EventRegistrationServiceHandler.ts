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
     if (!eventId || latitude === null || longitude === null) {
          Alert.alert("Missing Data", "Cannot proceed with check-in.")
          return
     }

     if (!faceImageUri) {
          console.log("Registering without facial verification.")
     }

     setLoading(true)

     try {
          const result = await eventRegistrationAPIService(
               eventId,
               latitude,
               longitude,
               faceImageUri || undefined
          )

          if (result.success) {
               onSuccess?.()
               Alert.alert(
                    "Registration Successful",
                    result.message || "You have been registered for the event.",
                    [{ text: "OK" }]
               )
          } else {
               const errorTitle = getErrorTitle(result.errorCode)
               Alert.alert(errorTitle, result.message || "Please try again.")
          }
     } catch (error: any) {
          Alert.alert("Error", error.message || "Something went wrong.")
     } finally {
          setLoading(false)
     }
}

function getErrorTitle(errorCode?: string): string {
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
}
