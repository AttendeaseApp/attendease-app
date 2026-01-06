import { Button, ButtonText } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/text/themed.text";
import { useEventRegistration } from "@/hooks/events/registration/useEventRegistration";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import facialVerificationScreenStyles from "./facial.verification.screen.styles";

export default function EventRegistrationFacialVerificationScreen() {
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [loading, setLoading] = useState(false);
    const { eventId, locationId } = useLocalSearchParams<{
        eventId: string;
        locationId: string;
    }>();
    const { latitude, longitude, locationLoading } = useEventRegistration(eventId, locationId);
    const router = useRouter();

    const captureAndVerify = async () => {
        if (locationLoading || latitude === null || longitude === null) {
            Alert.alert("Location Required", "We are still fetching your location coordinates. Please wait a moment and try again.");
            return;
        }

        if (!cameraRef.current) {
            Alert.alert("Camera Error", "Camera is not ready. Please restart the app.");
            return;
        }

        setLoading(true);

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
            });

            if (!photo.base64) {
                throw new Error("Failed to capture image data.");
            }

            router.push({
                pathname: "/(routes)/event/registration",
                params: {
                    eventId,
                    locationId,
                    face: photo.base64,
                },
            });
        } catch (error: any) {
            Alert.alert("Capture Error", error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (permission === null) {
        return (
            <View style={facialVerificationScreenStyles.center}>
                <ActivityIndicator size="large" />
                <ThemedText type="default">Requesting camera permission...</ThemedText>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={facialVerificationScreenStyles.center}>
                <ThemedText type="default" style={facialVerificationScreenStyles.permissionText}>
                    Camera access is required to verify your identity. This is essential for secure event registration.
                </ThemedText>
                <Button action="primary" variant="outline" onPress={requestPermission}>
                    <ButtonText>Grant Permission</ButtonText>
                </Button>
            </View>
        );
    }

    const isProcessing = loading || locationLoading;
    const loadingMessage = locationLoading ? "Fetching secure location..." : "Verifying face...";

    return (
        <View style={facialVerificationScreenStyles.container}>
            <CameraView ref={cameraRef} style={facialVerificationScreenStyles.camera} facing="front">
                <View style={facialVerificationScreenStyles.overlay}>
                    <View style={facialVerificationScreenStyles.instructionBox}>
                        <ThemedText type="defaultSemiBold" colorVariant="white">
                            Align your face inside the frame and tap the button to verify your identity.
                        </ThemedText>
                    </View>

                    <View style={facialVerificationScreenStyles.faceFrame} />

                    <View style={facialVerificationScreenStyles.controls}>
                        {isProcessing ? (
                            <>
                                <ActivityIndicator size="large" color="#0D9488" />
                                <ThemedText type="default" colorVariant="white">
                                    {loadingMessage}
                                </ThemedText>
                            </>
                        ) : (
                            <Button action="secondary" variant="outline" onPress={captureAndVerify}>
                                <ButtonText>Verify Me</ButtonText>
                            </Button>
                        )}
                    </View>
                </View>
            </CameraView>
        </View>
    );
}
