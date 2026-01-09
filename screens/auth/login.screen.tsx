import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { ThemedTextInput } from "@/components/ui/input/themed.text.input";
import { ThemedText } from "@/components/ui/text/themed.text";
import { useLogin } from "@/hooks/login/useLogin";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";

export default function LoginScreen() {
  const {
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
  } = useLogin();

  useEffect(() => {
    if (alertOpen) {
      Alert.alert(
        alertTitle,
        alertMessage,
        [{ text: "Okay", onPress: () => setAlertOpen(false) }],
        { cancelable: true, onDismiss: () => setAlertOpen(false) },
      );
    }
  }, [alertOpen,alertMessage,alertTitle,setAlertOpen]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <KeyboardAvoidingView
          style={loginStyles.background}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <View style={[loginStyles.container]}>
            <View style={loginStyles.header}>
              <ThemedText type="loginTitle">RCIANS ATTENDEASE</ThemedText>
              <ThemedText type="default">
                Discover events, check in seamlessly, and stay connected within
                our community.
              </ThemedText>
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
            <ThemedTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              variant="outlined"
              backgroundColorOverride="transparent"
            />
            <Button
              action="primary"
              variant="solid"
              size="md"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ButtonSpinner /> : <ButtonText>LOG IN</ButtonText>}
            </Button>
          </View>
          <View>
            <ThemedText
              type="default"
              style={{ fontSize: 13, textAlign: "center" }}
            >
              2025 Rogationist College - College Department
            </ThemedText>
          </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
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
