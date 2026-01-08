import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";
import { UPDATE_PASSWORD } from "@/server/constants/endpoints";

interface PasswordUpdateRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Updates the user's password.
 *
 * @param oldPassword - Current password
 * @param newPassword - New password
 * @returns Promise resolving to the success message or throws an error
 */
export async function updateUserPasswordService(
  oldPassword: string,
  newPassword: string,
): Promise<string> {
  const requestBody: PasswordUpdateRequest = { oldPassword, newPassword };
  const response = await userAuthenticatedContextFetch(UPDATE_PASSWORD, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Client: Failed to update password");
  }
  return response.text();
}
