import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Logs out the current user by removing the auth token and any related stored data from AsyncStorage.
 * This ensures a clean slate on logout.
 */
export async function logoutService(): Promise<void> {
    try {
        const clearKeys = ["authToken", "studentNumber", "facialRegistrationComplete", "userProfile"];

        await AsyncStorage.multiRemove(clearKeys);
        console.log("Logout completed: Cleared storage keys", clearKeys);
    } catch (error) {
        console.error("Logout storage error:", error);
        throw new Error("Failed to clear session data");
    }
}
