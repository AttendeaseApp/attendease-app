import React, { useEffect, useState } from "react";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { ThemeProvider } from "@/context/theme.context";
import { AttendanceTrackingProvider } from "@/store/attendance/tracking/attendance.tracking.context";
import { LogBox, Alert } from "react-native";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/domain/interface/token/token";
import "@/global.css";

SplashScreen.preventAutoHideAsync();
LogBox.ignoreAllLogs();

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  requiresFacialRegistration: boolean;
}

function useProtectedRoute(authState: AuthState, router: any) {
  const segments = useSegments() as string[];
  useEffect(() => {
    if (authState.isLoading) return;
    const inAuthGroup =
      segments[0] === "(routes)" &&
      segments.length > 1 &&
      segments[1] === "login";
    const inBiometricsGroup =
      segments[0] === "(routes)" &&
      segments.length > 1 &&
      segments[1] === "(biometrics)";
    if (!authState.isLoggedIn && !inAuthGroup) {
      router.replace("/(routes)/login");
    }
  }, [authState.isLoggedIn, authState.isLoading, segments, router]);
}

function RootLayoutNav() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    requiresFacialRegistration: false,
  });
  const router = useRouter();
  const [reminderOpen, setReminderOpen] = useState(false);
  useProtectedRoute(authState, router);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (
      authState.isLoggedIn &&
      !authState.isLoading &&
      authState.requiresFacialRegistration
    ) {
      showRegistrationReminder();
    }
  }, [authState]);

  useEffect(() => {
    if (reminderOpen) {
      Alert.alert(
        "Complete Your Setup",
        "Register your face for faster event check-ins with facial verification. It's quick and secure!",
        [
          {
            text: "Remind Me Later",
            onPress: () => handleReminderAction("remindLater"),
          },
          { text: "Skip for Now", onPress: () => handleReminderAction("skip") },
          {
            text: "Register Now",
            onPress: () => handleReminderAction("register"),
          },
        ],
        { cancelable: true, onDismiss: () => setReminderOpen(false) },
      );
    }
  }, [reminderOpen]);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setAuthState({
          isLoggedIn: false,
          isLoading: false,
          requiresFacialRegistration: false,
        });
        SplashScreen.hideAsync();
        return;
      }
      const decoded: DecodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        await AsyncStorage.multiRemove([
          "authToken",
          "facialRegistrationComplete",
          "studentNumber",
          "skippedFacialRegistration",
        ]);
        setAuthState({
          isLoggedIn: false,
          isLoading: false,
          requiresFacialRegistration: false,
        });
        SplashScreen.hideAsync();
        return;
      }
      const registrationComplete = await AsyncStorage.getItem(
        "facialRegistrationComplete",
      );
      setAuthState({
        isLoggedIn: true,
        isLoading: false,
        requiresFacialRegistration: registrationComplete !== "true",
      });
      SplashScreen.hideAsync();
    } catch (error) {
      console.error("Auth check error:", error);
      await AsyncStorage.multiRemove([
        "authToken",
        "facialRegistrationComplete",
        "studentNumber",
        "skippedFacialRegistration",
      ]);
      setAuthState({
        isLoggedIn: false,
        isLoading: false,
        requiresFacialRegistration: false,
      });
      SplashScreen.hideAsync();
    }
  };

  const showRegistrationReminder = async () => {
    const lastSkip = await AsyncStorage.getItem("skippedFacialRegistration");
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (!lastSkip || parseInt(lastSkip) < sevenDaysAgo) {
      setReminderOpen(true);
    }
  };

  const handleReminderAction = async (
    action: "register" | "remindLater" | "skip",
  ) => {
    setReminderOpen(false);
    if (action === "register") {
      const studentNumber = await AsyncStorage.getItem("studentNumber");
      router.replace({
        pathname: "/(routes)/(biometrics)/onboarding",
        params: { studentNumber: studentNumber || "" },
      });
    } else if (action === "remindLater") {
      await AsyncStorage.setItem(
        "skippedFacialRegistration",
        (Date.now() + 1 * 24 * 60 * 60 * 1000).toString(),
      );
    } else if (action === "skip") {
      await AsyncStorage.setItem(
        "skippedFacialRegistration",
        Date.now().toString(),
      );
    }
  };

  if (authState.isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/*<Stack.Screen name="(routes)" />*/}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <ThemeProvider>
        <AttendanceTrackingProvider>
          <RootLayoutNav />
        </AttendanceTrackingProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
