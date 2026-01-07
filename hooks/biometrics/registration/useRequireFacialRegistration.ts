import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/domain/interface/token/token";

/**
 * Hook to ensure facial registration is completed before accessing protected routes
 * Use this in your tab screens or any protected screen
 */
export const useRequireFacialRegistration = () => {
  const router = useRouter();

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");

        if (!token) {
          router.replace("/(routes)/login");
          return;
        }

        const decoded: DecodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          await AsyncStorage.multiRemove([
            "authToken",
            "facialRegistrationComplete",
            "studentNumber",
          ]);
          router.replace("/(routes)/login");
          return;
        }

        const registrationComplete = await AsyncStorage.getItem(
          "facialRegistrationComplete",
        );

        if (registrationComplete !== "true") {
          const studentNumber = await AsyncStorage.getItem("studentNumber");
          router.replace({
            pathname: "/(routes)/(biometrics)/onboarding",
            params: studentNumber ? { studentNumber } : {},
          });
        }
      } catch (error) {
        console.error("Error checking registration status:", error);
        await AsyncStorage.multiRemove([
          "authToken",
          "facialRegistrationComplete",
          "studentNumber",
        ]);
        router.replace("/(routes)/login");
      }
    };

    checkRegistrationStatus();
  }, []);
};
