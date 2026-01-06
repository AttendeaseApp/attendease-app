import { Button, ButtonText } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/text/themed.text";
import { useCaptureProgress } from "@/hooks/biometrics/registration/useCaptureProgress";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { biometricsRegistrationService } from "@/server/service/api/biometrics/registration/biometrics-registration-service";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, BackHandler, Easing, View, Alert, AlertButton } from "react-native";
import { BiometricsResult } from "@/domain/interface/biometrics/registration/biometrics.registration.result.response";
import registrationScreenStyles from "./registration.screen.styles";

export default function OneTimeFacialRegistrationScreen() {
    const router = useRouter();
    const cameraRef = useRef<CameraView | null>(null);
    const [permission, requestPermission] = useCameraPermissions();

    const { isLoggedIn } = useAuthStatus();
    const { isProcessing, setIsProcessing, capturedImages, setCapturedImages, currentStep, setCurrentStep, getInstructionText, resetCapture, REQUIRED_IMAGES } = useCaptureProgress();

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const checkmarkScale = useRef(new Animated.Value(0)).current;
    const instructionSlide = useRef(new Animated.Value(0)).current;

    const [alertOpen, setAlertOpen] = React.useState(false);
    const [alertTitle, setAlertTitle] = React.useState("");
    const [alertMessage, setAlertMessage] = React.useState("");
    const [alertActions, setAlertActions] = React.useState<{ label: string; action?: () => void; variant?: "solid" | "outline" }[]>([]);

    const showAlert = (title: string, message: string, actions: typeof alertActions = [{ label: "OK" }]) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertActions(actions);
        setAlertOpen(true);
    };

    const skipFacialRegistration = async () => {
        showAlert("Skip Facial Registration?", "You can skip this step for now, but facial authentication may be required later to access certain features.", [
            {
                label: "Cancel",
                variant: "outline",
            },
            {
                label: "Skip",
                action: async () => {
                    await AsyncStorage.setItem("facialRegistrationSkipped", "true");
                    router.replace("/(tabs)");
                },
            },
        ]);
    };

    useEffect(() => {
        if (alertOpen) {
            const buttons: AlertButton[] = alertActions.map((btn) => ({
                text: btn.label,
                onPress: () => {
                    btn.action?.();
                    setAlertOpen(false);
                },
                style: btn.variant === "outline" ? "cancel" : "default",
            }));
            Alert.alert(alertTitle, alertMessage, buttons, { cancelable: true, onDismiss: () => setAlertOpen(false) });
        }
    }, [alertOpen, alertTitle, alertMessage, alertActions]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            showAlert("Registration Required", "You must complete facial registration or skip it to continue.", [
                {
                    label: "Continue Registration",
                    variant: "outline",
                },
                {
                    label: "Skip",
                    action: async () => {
                        await AsyncStorage.setItem("skippedFacialRegistration", "true");
                        router.replace("/(tabs)");
                    },
                },
                {
                    label: "Logout",
                    action: async () => {
                        await AsyncStorage.multiRemove(["authToken", "facialRegistrationComplete", "studentNumber"]);
                        router.replace("/(routes)/login");
                    },
                },
            ]);

            return true;
        });

        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        if (!isProcessing && capturedImages.length < REQUIRED_IMAGES) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        }
    }, [isProcessing, capturedImages.length]);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: (capturedImages.length / REQUIRED_IMAGES) * 100,
            friction: 8,
            tension: 40,
            useNativeDriver: false,
        }).start();
    }, [capturedImages.length]);

    useEffect(() => {
        instructionSlide.setValue(-20);
        Animated.spring(instructionSlide, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [currentStep]);

    const animateCheckmark = () => {
        checkmarkScale.setValue(0);
        Animated.sequence([
            Animated.spring(checkmarkScale, {
                toValue: 1.2,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(checkmarkScale, {
                toValue: 0,
                duration: 300,
                delay: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const captureImage = async () => {
        if (!cameraRef.current || isProcessing) return;

        if (!isLoggedIn) {
            showAlert("AUTHENTICATION REQUIRED", "Please login to register your face.");
            return;
        }
        setIsProcessing(true);

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
            });
            if (!photo) {
                showAlert("ERROR", "Failed to capture image");
                setIsProcessing(false);
                return;
            }

            animateCheckmark();

            const newImages = [...capturedImages, photo.uri];
            setCapturedImages(newImages);
            setCurrentStep(currentStep + 1);

            setTimeout(() => {
                if (newImages.length >= REQUIRED_IMAGES) {
                    sendImagesToServer(newImages);
                } else {
                    setIsProcessing(false);
                }
            }, 600);
        } catch (error: any) {
            console.error("Face capture error:", error);
            showAlert("ERROR", error.message || "Failed to capture image");
            setIsProcessing(false);
        }
    };

    const sendImagesToServer = async (images: string[]) => {
        setIsProcessing(true);
        try {
            const result: BiometricsResult = await biometricsRegistrationService(images);

            if (result.success) {
                await AsyncStorage.setItem("facialRegistrationComplete", "true");

                showAlert("SUCCESS", result.message ?? "Face registered successfully!", [
                    {
                        label: "OK",
                        action: () => {
                            router.replace("/(tabs)");
                            resetCapture();
                        },
                    },
                ]);
            } else {
                showAlert("REGISTRATION FAILED", result.message ?? "Face registration failed. Please try again.", [
                    {
                        label: "RETRY",
                        action: () => {
                            resetCapture();
                        },
                    },
                ]);
            }
        } catch (error: any) {
            console.error("Face registration error:", error);
            showAlert("ERROR", error.message || "Something went wrong during face registration. Please check your network connection.", [
                {
                    label: "RETRY",
                    action: () => {
                        resetCapture();
                    },
                },
            ]);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!permission) {
        return (
            <View style={registrationScreenStyles.center}>
                <Ionicons name="camera-outline" size={64} color="#666" style={{ marginBottom: 16 }} />
                <ThemedText type="default" style={registrationScreenStyles.permissionText}>
                    Requesting camera permission...
                </ThemedText>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={registrationScreenStyles.center}>
                <Ionicons name="camera-outline" size={64} color="#666" style={{ marginBottom: 16 }} />
                <ThemedText type="title" style={[registrationScreenStyles.permissionText, { marginBottom: 8 }]}>
                    Camera Access is Required
                </ThemedText>
                <ThemedText type="default" style={[registrationScreenStyles.permissionText, { fontSize: 14, opacity: 0.7 }]}>
                    We need camera access to register your face for secure authentication. This is a one-time setup required for all users.
                </ThemedText>

                <Button action="primary" variant="outline" onPress={requestPermission} style={{ marginTop: 20 }}>
                    <ButtonText>Grant Camera Permission</ButtonText>
                </Button>
            </View>
        );
    }

    const isCaptureComplete = capturedImages.length >= REQUIRED_IMAGES;

    return (
        <Animated.View style={[registrationScreenStyles.container, { opacity: fadeAnim }]}>
            <CameraView style={registrationScreenStyles.camera} facing="front" ref={cameraRef}>
                <View style={registrationScreenStyles.overlay}>
                    {/*instruction card*/}
                    <Animated.View
                        style={[
                            registrationScreenStyles.instructionBox,
                            {
                                transform: [{ translateY: instructionSlide }],
                            },
                        ]}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                            <Ionicons name="information-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <ThemedText type="default" colorVariant="white" style={{ fontSize: 12, opacity: 0.9 }}>
                                Step {currentStep + 1} of {REQUIRED_IMAGES}
                            </ThemedText>
                        </View>
                        <ThemedText type="default" colorVariant="white" style={{ fontSize: 16 }}>
                            {getInstructionText()}
                        </ThemedText>

                        {/*progress bar*/}
                        <View style={{ marginTop: 12, height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" }}>
                            <Animated.View
                                style={{
                                    height: "100%",
                                    backgroundColor: "#4ade80",
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ["0%", "100%"],
                                    }),
                                }}
                            />
                        </View>
                    </Animated.View>

                    {/*face frame */}
                    <Animated.View
                        style={[
                            registrationScreenStyles.faceFrame,
                            {
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    />

                    {/*success checkmark overlay*/}
                    <Animated.View
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            marginLeft: -50,
                            marginTop: -50,
                            transform: [{ scale: checkmarkScale }],
                        }}
                    >
                        <View
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                backgroundColor: "rgba(74, 222, 128, 0.9)",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Ionicons name="checkmark" size={60} color="#fff" />
                        </View>
                    </Animated.View>

                    <View style={registrationScreenStyles.progressIndicators}>
                        {[...Array(REQUIRED_IMAGES)].map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    registrationScreenStyles.progressDot,
                                    index < capturedImages.length && registrationScreenStyles.progressDotActive,
                                    {
                                        width: index < capturedImages.length ? 32 : 12,
                                        backgroundColor: index < capturedImages.length ? "#4ade80" : "rgba(255,255,255,0.3)",
                                    },
                                ]}
                            >
                                {index < capturedImages.length && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </View>
                        ))}
                    </View>
                </View>
            </CameraView>

            {/*bottom controls*/}
            <View style={registrationScreenStyles.controls}>
                <View style={registrationScreenStyles.buttonGroup}>
                    {capturedImages.length > 0 && capturedImages.length < REQUIRED_IMAGES && (
                        <Button action="secondary" onPress={resetCapture} disabled={isProcessing} style={{ flex: 1 }}>
                            <ButtonText>Reset</ButtonText>
                        </Button>
                    )}

                    <Button
                        action="primary"
                        variant="solid"
                        onPress={captureImage}
                        disabled={isProcessing || isCaptureComplete}
                        style={{
                            flex: capturedImages.length > 0 && capturedImages.length < REQUIRED_IMAGES ? 2 : 1,
                        }}
                    >
                        <ButtonText>{isCaptureComplete ? "Processing..." : `Capture (${capturedImages.length}/${REQUIRED_IMAGES})`}</ButtonText>
                    </Button>
                </View>

                <View style={{ marginTop: 12, alignItems: "center" }}>
                    <Button action="secondary" variant="outline" onPress={skipFacialRegistration}>
                        <ButtonText>Skip Facial Registration</ButtonText>
                    </Button>
                </View>

                {/*help me hahaha*/}
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 12 }}>
                    <Ionicons name="bulb-outline" size={16} color="#666" style={{ marginRight: 8, marginTop: 2 }} />
                    <ThemedText style={[registrationScreenStyles.helpText, { flex: 1, fontSize: 13, lineHeight: 18 }]} type="default">
                        {isCaptureComplete
                            ? "All images captured! Processing your biometric profile..."
                            : capturedImages.length === 0
                              ? "Position your face within the frame and tap Capture to begin."
                              : "Follow the instruction above and capture the next image."}
                    </ThemedText>
                </View>
            </View>
        </Animated.View>
    );
}
