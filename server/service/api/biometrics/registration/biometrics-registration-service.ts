import { REGISTER_FACE } from "@/server/constants/endpoints";
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch";
import { BiometricsResult } from "@/domain/interface/biometrics/registration/biometrics.registration.result.response";

export async function biometricsRegistrationService(
  imageUris: string[],
): Promise<BiometricsResult> {
  try {
    if (imageUris.length < 5) {
      return {
        success: false,
        message: "At least 5 images required for registration",
      };
    }

    if (imageUris.length > 5) {
      return {
        success: false,
        message: "Maximum 5 images allowed",
      };
    }

    const formData = new FormData();

    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const mimeType = `image/${fileExtension}`;

      formData.append("images", {
        uri: imageUri,
        type: mimeType,
        name: `face_${i + 1}.${fileExtension}`,
      } as any);
    }

    console.log(`Uploading ${imageUris.length} images for face registration`);

    const uploadResponse = await userAuthenticatedContextFetch(REGISTER_FACE, {
      method: "POST",
      body: formData,
    });

    const result = await uploadResponse.text();

    if (uploadResponse.ok) {
      return { success: true, message: result };
    } else {
      return { success: false, message: result || "Registration failed" };
    }
  } catch (error) {
    console.error("Image upload error:", error);
    return { success: false, message: "Network error. Check connection." };
  }
}
