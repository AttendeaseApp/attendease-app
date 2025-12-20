import React from "react";
import { Redirect } from "expo-router";

/**
 * Root index screen - navigation is handled by RootLayout's useProtectedRoute
 * This component is just a placeholder and will immediately redirect based on auth state
 */
export default function Index() {
    return <Redirect href={"/(tabs)"} />;
}
