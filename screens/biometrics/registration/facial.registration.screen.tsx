import { Button, ButtonText } from "@/components/ui/button"
import { ThemedText } from "@/components/ui/text/themed.text"
import { useCaptureProgress } from "@/hooks/biometrics/registration/useCaptureProgress"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import { biometricsRegistrationService } from "@/server/service/api/biometrics/registration/biometrics-registration-service"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CameraView, useCameraPermissions } from "expo-camera"
import { useRouter } from "expo-router"
import React, { useEffect, useRef, useCallback } from "react"
import { View, Alert, AlertButton, BackHandler } from "react-native"
import { BiometricsResult } from "@/domain/interface/biometrics/registration/biometrics.registration.result.response"
import registrationScreenStyles from "./registration.screen.styles"

export default function OneTimeFacialRegistrationScreen() {
     const router = useRouter()
     const cameraRef = useRef<CameraView | null>(null)
     const [permission, requestPermission] = useCameraPermissions()

     const { isLoggedIn } = useAuthStatus()
     const {
          isProcessing,
          setIsProcessing,
          capturedImages,
          setCapturedImages,
          currentStep,
          setCurrentStep,
          getInstructionText,
          resetCapture,
          REQUIRED_IMAGES,
     } = useCaptureProgress()

     const [alertOpen, setAlertOpen] = React.useState(false)
     const [alertTitle, setAlertTitle] = React.useState("")
     const [alertMessage, setAlertMessage] = React.useState("")
     const [alertActions, setAlertActions] = React.useState<
          { label: string; action?: () => void; variant?: "solid" | "outline" }[]
     >([])

     const showAlert = useCallback(
          (title: string, message: string, actions: typeof alertActions = [{ label: "OK" }]) => {
               setAlertTitle(title)
               setAlertMessage(message)
               setAlertActions(actions)
               setAlertOpen(true)
          },
          []
     )

     const skipFacialRegistration = async () => {
          showAlert(
               "Skip Facial Registration?",
               "You can skip this step for now, but facial authentication may be required later to access certain features.",
               [
                    {
                         label: "Cancel",
                         variant: "outline",
                    },
                    {
                         label: "Skip",
                         action: async () => {
                              await AsyncStorage.setItem(
                                   "skippedFacialRegistration",
                                   Date.now().toString()
                              )
                              router.replace("/(tabs)")
                         },
                    },
               ]
          )
     }

     useEffect(() => {
          if (alertOpen) {
               const buttons: AlertButton[] = alertActions.map((btn) => ({
                    text: btn.label,
                    onPress: () => {
                         btn.action?.()
                         setAlertOpen(false)
                    },
                    style: btn.variant === "outline" ? "cancel" : "default",
               }))
               Alert.alert(alertTitle, alertMessage, buttons, {
                    cancelable: true,
                    onDismiss: () => setAlertOpen(false),
               })
          }
     }, [alertOpen, alertTitle, alertMessage, alertActions])

     useEffect(() => {
          const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
               showAlert(
                    "Registration Required",
                    "You must complete facial registration or skip it to continue.",
                    [
                         {
                              label: "Continue Registration",
                              variant: "outline",
                         },
                         {
                              label: "Skip",
                              action: async () => {
                                   await AsyncStorage.setItem(
                                        "skippedFacialRegistration",
                                        Date.now().toString()
                                   )
                                   router.replace("/(tabs)")
                              },
                         },
                         {
                              label: "Logout",
                              action: async () => {
                                   await AsyncStorage.multiRemove([
                                        "authToken",
                                        "facialRegistrationComplete",
                                        "studentNumber",
                                   ])
                                   router.replace("/(routes)/login")
                              },
                         },
                    ]
               )

               return true
          })

          return () => backHandler.remove()
     }, [router, showAlert])

     const captureImage = async () => {
          if (!cameraRef.current || isProcessing) return

          if (!isLoggedIn) {
               showAlert("AUTHENTICATION REQUIRED", "Please login to register your face.")
               return
          }

          setIsProcessing(true)

          try {
               const photo = await cameraRef.current.takePictureAsync({
                    quality: 1.0,
                    skipProcessing: false,
                    shutterSound: false,
                    imageType: "jpg",
               })

               if (!photo) {
                    showAlert("Error", "Failed to capture image")
                    setIsProcessing(false)
                    return
               }

               console.log(`Captured image ${capturedImages.length + 1}:`, {
                    uri: photo.uri.substring(0, 50),
                    width: photo.width,
                    height: photo.height,
               })

               const newImages = [...capturedImages, photo.uri]
               setCapturedImages(newImages)
               setCurrentStep(currentStep + 1)

               setTimeout(() => {
                    if (newImages.length >= REQUIRED_IMAGES) {
                         sendImagesToServer(newImages)
                    } else {
                         setIsProcessing(false)
                    }
               }, 600)
          } catch (error: any) {
               console.error("Face capture error:", error)
               showAlert("Error", error.message || "Failed to capture image")
               setIsProcessing(false)
          }
     }

     const sendImagesToServer = async (images: string[]) => {
          setIsProcessing(true)
          try {
               const result: BiometricsResult = await biometricsRegistrationService(images)

               if (result.success) {
                    await AsyncStorage.setItem("facialRegistrationComplete", "true")

                    showAlert("Success", result.message ?? "Face registered successfully!", [
                         {
                              label: "Okay",
                              action: () => {
                                   router.replace("/(tabs)")
                                   resetCapture()
                              },
                         },
                    ])
               } else {
                    showAlert(
                         "Registration Failed",
                         result.message ?? "Face registration failed. Please try again.",
                         [
                              {
                                   label: "RETRY",
                                   action: () => {
                                        resetCapture()
                                   },
                              },
                         ]
                    )
               }
          } catch (error: any) {
               console.error("Face registration error:", error)
               showAlert(
                    "Error",
                    error.message ||
                         "Something went wrong during face registration. Please check your network connection.",
                    [
                         {
                              label: "RETRY",
                              action: () => {
                                   resetCapture()
                              },
                         },
                    ]
               )
          } finally {
               setIsProcessing(false)
          }
     }

     if (!permission) {
          return (
               <View style={registrationScreenStyles.center}>
                    <Ionicons
                         name="camera-outline"
                         size={64}
                         color="#666"
                         style={{ marginBottom: 16 }}
                    />
                    <ThemedText type="default" style={registrationScreenStyles.permissionText}>
                         Requesting camera permission...
                    </ThemedText>
               </View>
          )
     }

     if (!permission.granted) {
          return (
               <View style={registrationScreenStyles.center}>
                    <Ionicons
                         name="camera-outline"
                         size={64}
                         color="#666"
                         style={{ marginBottom: 16 }}
                    />
                    <ThemedText
                         type="title"
                         style={[registrationScreenStyles.permissionText, { marginBottom: 8 }]}
                    >
                         Camera Access is Required
                    </ThemedText>
                    <ThemedText
                         type="default"
                         style={[
                              registrationScreenStyles.permissionText,
                              { fontSize: 14, opacity: 0.7 },
                         ]}
                    >
                         We need camera access to register your face for secure authentication. This
                         is a one-time setup required for all users.
                    </ThemedText>

                    <Button
                         action="primary"
                         variant="outline"
                         onPress={requestPermission}
                         style={{ marginTop: 20 }}
                    >
                         <ButtonText>Grant Camera Permission</ButtonText>
                    </Button>
               </View>
          )
     }

     const isCaptureComplete = capturedImages.length >= REQUIRED_IMAGES
     const progressPercentage = (capturedImages.length / REQUIRED_IMAGES) * 100

     return (
          <View style={registrationScreenStyles.container}>
               <CameraView style={registrationScreenStyles.camera} facing="front" ref={cameraRef}>
                    <View style={registrationScreenStyles.overlay}>
                         {/*instruction card*/}
                         <View style={registrationScreenStyles.instructionBox}>
                              <View
                                   style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginBottom: 8,
                                   }}
                              >
                                   <Ionicons
                                        name="information-circle"
                                        size={20}
                                        color="#fff"
                                        style={{ marginRight: 8 }}
                                   />
                                   <ThemedText
                                        type="default"
                                        colorVariant="white"
                                        style={{ fontSize: 12, opacity: 0.9 }}
                                   >
                                        Step {currentStep + 1} of {REQUIRED_IMAGES}
                                   </ThemedText>
                              </View>
                              <ThemedText
                                   type="default"
                                   colorVariant="white"
                                   style={{ fontSize: 16, fontWeight: "600" }}
                              >
                                   {getInstructionText()}
                              </ThemedText>

                              {/*progress bar*/}
                              <View
                                   style={{
                                        marginTop: 12,
                                        height: 4,
                                        backgroundColor: "rgba(255,255,255,0.3)",
                                        borderRadius: 2,
                                        overflow: "hidden",
                                   }}
                              >
                                   <View
                                        style={{
                                             height: "100%",
                                             backgroundColor: "#4ade80",
                                             width: `${progressPercentage}%`,
                                        }}
                                   />
                              </View>
                         </View>

                         <View style={registrationScreenStyles.faceFrameContainer}>
                              <View style={registrationScreenStyles.faceFrame} />
                         </View>

                         <View style={registrationScreenStyles.progressIndicators}>
                              {[...Array(REQUIRED_IMAGES)].map((_, index) => (
                                   <View
                                        key={index}
                                        style={[
                                             registrationScreenStyles.progressDot,
                                             index < capturedImages.length &&
                                                  registrationScreenStyles.progressDotActive,
                                             {
                                                  width: index < capturedImages.length ? 32 : 12,
                                                  backgroundColor:
                                                       index < capturedImages.length
                                                            ? "#4ade80"
                                                            : "rgba(255,255,255,0.3)",
                                             },
                                        ]}
                                   >
                                        {index < capturedImages.length && (
                                             <Ionicons name="checkmark" size={14} color="#fff" />
                                        )}
                                   </View>
                              ))}
                         </View>
                    </View>
               </CameraView>

               {/*bottom controls*/}
               <View style={registrationScreenStyles.controls}>
                    <View style={registrationScreenStyles.buttonGroup}>
                         {capturedImages.length > 0 && capturedImages.length < REQUIRED_IMAGES && (
                              <Button
                                   action="secondary"
                                   onPress={resetCapture}
                                   disabled={isProcessing}
                                   style={{ flex: 1 }}
                              >
                                   <ButtonText>Reset</ButtonText>
                              </Button>
                         )}

                         <Button
                              action="primary"
                              variant="solid"
                              size="lg"
                              onPress={captureImage}
                              disabled={isProcessing || isCaptureComplete}
                              style={{
                                   flex:
                                        capturedImages.length > 0 &&
                                        capturedImages.length < REQUIRED_IMAGES
                                             ? 2
                                             : 1,
                              }}
                         >
                              <ButtonText>
                                   {isCaptureComplete
                                        ? "Processing..."
                                        : `Capture (${capturedImages.length}/${REQUIRED_IMAGES})`}
                              </ButtonText>
                         </Button>
                    </View>

                    <View style={{ marginTop: 12, alignItems: "center" }}>
                         <Button
                              action="primary"
                              variant="outline"
                              onPress={skipFacialRegistration}
                              size="lg"
                         >
                              <ButtonText>Skip Facial Registration</ButtonText>
                         </Button>
                    </View>

                    {/*help text*/}
                    <View
                         style={{
                              flexDirection: "row",
                              alignItems: "flex-start",
                              marginTop: 12,
                         }}
                    >
                         <Ionicons
                              name="bulb-outline"
                              size={16}
                              color="#666"
                              style={{ marginRight: 8, marginTop: 2 }}
                         />
                         <ThemedText
                              style={[
                                   registrationScreenStyles.helpText,
                                   { flex: 1, fontSize: 13, lineHeight: 18 },
                              ]}
                              type="default"
                         >
                              {isCaptureComplete
                                   ? "All images captured! Processing your biometric profile..."
                                   : capturedImages.length === 0
                                     ? "Position your face within the frame and tap Capture to begin."
                                     : "Follow the instruction above and capture the next image."}
                         </ThemedText>
                    </View>
               </View>
          </View>
     )
}
