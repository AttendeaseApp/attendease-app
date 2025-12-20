import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";
import { RETRIEVE_USER_PROFILE } from "@/server/constants/endpoints";
import { UserStudentResponse } from "@/domain/interface/user/student/user-student.response";
import React from "react";

/**
 * Fetches profile data.
 * It updates the provided state setters with the fetched data and loading state.
 *
 * @param setProfile
 * @param setLoading
 */
export async function getUserProfileDataService(setProfile: React.Dispatch<React.SetStateAction<UserStudentResponse | null>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>) {
    try {
        setLoading(true);
        const response = await userAuthenticatedContextFetch(RETRIEVE_USER_PROFILE);
        if (!response.ok) throw new Error("Failed to fetch user information");
        const data: UserStudentResponse = await response.json();
        setProfile(data);
    } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
    } finally {
        setLoading(false);
    }
}
