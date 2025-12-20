import { LOGIN_ENDPOINT } from "@/server/constants/endpoints";
import { LoginRequest } from "@/domain/interface/login/login.request";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoginResult } from "@/domain/interface/login/login.result";

const JWT_TOKEN_HEADER = "Jwt-Token";

/**
 * Logs in a user with the provided student number and password.
 * On success (HTTP 200), extracts the auth token from response headers and stores it in AsyncStorage.
 * The response body is a plain string message.
 *
 * @param request LoginRequest containing studentNumber and password
 * @returns LoginResult with success flag and message
 * @throws Error for network or unexpected issues
 */
export async function loginService(request: LoginRequest): Promise<LoginResult> {
    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        });

        const message = await response.text();

        if (response.ok) {
            const token = response.headers.get(JWT_TOKEN_HEADER);
            if (token) {
                await AsyncStorage.setItem("authToken", token);
                console.log("Token stored successfully from headers");
            } else {
                console.warn("Login successful but no token found in headers");
            }
            return { success: true, message };
        } else {
            return { success: false, message };
        }
    } catch (error) {
        console.error("Login network error:", error);
        return {
            success: false,
            message: "An unexpected error occurred. Please check your connection and try again.",
        };
    }
}
