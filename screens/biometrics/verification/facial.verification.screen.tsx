import { Button, ButtonText } from "@/components/ui/button"
import { ThemedText } from "@/components/ui/text/themed.text"
import { CameraView, useCameraPermissions } from "expo-camera"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useRef, useState } from "react"
import { ActivityIndicator, Alert, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import facialVerificationScreenStyles from "./facial.verification.screen.styles"

export default function EventRegistrationFacialVerificationScreen() {
     const cameraRef = useRef<CameraView>(null)
     const [permission, requestPermission] = useCameraPermissions()
     const [loading, setLoading] = useState(false)
     const { eventId } = useLocalSearchParams<{
          eventId: string
     }>()
     const router = useRouter()

     const captureAndNavigateBack = async () => {
          if (!cameraRef.current) {
               Alert.alert("Camera Error", "Camera is not ready. Please restart the app.")
               return
          }

          setLoading(true)

          try {
               const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                    skipProcessing: false,
               })

               if (!photo.uri) {
                    throw new Error("Failed to capture image.")
               }

               console.log("[Facial Verification] Captured image:", photo.uri)
               console.log("[Facial Verification] Navigating back with face parameter")
               router.replace({
                    pathname: "/(routes)/event/registration",
                    params: {
                         eventId,
                         face: photo.uri,
                    },
               })
          } catch (error: any) {
               Alert.alert("Capture Error", error.message || "Failed to capture face image")
               console.error("[Facial Verification] Error:", error)
          } finally {
               setLoading(false)
          }
     }

     if (permission === null) {
          return (
               <View style={facialVerificationScreenStyles.center}>
                    <ActivityIndicator size="large" />
                    <ThemedText type="default" style={{ marginTop: 16 }}>
                         Requesting camera permission...
                    </ThemedText>
               </View>
          )
     }

     if (!permission.granted) {
          return (
               <View style={facialVerificationScreenStyles.center}>
                    <Ionicons
                         name="camera-outline"
                         size={64}
                         color="#666"
                         style={{ marginBottom: 16 }}
                    />
                    <ThemedText
                         type="title"
                         style={[
                              facialVerificationScreenStyles.permissionText,
                              { marginBottom: 8 },
                         ]}
                    >
                         Camera Access Required
                    </ThemedText>
                    <ThemedText
                         type="default"
                         style={[
                              facialVerificationScreenStyles.permissionText,
                              { fontSize: 14, opacity: 0.7, marginBottom: 20 },
                         ]}
                    >
                         Camera access is required to verify your identity for secure event
                         registration.
                    </ThemedText>
                    <Button action="primary" variant="outline" onPress={requestPermission}>
                         <ButtonText>Grant Camera Permission</ButtonText>
                    </Button>
               </View>
          )
     }

     return (
          <View style={facialVerificationScreenStyles.container}>
               <CameraView
                    ref={cameraRef}
                    style={facialVerificationScreenStyles.camera}
                    facing="front"
               >
                    <View style={facialVerificationScreenStyles.overlay}>
                         <View style={facialVerificationScreenStyles.instructionBox}>
                              <View
                                   style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginBottom: 8,
                                   }}
                              >
                                   <Ionicons
                                        name="shield-checkmark"
                                        size={20}
                                        color="#fff"
                                        style={{ marginRight: 8 }}
                                   />
                                   <ThemedText
                                        type="default"
                                        colorVariant="white"
                                        style={{ fontSize: 12, opacity: 0.9 }}
                                   >
                                        Identity Verification
                                   </ThemedText>
                              </View>
                              <ThemedText
                                   type="defaultSemiBold"
                                   colorVariant="white"
                                   style={{ fontSize: 16 }}
                              >
                                   Align your face inside the frame and tap to capture your photo
                                   for verification.
                              </ThemedText>
                         </View>

                         <View style={facialVerificationScreenStyles.faceFrameContainer}>
                              <View style={facialVerificationScreenStyles.faceFrame} />
                         </View>

                         <View style={facialVerificationScreenStyles.controls}>
                              {loading ? (
                                   <View style={{ alignItems: "center", gap: 12 }}>
                                        <ActivityIndicator size="large" color="#0D9488" />
                                        <ThemedText
                                             type="default"
                                             style={{ color: "#0D9488", fontWeight: "600" }}
                                        >
                                             Processing image...
                                        </ThemedText>
                                   </View>
                              ) : (
                                   <>
                                        <Button
                                             action="primary"
                                             variant="solid"
                                             size="lg"
                                             onPress={captureAndNavigateBack}
                                             style={{ width: "100%" }}
                                        >
                                             <Ionicons
                                                  name="camera"
                                                  size={20}
                                                  color="#fff"
                                                  style={{ marginRight: 8 }}
                                             />
                                             <ButtonText>Capture & Verify</ButtonText>
                                        </Button>

                                        <Button
                                             action="secondary"
                                             variant="outline"
                                             size="md"
                                             onPress={() => router.back()}
                                             style={{ width: "100%", marginTop: 12 }}
                                        >
                                             <ButtonText>Cancel</ButtonText>
                                        </Button>

                                        <View
                                             style={{
                                                  flexDirection: "row",
                                                  alignItems: "flex-start",
                                                  marginTop: 12,
                                             }}
                                        >
                                             <Ionicons
                                                  name="information-circle-outline"
                                                  size={16}
                                                  color="#666"
                                                  style={{ marginRight: 8, marginTop: 2 }}
                                             />
                                             <ThemedText
                                                  type="default"
                                                  style={{
                                                       flex: 1,
                                                       fontSize: 13,
                                                       lineHeight: 18,
                                                       opacity: 0.7,
                                                  }}
                                             >
                                                  Your face will be verified against your registered
                                                  biometric data for secure event check-in.
                                             </ThemedText>
                                        </View>
                                   </>
                              )}
                         </View>
                    </View>
               </CameraView>
          </View>
     )
}
