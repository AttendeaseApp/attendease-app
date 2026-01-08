import { GET_FACIAL_STATUS, DELETE_FACIAL_DATA } from "@/server/constants/endpoints";
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";

/**
 * Service for managing student biometrics data
 */
export const BiometricsManagementService = {
    /**
     * Get the facial biometric status of the authenticated student
     * @returns Promise with biometric status response
     */
    getFacialStatus: async (): Promise<{
        status: string;
        message: string;
        registeredDate?: string;
    }> => {
        try {
            const response = await userAuthenticatedContextFetch(GET_FACIAL_STATUS, {
                method: "GET",
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Session expired. Please login again.");
                }
                if (response.status === 404) {
                    throw new Error("No facial biometric data found");
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to retrieve facial biometric status");
            }
            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error("Error fetching facial status:", error);
            throw error;
        }
    },

    /**
     * Delete the facial biometric data of the authenticated student
     * @returns Promise with success message
     */
    deleteFacialData: async (): Promise<string> => {
        try {
            const response = await userAuthenticatedContextFetch(DELETE_FACIAL_DATA, {
                method: "DELETE",
            });
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Session expired. Please login again.");
                }
                if (response.status === 404 || response.status === 400) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || "There is no facial biometric data in your account. " + "It might have already been deleted, or you haven't registered it yet.");
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete facial biometric data");
            }
            const message = await response.text();
            return message;
        } catch (error: any) {
            console.error("Error deleting facial data:", error);
            throw error;
        }
    },
};
