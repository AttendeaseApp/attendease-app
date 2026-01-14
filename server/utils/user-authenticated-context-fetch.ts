import { getAuthToken, clearAuthToken } from "./token-cache"
import { logoutService } from "../service/api/profile/logout-service"
import { router } from "expo-router"

/**
 * A wrapper around fetch that includes the auth token from AsyncStorage
 * in the Authorization header (Bearer scheme) for authenticated requests.
 *
 * Automatically handles 401 Unauthorized responses by logging out the user
 * and redirecting to the login page.
 *
 * @param url The URL to fetch
 * @param options Fetch options (method, headers, body, etc.)
 * @returns The fetch Response object
 */
export async function userAuthenticatedContextFetch(url: string, options: any = {}) {
     try {
          const token = await getAuthToken()
          if (!token) {
               console.warn("No auth token available, logging out...")
               await handleUnauthorized()
               throw new Error("No authentication token available")
          }
          const headers: any = {
               ...(options.headers || {}),
          }

          headers["Authorization"] = `Bearer ${token}`

          if (!(options.body instanceof FormData)) {
               headers["Content-Type"] = "application/json"
          }

          console.log("Making request to:", url)
          console.log("Has token:", !!token)
          console.log("Is FormData:", options.body instanceof FormData)

          const response = await fetch(url, {
               ...options,
               headers,
          })

          console.log("Response status:", response.status)
          console.log("Response ok:", response.ok)

          if (response.status === 401) {
               console.warn("401 Unauthorized - logging out user...")
               await handleUnauthorized()
               throw new Error("Session expired. Please login again.")
          }

          return response
     } catch (error) {
          console.error("authFetch error:", error)
          throw error
     }
}

/**
 * Handles unauthorized access by logging out and redirecting to login
 */
async function handleUnauthorized() {
     try {
          await logoutService()
          await clearAuthToken()
          if (router.canGoBack()) {
               router.replace("/(routes)/login")
          } else {
               router.push("/(routes)/login")
          }
     } catch (error) {
          console.error("Error during unauthorized handler:", error)
          await clearAuthToken()
          router.replace("/(routes)/login")
     }
}
