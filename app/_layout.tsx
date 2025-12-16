import React from "react";
import { SplashScreen, Stack } from "expo-router";
import { ThemeProvider, useTheme } from "@/context/theme.context";
import { Poppins_600SemiBold, Poppins_300Light, Poppins_400Regular, Poppins_700Bold, Poppins_500Medium, useFonts } from "@expo-google-fonts/poppins";
import { withIAPContext } from "react-native-iap";
// import { NotificationProvider } from "@/context/notification.provider";
import { LogBox } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

LogBox.ignoreAllLogs();

function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
        Poppins_600SemiBold,
        Poppins_300Light,
        Poppins_700Bold,
        Poppins_400Regular,
        Poppins_500Medium,
    });

    return (
        <ThemeProvider>
            {/*<NotificationProvider>*/}
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(routes)/onboarding/index" />
                <Stack.Screen name="(routes)/course-access" />
                <Stack.Screen name="(routes)/notification/index" />
            </Stack>
            {/*</NotificationProvider>*/}
        </ThemeProvider>
    );
}

export default withIAPContext(RootLayout);
