import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";
import { RETRIEVE_USER_PROFILE } from "@/server/constants/endpoints";
import React from "react";

/**
 * Fetches home page data including ongoing events and user profile.
 * It updates the provided state setters with the fetched data and loading state.
 *
 * @param setUser - State setter for the user profile information (firstName and lastName).
 * @param setLoading - State setter for the loading state.
 */
export async function retrieveUserInfoForHomepage(
  setUser: React.Dispatch<
    React.SetStateAction<{ firstName: string; lastName: string } | null>
  >,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  setLoading(true);
  try {
    const profileResponse = await userAuthenticatedContextFetch(
      RETRIEVE_USER_PROFILE,
    );
    if (!profileResponse.ok)
      throw new Error("Failed to fetch user information");
    const profileData = await profileResponse.json();
    setUser({
      firstName: profileData.firstName || "",
      lastName: profileData.lastName || "",
    });
  } catch (error) {
    console.error("Error fetching home page data:", error);
    setUser(null);
  } finally {
    setLoading(false);
  }
}
