import { Button, ButtonText } from "@/components/ui/button";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/text/themed.text";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

const TOTAL_STEPS = 3;

const PAGES = [
  {
    key: "welcome",
    icon: "school-outline",
    color: "#000000",
    title: "RCIANS ATTENDEASE",
    description:
      "Before proceeding, we'll guide you through a short setup process.",
  },
  {
    key: "privacy",
    icon: "shield-checkmark-outline",
    color: "#2196F3",
    title: "Your Privacy Matters",
    description: [
      "Facial biometrics are required to verify your identity during event registration.",
      "Facial images are processed only to generate a secure facial encoding and are immediately discarded.",
      "Only the facial encoding is stored and used solely for verification purposes.",
      "Biometric data is protected in accordance with the Philippine Data Privacy Act of 2012 (RA 10173).",
      "You may withdraw consent at any time, and your biometric data will be permanently deleted.",
    ],
  },
  {
    key: "face",
    icon: "scan-outline",
    color: "#FF9800",
    title: "Facial Registration",
    description:
      "This is a one-time setup to keep you verified during event registrations. Please ensure you are in a well-lit area.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();

  const { studentNumber } = useLocalSearchParams<{ studentNumber: string }>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const currentPage = PAGES[currentIndex];
  const handleNext = () => {
    if (currentIndex === 1 && !termsAccepted) return;

    if (currentIndex < TOTAL_STEPS - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.replace({
        pathname: "/(routes)/(biometrics)/registration",
        params: { studentNumber: studentNumber || "" },
      });
    }
  };

  const handleBack = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="default">
          Step {currentIndex + 1} of {TOTAL_STEPS}
        </ThemedText>
      </View>
      <View style={styles.center}>
        <View style={styles.page}>
          <View style={styles.iconWrapper}>
            {currentIndex === 0 ? (
              <ThemedText type="loginTitle" style={styles.logoText}>
                at
              </ThemedText>
            ) : (
              <Ionicons
                name={currentPage.icon as any}
                size={120}
                color={currentPage.color}
              />
            )}
          </View>
          <ThemedText type="loginTitle" style={styles.title}>
            {currentPage.title}
          </ThemedText>

          {/* DESCRIPTION */}
          {currentIndex === 1 ? (
            <View style={styles.bulletContainer}>
              {(currentPage.description as string[]).map((item, index) => (
                <View key={index} style={styles.bulletRow}>
                  <ThemedText style={styles.bulletDot}>•</ThemedText>
                  <ThemedText type="default" style={styles.bulletText}>
                    {item}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText type="default" style={[styles.text, styles.centerText]}>
              {currentPage.description as string}
            </ThemedText>
          )}

          {/* CONSENT */}
          {currentIndex === 1 && (
            <View style={styles.checkboxWrapper}>
              <Checkbox
                isChecked={termsAccepted}
                onChange={setTermsAccepted}
                value="sm"
              >
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel>
                  <ThemedText type="default">
                    I have read and agree to the Terms & Privacy Policy, and I
                    consent to the collection of my facial biometrics for
                    verification purposes.
                  </ThemedText>
                </CheckboxLabel>
              </Checkbox>
            </View>
          )}
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {currentIndex > 0 && (
            <Button
              action="secondary"
              onPress={handleBack}
              style={styles.backButton}
            >
              <ButtonText>Back</ButtonText>
            </Button>
          )}

          <Button
            action="primary"
            variant="solid"
            onPress={handleNext}
            disabled={currentIndex === 1 && !termsAccepted}
            style={[
              currentIndex === 0 ? styles.fullWidthButton : styles.nextButton,
              currentIndex === 1 && !termsAccepted && styles.disabledButton,
            ]}
          >
            <ButtonText>
              {currentIndex === TOTAL_STEPS - 1 ? "Continue" : "Next"}
            </ButtonText>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf9f5",
  },
  header: {
    paddingTop: 60,
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
  },
  page: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  iconWrapper: { marginBottom: 12 },
  logoText: {
    fontSize: 150,
    textAlign: "center",
  },
  title: {
    textAlign: "center",
    marginVertical: 16,
  },
  text: {
    opacity: 0.85,
    lineHeight: 22,
  },
  centerText: { textAlign: "center" },

  bulletContainer: { width: "100%", marginTop: 8 },
  bulletRow: { flexDirection: "row", marginBottom: 10 },
  bulletDot: { marginRight: 8, lineHeight: 22 },
  bulletText: {
    flex: 1,
    lineHeight: 22,
    opacity: 0.85,
  },
  checkboxWrapper: { marginTop: 24 },
  footer: { paddingHorizontal: 20, paddingBottom: 30 },
  buttonRow: { flexDirection: "row", gap: 12 },
  backButton: { flex: 1 },
  nextButton: { flex: 2 },
  fullWidthButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.3,
  },
});
