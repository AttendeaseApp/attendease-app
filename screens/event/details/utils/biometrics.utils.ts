import AsyncStorage from "@react-native-async-storage/async-storage"

export async function checkBiometricsRegistration(): Promise<boolean> {
     const registrationComplete = await AsyncStorage.getItem("facialRegistrationComplete")
     return registrationComplete === "true"
}
