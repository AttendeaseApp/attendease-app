import { useState } from "react";
import { useRouter } from "expo-router";
import { LoginRequest } from "@/domain/interface/login/login.request";
import { loginService } from "@/server/service/api/login/login-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoginResult } from "@/domain/interface/login/login.result";
import { DecodedToken } from "@/domain/interface/token/token";
import { jwtDecode } from "jwt-decode";

export const useLogin = () => {
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const router = useRouter();

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleLogin = async () => {
    if (!studentNumber || !password) {
      showAlert("MISSING INFORMATION", "Please enter your credentials.");
      return;
    }

    setLoading(true);
    try {
      const request: LoginRequest = { studentNumber, password };
      const result: LoginResult = await loginService(request);

      if (result.success) {
        const token = await AsyncStorage.getItem("authToken");

        if (!token) {
          showAlert(
            "LOGIN ERROR",
            "Authentication token not found. Please try again.",
          );
          setLoading(false);
          return;
        }

        const decoded: DecodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          showAlert("LOGIN EXPIRED", "Session expired. Please log in again.");
          await AsyncStorage.removeItem("authToken");
          setLoading(false);
          return;
        }

        const {
          studentNumber: tokenStudentNumber,
          requiresFacialRegistration,
        } = decoded;

        if (requiresFacialRegistration) {
          router.replace({
            pathname: "/(routes)/(biometrics)/onboarding",
            params: { studentNumber: tokenStudentNumber },
          });
        } else {
          router.replace("/(tabs)");
        }
      } else {
        showAlert("LOGIN FAILED", result.message);
      }
    } catch (error: any) {
      showAlert(
        "ERROR",
        "Something went wrong. Please try again.\n" + (error?.message ?? ""),
      );
      console.error("LOGIN ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    studentNumber,
    setStudentNumber,
    password,
    setPassword,
    loading,
    handleLogin,
    alertOpen,
    setAlertOpen,
    alertTitle,
    alertMessage,
  };
};
