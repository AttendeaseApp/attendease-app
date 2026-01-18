import AsyncStorage from "@react-native-async-storage/async-storage"

let cachedToken: string | null = null

export async function getAuthToken(): Promise<string | null> {
     if (cachedToken) return cachedToken

     cachedToken = await AsyncStorage.getItem("authToken")
     return cachedToken
}

export async function setAuthToken(token: string): Promise<void> {
     cachedToken = token
     await AsyncStorage.setItem("authToken", token)
}

export async function clearAuthToken(): Promise<void> {
     cachedToken = null
     await AsyncStorage.removeItem("authToken")
}
