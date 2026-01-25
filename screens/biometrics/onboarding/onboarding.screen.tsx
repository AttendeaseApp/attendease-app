import { Button, ButtonText } from "@/components/ui/button"
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from "@/components/ui/checkbox"
import { CheckIcon } from "@/components/ui/icon"
import { ThemedText } from "@/components/ui/text/themed.text"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useState, useEffect } from "react"
import { StyleSheet, View, ScrollView, StatusBar } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, {
     useSharedValue,
     useAnimatedStyle,
     withTiming,
     withSpring,
     Easing,
} from "react-native-reanimated"
import { moderateScale, normalize, SCREEN } from "@/themes/responsive"

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
     const insets = useSafeAreaInsets()
     const { studentNumber } = useLocalSearchParams<{ studentNumber: string }>()

     const [currentIndex, setCurrentIndex] = useState(0)
     const [termsAccepted, setTermsAccepted] = useState(false)
     const opacity = useSharedValue(1)
     const scale = useSharedValue(1)

     const currentPage = PAGES[currentIndex]

     const isSmallDevice = SCREEN.width < 375
     const isMediumDevice = SCREEN.width >= 375 && SCREEN.width < 414

     const iconSize = isSmallDevice ? 60 : isMediumDevice ? 70 : 80
     const logoSize = isSmallDevice ? 100 : isMediumDevice ? 120 : 140
     const logoFontSize = isSmallDevice ? 60 : isMediumDevice ? 70 : 80

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
          <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
               <StatusBar barStyle="dark-content" />

               <View
                    style={[styles.header, { paddingTop: Math.max(insets.top, moderateScale(20)) }]}
               >
                    <View style={styles.progressContainer}>
                         <ThemedText type="default" style={styles.stepText}>
                              Step {currentIndex + 1} of {TOTAL_STEPS}
                         </ThemedText>
                         <View style={styles.progressBarBackground}>
                              <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
                         </View>
                    </View>
               </View>

               <ScrollView
                    contentContainerStyle={[
                         styles.scrollContent,
                         isSmallDevice && styles.scrollContentSmall,
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
               >
                    <Animated.View style={[styles.pageWrapper, animatedStyle]}>
                         {/* Icon */}
                         <View style={styles.iconContainer}>
                              {currentIndex === 0 ? (
                                   <View
                                        style={[
                                             styles.logoContainer,
                                             {
                                                  width: logoSize,
                                                  height: logoSize,
                                                  borderRadius: logoSize / 2,
                                             },
                                        ]}
                                   >
                                        <ThemedText
                                             type="loginTitle"
                                             style={[{ fontSize: logoFontSize }]}
                                        >
                                             A
                                        </ThemedText>
                                   </View>
                              ) : (
                                   <View
                                        style={[
                                             styles.iconCircle,
                                             {
                                                  backgroundColor: `${currentPage.color}15`,
                                                  width: moderateScale(160),
                                                  height: moderateScale(160),
                                                  borderRadius: moderateScale(80),
                                             },
                                        ]}
                                   >
                                        <Ionicons
                                             name={currentPage.icon as any}
                                             size={iconSize}
                                             color={currentPage.color}
                                        />
                                   </View>
                              )}
                         </View>

                         <ThemedText
                              type="loginTitle"
                              style={[styles.title, isSmallDevice && styles.titleSmall]}
                         >
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
               </ScrollView>

               <View
                    style={[
                         styles.footer,
                         { paddingBottom: Math.max(insets.bottom, moderateScale(20)) },
                    ]}
               >
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
          </SafeAreaView>
     )
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: "#ffffff",
     },
     header: {
          paddingHorizontal: moderateScale(24),
          paddingBottom: moderateScale(20),
     },
     progressContainer: {
          gap: moderateScale(12),
     },
     stepText: {
          fontSize: normalize(14),
          opacity: 0.6,
          textAlign: "center",
     },
     progressBarBackground: {
          height: moderateScale(4),
          backgroundColor: "#E5E7EB",
          borderRadius: moderateScale(2),
          overflow: "hidden",
     },
     progressBarFill: {
          height: "100%",
          backgroundColor: "#4F46E5",
          borderRadius: moderateScale(2),
     },
     scrollContent: {
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: moderateScale(24),
          paddingVertical: moderateScale(16),
     },
     scrollContentSmall: {
          paddingVertical: moderateScale(8),
     },
     pageWrapper: {
          alignItems: "center",
     },
     iconContainer: {
          marginBottom: moderateScale(32),
     },
     logoContainer: {
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F3F4F6",
     },
     iconCircle: {
          justifyContent: "center",
          alignItems: "center",
     },
     title: {
          fontSize: normalize(28),
          textAlign: "center",
          marginBottom: moderateScale(16),
          paddingHorizontal: moderateScale(20),
     },
     titleSmall: {
          fontSize: normalize(24),
          paddingHorizontal: moderateScale(12),
     },
     descriptionContainer: {
          width: "100%",
          marginTop: moderateScale(8),
     },
     description: {
          fontSize: normalize(16),
          lineHeight: normalize(24),
          textAlign: "center",
          opacity: 0.7,
          paddingHorizontal: moderateScale(12),
     },
     bulletContainer: {
          width: "100%",
          gap: moderateScale(16),
          paddingHorizontal: moderateScale(4),
     },
     bulletRow: {
          flexDirection: "row",
          alignItems: "flex-start",
     },
     bulletDotContainer: {
          paddingTop: moderateScale(6),
          marginRight: moderateScale(12),
     },
     bulletDot: {
          width: moderateScale(6),
          height: moderateScale(6),
          borderRadius: moderateScale(3),
          backgroundColor: "#4F46E5",
     },
     bulletText: {
          flex: 1,
          fontSize: normalize(15),
          lineHeight: normalize(22),
          opacity: 0.8,
     },
     checkboxWrapper: {
          width: "100%",
          marginTop: moderateScale(32),
     },
     checkboxContainer: {
          backgroundColor: "#F9FAFB",
          padding: moderateScale(16),
          borderRadius: moderateScale(12),
          borderWidth: 1,
          borderColor: "#E5E7EB",
     },
     checkboxText: {
          fontSize: normalize(14),
          lineHeight: normalize(20),
     },
     footer: {
          paddingHorizontal: moderateScale(24),
          paddingTop: moderateScale(16),
     },
     buttonRow: {
          flexDirection: "row",
          gap: moderateScale(12),
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
