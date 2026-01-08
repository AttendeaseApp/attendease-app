import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, View, StyleSheet, StatusBar, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Button, ButtonText } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/text/themed.text";
import { updateUserPasswordService } from "@/server/service/api/profile/update-password-service";
import { ThemedTextInput } from "@/components/ui/input/themed.text.input";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface PasswordFormState {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export default function ChangePasswordScreen() {
    const router = useRouter();

    const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = (field: keyof PasswordFormState, value: string) => {
        setPasswordForm((prev) => ({ ...prev, [field]: value }));
    };

    const validatePasswordForm = (): string | null => {
        if (!passwordForm.oldPassword.trim()) return "Old password is required.";
        if (!passwordForm.newPassword.trim()) return "New password is required.";
        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) return "New passwords don't match.";
        return null;
    };

    const validationError = validatePasswordForm();
    const isFormValid = validationError;

    const performPasswordUpdate = async () => {
        setLoading(true);
        try {
            const message = await updateUserPasswordService(passwordForm.oldPassword, passwordForm.newPassword);
            Alert.alert("Success", message, [{ text: "Done", onPress: () => router.back() }]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update password";
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        !isFormValid;

        Alert.alert("Confirm Password Change", "This will update your password. This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Confirm",
                style: "destructive",
                onPress: performPasswordUpdate,
            },
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <ThemedText type="title">CHANGE PASSWORD</ThemedText>
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
                <ThemedText type="title" style={styles.subtitle}>
                    Manage your pasword
                </ThemedText>

                <ThemedText style={styles.description}>Enter your old password and a new one to update it. New passwords must be at least 8 characters.</ThemedText>
                <ThemedText style={styles.description}>
                    Before you begin, It is a good idea to prepare your new password ahead of time and save it somewhere safe, like a password manager. That way, you won’t risk losing access if you
                    forget it later.
                </ThemedText>

                {/* Old Password */}
                <ThemedText style={styles.label}>Old Password *</ThemedText>
                <ThemedTextInput
                    isPassword
                    value={passwordForm.oldPassword}
                    onChangeText={(v) => handlePasswordChange("oldPassword", v)}
                    placeholder="Enter old password"
                    editable={!loading}
                    variant="outlined"
                />

                {/* New Password */}
                <ThemedText style={styles.label}>New Password *</ThemedText>
                <ThemedTextInput
                    isPassword
                    value={passwordForm.newPassword}
                    onChangeText={(v) => handlePasswordChange("newPassword", v)}
                    placeholder="Enter new password (min 8 chars)"
                    editable={!loading}
                    variant="outlined"
                />

                {/* Confirm Password */}
                <ThemedText style={styles.label}>Confirm New Password *</ThemedText>
                <ThemedTextInput
                    isPassword
                    value={passwordForm.confirmNewPassword}
                    onChangeText={(v) => handlePasswordChange("confirmNewPassword", v)}
                    placeholder="Confirm new password"
                    editable={!loading}
                    variant="outlined"
                />

                {/* Actions */}
                <View style={styles.buttonWrapper}>
                    <Button onPress={handleSubmit} disabled={loading} size="lg">
                        <ButtonText>{loading ? "Updating..." : "Confirm"}</ButtonText>
                    </Button>

                    <Button variant="outline" onPress={() => router.back()} disabled={loading} style={{ marginTop: 10 }} size="lg">
                        <ButtonText>Cancel</ButtonText>
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    backButton: {
        marginRight: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    label: {
        fontSize: 14,
        marginTop: 15,
        marginBottom: 5,
    },
    buttonWrapper: {
        marginTop: 30,
        marginBottom: 5,
    },
    subtitle: {
        marginBottom: 12,
    },
    description: {
        marginBottom: 20,
    },
    errorText: {
        color: "red",
        marginVertical: 12,
        fontSize: 14,
    },
});
