import { StyleSheet, KeyboardAvoidingView, Platform, View, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { ScreenLayoutContainer } from "@/components/layout/screen.layout.container";
import { ThemedText } from "@/components/ui/text/themed.text";
import { ThemedTextInput } from "@/components/ui/input/themed.text.input";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useLogin } from "@/hooks/login/useLogin";
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from "@/components/ui/alert-dialog";

export default function LoginScreen() {
    const { studentNumber, setStudentNumber, password, setPassword, loading, handleLogin, alertOpen, setAlertOpen, alertTitle, alertMessage } = useLogin();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <ScreenLayoutContainer>
            <KeyboardAvoidingView style={loginStyles.background} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
                <Animated.View
                    style={[
                        loginStyles.container,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={loginStyles.header}>
                        <ThemedText type="loginTitle">RCIANS ATTENDEASE</ThemedText>
                        <ThemedText type="default">Discover events, check in seamlessly, and stay connected within our community.</ThemedText>
                    </View>

                    <ThemedText type="default">Log in to your account.</ThemedText>

                    <ThemedTextInput
                        placeholder="Student Number"
                        value={studentNumber}
                        onChangeText={setStudentNumber}
                        autoCapitalize="characters"
                        variant="outlined"
                        backgroundColorOverride="transparent"
                    />

                    <ThemedTextInput placeholder="Password" value={password} onChangeText={setPassword} isPassword variant="outlined" backgroundColorOverride="transparent" />
                    <Button action="primary" variant="solid" size="md" onPress={handleLogin} disabled={loading}>
                        {loading ? <ButtonSpinner /> : <ButtonText>LOG IN</ButtonText>}
                    </Button>
                </Animated.View>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <ThemedText type="default" style={{ fontSize: 13, textAlign: "center" }}>
                        2025 Rogationist College - College Department
                    </ThemedText>
                </Animated.View>
            </KeyboardAvoidingView>

            <AlertDialog isOpen={alertOpen} onClose={() => setAlertOpen(false)}>
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <ThemedText type="default">{alertTitle}</ThemedText>
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <ThemedText type="default">{alertMessage}</ThemedText>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button size="sm" variant="solid" action="primary" onPress={() => setAlertOpen(false)}>
                            <ButtonText>Okay</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ScreenLayoutContainer>
    );
}

const loginStyles = StyleSheet.create({
    header: {
        marginBottom: 24,
        gap: 3,
    },
    background: {
        flex: 1,
        padding: 25,
        gap: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "100%",
        justifyContent: "center",
        maxWidth: 400,
        borderRadius: 11,
        marginVertical: 48,
        gap: 12,
    },
    input: {
        width: "100%",
        height: 50,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 1,
        marginBottom: 16,
        paddingHorizontal: 8,
    },
});
