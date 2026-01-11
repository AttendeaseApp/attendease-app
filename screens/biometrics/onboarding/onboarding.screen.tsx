import { Button, ButtonText } from "@/components/ui/button"
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from "@/components/ui/checkbox"
import { CheckIcon } from "@/components/ui/icon"
import { ThemedText } from "@/components/ui/text/themed.text"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useState, useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
     useSharedValue,
     useAnimatedStyle,
     withTiming,
     withSpring,
     Easing,
} from "react-native-reanimated"

const TOTAL_STEPS = 3

const PAGES = [
     {
          key: "welcome",
          icon: "school-outline",
          color: "#000000",
          title: "RCIANS ATTENDEASE",
          description: "Before proceeding, we'll guide you through a short setup process.",
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
]

export default function OnboardingScreen() {
     const router = useRouter()
     const { studentNumber } = useLocalSearchParams<{ studentNumber: string }>()

     const [currentIndex, setCurrentIndex] = useState(0)
     const [termsAccepted, setTermsAccepted] = useState(false)
     const opacity = useSharedValue(1)
     const scale = useSharedValue(1)

     const currentPage = PAGES[currentIndex]

     useEffect(() => {
          opacity.value = withTiming(1, { duration: 400 })
          scale.value = withSpring(1, { damping: 15, stiffness: 100 })
     }, [currentIndex, opacity, scale])

     const handleNext = () => {
          if (currentIndex === 1 && !termsAccepted) return

          opacity.value = withTiming(0, { duration: 200 })
          scale.value = withTiming(0.95, { duration: 200 })

          setTimeout(() => {
               if (currentIndex < TOTAL_STEPS - 1) {
                    setCurrentIndex((prev) => prev + 1)
               } else {
                    router.replace({
                         pathname: "/(routes)/(biometrics)/registration",
                         params: { studentNumber: studentNumber || "" },
                    })
               }
          }, 200)
     }

     const handleBack = () => {
          if (currentIndex === 0) return

          opacity.value = withTiming(0, { duration: 200 })
          scale.value = withTiming(0.95, { duration: 200 })

          setTimeout(() => {
               setCurrentIndex((prev) => prev - 1)
          }, 200)
     }

     const animatedStyle = useAnimatedStyle(() => ({
          opacity: opacity.value,
          transform: [{ scale: scale.value }],
     }))

     const progressBarStyle = useAnimatedStyle(() => ({
          width: withTiming(`${((currentIndex + 1) / TOTAL_STEPS) * 100}%`, {
               duration: 300,
               easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
     }))

     return (
          <View style={styles.container}>
               <View style={styles.header}>
                    <View style={styles.progressContainer}>
                         <ThemedText type="default" style={styles.stepText}>
                              Step {currentIndex + 1} of {TOTAL_STEPS}
                         </ThemedText>
                         <View style={styles.progressBarBackground}>
                              <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
                         </View>
                    </View>
               </View>

               {/* Content */}
               <View style={styles.contentContainer}>
                    <Animated.View style={[styles.pageWrapper, animatedStyle]}>
                         {/* Icon */}
                         <View style={styles.iconContainer}>
                              {currentIndex === 0 ? (
                                   <View style={styles.logoContainer}>
                                        <ThemedText type="loginTitle" style={styles.logoText}>
                                             at
                                        </ThemedText>
                                   </View>
                              ) : (
                                   <View
                                        style={[
                                             styles.iconCircle,
                                             { backgroundColor: `${currentPage.color}15` },
                                        ]}
                                   >
                                        <Ionicons
                                             name={currentPage.icon as any}
                                             size={80}
                                             color={currentPage.color}
                                        />
                                   </View>
                              )}
                         </View>

                         <ThemedText type="loginTitle" style={styles.title}>
                              {currentPage.title}
                         </ThemedText>

                         <View style={styles.descriptionContainer}>
                              {currentIndex === 1 ? (
                                   <View style={styles.bulletContainer}>
                                        {(currentPage.description as string[]).map(
                                             (item, index) => (
                                                  <View key={index} style={styles.bulletRow}>
                                                       <View style={styles.bulletDotContainer}>
                                                            <View style={styles.bulletDot} />
                                                       </View>
                                                       <ThemedText
                                                            type="default"
                                                            style={styles.bulletText}
                                                       >
                                                            {item}
                                                       </ThemedText>
                                                  </View>
                                             )
                                        )}
                                   </View>
                              ) : (
                                   <ThemedText type="default" style={styles.description}>
                                        {currentPage.description as string}
                                   </ThemedText>
                              )}
                         </View>

                         {currentIndex === 1 && (
                              <View style={styles.checkboxWrapper}>
                                   <View style={styles.checkboxContainer}>
                                        <Checkbox
                                             isChecked={termsAccepted}
                                             onChange={setTermsAccepted}
                                             value="sm"
                                        >
                                             <CheckboxIndicator>
                                                  <CheckboxIcon as={CheckIcon} />
                                             </CheckboxIndicator>
                                             <CheckboxLabel>
                                                  <ThemedText
                                                       type="default"
                                                       style={styles.checkboxText}
                                                  >
                                                       I have read and agree to the Terms & Privacy
                                                       Policy, and I consent to the collection of my
                                                       facial biometrics for verification purposes.
                                                  </ThemedText>
                                             </CheckboxLabel>
                                        </Checkbox>
                                   </View>
                              </View>
                         )}
                    </Animated.View>
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
                              ]}
                         >
                              <ButtonText>
                                   {currentIndex === TOTAL_STEPS - 1 ? "Continue" : "Next"}
                              </ButtonText>
                         </Button>
                    </View>
               </View>
          </View>
     )
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: "#ffffff",
     },
     header: {
          paddingTop: 60,
          paddingHorizontal: 24,
          paddingBottom: 20,
     },
     progressContainer: {
          gap: 12,
     },
     stepText: {
          fontSize: 14,
          opacity: 0.6,
          textAlign: "center",
     },
     progressBarBackground: {
          height: 4,
          backgroundColor: "#E5E7EB",
          borderRadius: 2,
          overflow: "hidden",
     },
     progressBarFill: {
          height: "100%",
          backgroundColor: "#4F46E5",
          borderRadius: 2,
     },
     contentContainer: {
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
     },
     pageWrapper: {
          alignItems: "center",
     },
     iconContainer: {
          marginBottom: 32,
     },
     logoContainer: {
          width: 140,
          height: 140,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F3F4F6",
          borderRadius: 70,
     },
     logoText: {
          fontSize: 80,
     },
     iconCircle: {
          width: 160,
          height: 160,
          borderRadius: 80,
          justifyContent: "center",
          alignItems: "center",
     },
     title: {
          fontSize: 28,
          textAlign: "center",
          marginBottom: 16,
          paddingHorizontal: 20,
     },
     descriptionContainer: {
          width: "100%",
          marginTop: 8,
     },
     description: {
          fontSize: 16,
          lineHeight: 24,
          textAlign: "center",
          opacity: 0.7,
          paddingHorizontal: 12,
     },
     bulletContainer: {
          width: "100%",
          gap: 16,
          paddingHorizontal: 4,
     },
     bulletRow: {
          flexDirection: "row",
          alignItems: "flex-start",
     },
     bulletDotContainer: {
          paddingTop: 6,
          marginRight: 12,
     },
     bulletDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#4F46E5",
     },
     bulletText: {
          flex: 1,
          fontSize: 15,
          lineHeight: 22,
          opacity: 0.8,
     },
     checkboxWrapper: {
          width: "100%",
          marginTop: 32,
     },
     checkboxContainer: {
          backgroundColor: "#F9FAFB",
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#E5E7EB",
     },
     checkboxText: {
          fontSize: 14,
          lineHeight: 20,
     },
     footer: {
          paddingHorizontal: 24,
          paddingBottom: 40,
     },
     buttonRow: {
          flexDirection: "row",
          gap: 12,
     },
     backButton: {
          flex: 1,
     },
     nextButton: {
          flex: 2,
     },
     fullWidthButton: {
          flex: 1,
     },
})
