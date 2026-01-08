import { Alert } from "react-native";
import { eventRegistrationAPIService } from "@/server/service/api/event/registration/event-registration-api";

export interface RegistrationParams {
  eventId: string;
  latitude: number | null;
  longitude: number | null;
  faceImageBase64: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess?: () => void;
}

export async function EventRegistrationServiceHandler({
  eventId,
  latitude,
  longitude,
  faceImageBase64,
  setLoading,
  onSuccess,
}: RegistrationParams) {
  if (!eventId || latitude === null || longitude === null) {
    Alert.alert("Missing Data", "Cannot proceed with check-in.");
    return;
  }

  if (faceImageBase64 === null || faceImageBase64 === undefined) {
    console.log("Registering without facial verification.");
  }

  setLoading(true);

  try {
    const result = await eventRegistrationAPIService(
      eventId,
      latitude,
      longitude,
      faceImageBase64 || "",
    );

    if (result.success) {
      onSuccess?.();
      Alert.alert(
        "Registration Successful",
        result.message || "You have been registered for the event.",
        [{ text: "OK" }],
      );
    } else {
      Alert.alert("Registration Failed", result.message || "Please try again.");
    }
  } catch (error: any) {
    Alert.alert("Error", error.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}
