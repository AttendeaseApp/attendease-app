import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useCallback, useEffect, useState, useRef } from "react"
import {
     StyleSheet,
     StatusBar,
     ActivityIndicator,
     RefreshControl,
     ScrollView,
     View,
     Alert,
} from "react-native"
import { Button, ButtonText } from "@/components/ui/button"
import { ThemedText } from "@/components/ui/text/themed.text"
import { Event } from "@/domain/interface/event/session/event.session"
import { useEventRegistration } from "@/hooks/events/registration/useEventRegistration"
import { getEventById } from "@/server/service/api/event/get-event-by-id"
import { formatDateTime } from "@/utils/date-time-formatter-util"
import { SafeAreaView } from "react-native-safe-area-context"
import { verifyRegistrationLocation } from "@/server/service/api/geolocation/verify-registration-location"
import { checkEventRegistrationStatus } from "@/server/service/api/event/registration/check-event-registration-status"
import { useAttendanceTracking } from "@/store/attendance/tracking/attendance.tracking.context"
import { useEventStatusMonitoring } from "@/hooks/events/status/useEventStatus"
import { EventStatus } from "@/domain/enums/event/status/event.status.enum"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useLocationVerification } from "./hooks/useLocationVerification"
import { useAutoUpgradePolling } from "./hooks/useAutoUpgradePolling"
import { useRegistrationStatus } from "./hooks/useRegistrationStatus"
import {
     getRegistrationConfig,
     shouldRequireFacialVerification,
     shouldStartAttendanceTracking,
     checkBiometricsRegistration,
     showBiometricRegistrationAlert,
     getButtonText,
     isRegistrationDisabled,
     handlePostRegistration,
} from "./utils/registration.utils"
import { normalize, moderateScale, spacing } from "@/themes/responsive"
import { Ionicons } from "@expo/vector-icons"
import { AttendanceStatusEnum } from "@/domain/enums/attendance/status/attendance.status.enum"
import { verifyVenueLocationWithAutoUpgrade } from "@/server/service/api/geolocation/verify-venue-location-with-auto-upgrade"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"

export default function EventDetailsRegistrationScreen() {
     const router = useRouter()
     const params = useLocalSearchParams<{
          eventId: string
          registrationLocationId?: string
          venueLocationId?: string
          face?: string
     }>()
     const eventId = params.eventId
     const face = params.face

     const { trackingState, startTracking } = useAttendanceTracking()

     const [eventData, setEventData] = useState<Event | null>(null)
     const [loadingEvent, setLoadingEvent] = useState(true)
     const [refreshing, setRefreshing] = useState(false)

     const registrationInProgressRef = useRef(false)
     const faceProcessedRef = useRef(false)

     const isTrackingThisEvent = trackingState.isTracking && trackingState.eventId === eventId

     const {
          latitude,
          longitude,
          loading,
          locationLoading,
          register: performRegistration,
     } = useEventRegistration(eventId || "")

     const getStatusGradient = (status: string) => {
          switch (status) {
               case EventStatus.ONGOING:
                    return ["#10B98160", "#10B98140", "#10B98120", "transparent"] as const
               case EventStatus.REGISTRATION:
                    return ["#F59E0B60", "#F59E0B40", "#F59E0B20", "transparent"] as const
               case EventStatus.UPCOMING:
                    return ["#3B82F660", "#3B82F640", "#3B82F620", "transparent"] as const
               case EventStatus.CANCELLED:
                    return ["#EF444460", "#EF444440", "#EF444420", "transparent"] as const
               case EventStatus.CONCLUDED:
               case EventStatus.FINALIZED:
                    return ["#6B728060", "#6B728040", "#6B728020", "transparent"] as const
               default:
                    return ["#6B728060", "#6B728040", "#6B728020", "transparent"] as const
          }
     }

     // EVENT CONFIGS
     const config = getRegistrationConfig(eventData)
     const requireFace = shouldRequireFacialVerification(config)
     const shouldStartTracking = shouldStartAttendanceTracking(config, eventData)
     const shouldMonitorEventStatus = eventData?.eventStatus === EventStatus.ONGOING

     // HOOKS
     const { locationStatus, verifyingLocation, setLocationStatus } = useLocationVerification(
          eventId,
          latitude,
          longitude
     )

     const { isPollingForUpgrade, startAutoUpgradePolling, stopAutoUpgradePolling } =
          useAutoUpgradePolling(
               eventId,
               latitude,
               longitude,
               shouldStartTracking,
               eventData,
               startTracking,
               (status) => setRegistrationStatus(status)
          )

     const { registrationStatus, checkingStatus, setRegistrationStatus } = useRegistrationStatus({
          eventId,
          eventData,
          isPollingForUpgrade,
          isTrackingThisEvent,
          startAutoUpgradePolling,
          startTracking,
     })

     const { eventState: liveEventState } = useEventStatusMonitoring(
          eventId,
          shouldMonitorEventStatus
     )

     const fetchEventData = useCallback(async () => {
          if (!eventId) return

          try {
               setLoadingEvent(true)
               const event = await getEventById(eventId)
               setEventData(event)
          } catch (error) {
               console.error("Failed to fetch event:", error)
               Alert.alert("Error", "Failed to load event details")
          } finally {
               setLoadingEvent(false)
          }
     }, [eventId])

     useEffect(() => {
          fetchEventData()
     }, [fetchEventData])

     // MONITOR EVENTS STATUS
     useEffect(() => {
          if (liveEventState) {
               console.log("[EventDetails] Live event status:", liveEventState.statusMessage)

               if (liveEventState.eventHasEnded && eventData) {
                    setEventData((prev) =>
                         prev ? { ...prev, eventStatus: EventStatus.CONCLUDED } : null
                    )
                    Alert.alert("Event Ended", "This event has concluded.")
               } else if (
                    liveEventState.eventIsOngoing &&
                    eventData?.eventStatus !== EventStatus.ONGOING
               ) {
                    setEventData((prev) =>
                         prev ? { ...prev, eventStatus: EventStatus.ONGOING } : null
                    )
                    Alert.alert("Event Started", "This event is now ongoing!")
               }
          }
     }, [liveEventState, eventData])

     useEffect(() => {
          return () => {
               stopAutoUpgradePolling()
          }
     }, [stopAutoUpgradePolling])

     // REFRESH
     const onRefresh = useCallback(async () => {
          setRefreshing(true)
          try {
               await Promise.all([
                    fetchEventData(),
                    checkEventRegistrationStatus(eventId).then(setRegistrationStatus),
               ])
               if (latitude !== null && longitude !== null) {
                    const response = await verifyRegistrationLocation(eventId, latitude, longitude)
                    setLocationStatus({
                         isInside: response.inside,
                         message: response.message,
                    })
               }
          } catch (error) {
               console.error("Failed to refresh:", error)
          } finally {
               setRefreshing(false)
          }
     }, [eventId, fetchEventData, latitude, longitude, setLocationStatus, setRegistrationStatus])

     // REGISTRATION HANDLER
     const handleRegister = useCallback(
          async (faceData?: string) => {
               if (registrationInProgressRef.current) {
                    console.log("[Registration] Already in progress, skipping...")
                    return
               }

               if (locationLoading || latitude === null || longitude === null) {
                    Alert.alert(
                         "Location Required",
                         "Waiting for location data. Please ensure location services are enabled."
                    )
                    return
               }

               if (requireFace && !faceData) {
                    console.log(
                         "[Registration] Facial verification required, checking biometric status..."
                    )

                    const hasBiometrics = await checkBiometricsRegistration()

                    if (!hasBiometrics) {
                         showBiometricRegistrationAlert(async () => {
                              const studentNumber = await AsyncStorage.getItem("studentNumber")
                              router.push({
                                   pathname: "/(routes)/(biometrics)/onboarding",
                                   params: {
                                        studentNumber: studentNumber || "",
                                        returnTo: "event",
                                        eventId: eventId,
                                   },
                              })
                         })
                         return
                    }

                    console.log("[Registration] Navigating to biometric verification screen...")
                    router.push({
                         pathname: "/(routes)/(biometrics)/verification",
                         params: { eventId },
                    })
                    return
               }

               console.log("[Registration] Starting registration process...")
               console.log("[Registration] Face data provided:", !!faceData)

               registrationInProgressRef.current = true

               performRegistration(faceData || null, async () => {
                    await handlePostRegistration(
                         eventId,
                         config.strictLocationValidation,
                         shouldStartTracking,
                         eventData,
                         startAutoUpgradePolling,
                         startTracking,
                         setRegistrationStatus
                    )
                    registrationInProgressRef.current = false
               })
          },
          [
               locationLoading,
               latitude,
               longitude,
               requireFace,
               router,
               eventId,
               performRegistration,
               config.strictLocationValidation,
               shouldStartTracking,
               startAutoUpgradePolling,
               eventData,
               startTracking,
               setRegistrationStatus,
          ]
     )

     useEffect(() => {
          if (
               face &&
               !faceProcessedRef.current &&
               latitude !== null &&
               longitude !== null &&
               !loading &&
               !checkingStatus &&
               !registrationInProgressRef.current
          ) {
               console.log("[Registration] Face parameter detected:", face)
               console.log("[Registration] Triggering registration with face data...")

               faceProcessedRef.current = true
               setTimeout(() => {
                    handleRegister(face)
               }, 100)
          }
     }, [face, latitude, longitude, loading, checkingStatus, handleRegister])

     useEffect(() => {
          console.log("[Registration] Event ID changed, resetting face processed flag")
          faceProcessedRef.current = false
     }, [eventId])

     // REGISTRATION BUTTON RENDERER
     const renderRegistrationButton = () => {
          const isRegistered = registrationStatus?.registered ?? false
          const isPartiallyRegistered =
               registrationStatus?.attendanceStatus === AttendanceStatusEnum.PARTIALLY_REGISTERED
          if (isPartiallyRegistered && config.strictLocationValidation) {
               return (
                    <View style={styles.twoStepButtonContainer}>
                         {/* Step Progress Indicator */}
                         <View style={styles.stepProgressBar}>
                              <View style={styles.stepCompleted}>
                                   <Ionicons name="checkmark-circle" size={16} color="#d97757" />
                                   <ThemedText type="caption" style={styles.stepText}>
                                        Step 1
                                   </ThemedText>
                              </View>
                              <View style={styles.stepConnector} />
                              <View style={styles.stepPending}>
                                   <View style={styles.stepCircle} />
                                   <ThemedText type="caption" style={styles.stepTextPending}>
                                        Step 2
                                   </ThemedText>
                              </View>
                         </View>

                         {/* Venue Registration Button */}
                         <Button
                              variant="solid"
                              onPress={handleManualVenueRegistration}
                              disabled={loading || verifyingLocation}
                         >
                              {loading || verifyingLocation ? (
                                   <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                   <>
                                        <ButtonText>Complete Registration at Venue</ButtonText>
                                   </>
                              )}
                         </Button>
                    </View>
               )
          }

          // FULLY REGISTERED
          if (isRegistered) {
               return (
                    <Button variant="solid" disabled>
                         <ButtonText>REGISTERED</ButtonText>
                         <Ionicons
                              name="checkmark-outline"
                              size={18}
                              color="#FFFFFF"
                              style={{ marginRight: 8 }}
                         />
                    </Button>
               )
          }

          // INITIAL
          const buttonText = getButtonText(loading, registrationInProgressRef.current, requireFace)
          const isDisabled = isRegistrationDisabled(
               isRegistered,
               eventData?.eventStatus ?? "",
               EventStatus
          )

          return (
               <Button variant="solid" onPress={() => handleRegister()} disabled={isDisabled}>
                    <ButtonText>{buttonText}</ButtonText>
               </Button>
          )
     }

     const handleManualVenueRegistration = useCallback(async () => {
          if (latitude === null || longitude === null) {
               Alert.alert("Location Required", "Please ensure location services are enabled.")
               return
          }

          try {
               const response = await verifyVenueLocationWithAutoUpgrade(
                    eventId,
                    latitude,
                    longitude
               )

               if (response.autoUpgraded) {
                    stopAutoUpgradePolling()

                    Alert.alert("Registration Completed!", response.message, [
                         {
                              text: "OK",
                              onPress: async () => {
                                   const updatedStatus = await checkEventRegistrationStatus(eventId)
                                   setRegistrationStatus(updatedStatus)

                                   if (
                                        shouldStartTracking &&
                                        eventData?.venueLocation?.locationId
                                   ) {
                                        startTracking(eventId, eventData.venueLocation.locationId)
                                   }
                              },
                         },
                    ])
               } else if (response.inside) {
                    Alert.alert(
                         "Location Verified",
                         "You're at the venue, but registration couldn't be completed. Please ensure you've completed the registration location step first.",
                         [{ text: "OK" }]
                    )
               } else {
                    Alert.alert(
                         "Not at Venue",
                         response.message ||
                              "You must be at the event venue to complete registration.",
                         [{ text: "OK" }]
                    )
               }
          } catch (error) {
               console.error("Manual venue registration failed:", error)
               Alert.alert(
                    "Registration Failed",
                    "Unable to complete venue registration. Please try again.",
                    [{ text: "OK" }]
               )
          }
     }, [
          eventId,
          latitude,
          longitude,
          stopAutoUpgradePolling,
          shouldStartTracking,
          eventData,
          startTracking,
          setRegistrationStatus,
     ])

     if (loadingEvent || !eventId) {
          return (
               <SafeAreaView style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#000000" />
                    <ThemedText type="default" style={{ marginTop: 12, opacity: 0.6 }}>
                         GETTING EVENT DETAILS ...
                    </ThemedText>
               </SafeAreaView>
          )
     }

     return (
          <SafeAreaView style={styles.container}>
               <StatusBar barStyle="dark-content" />

               <View style={styles.gradientContainer}>
                    <LinearGradient
                         colors={getStatusGradient(eventData?.eventStatus || "")}
                         start={{ x: 1, y: 0 }}
                         end={{ x: 0, y: 1 }}
                         locations={[0, 0.3, 0.6, 1]}
                         style={styles.gradientBackground}
                    />
               </View>

               <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
               >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                         <View style={styles.statusRow}>
                              <ThemedText type="caption" style={styles.statusBadge}>
                                   {eventData?.eventStatus || "N/A"}
                              </ThemedText>
                              {liveEventState && shouldMonitorEventStatus && (
                                   <View style={styles.liveIndicator}>
                                        <View style={styles.liveDot} />
                                        <ThemedText type="caption" style={styles.liveText}>
                                             {liveEventState.statusMessage}
                                        </ThemedText>
                                   </View>
                              )}
                         </View>

                         <ThemedText type="title" style={styles.eventTitle}>
                              {eventData?.eventName || "N/A"}
                         </ThemedText>

                         {eventData?.description && (
                              <ThemedText type="body2" style={styles.description}>
                                   {eventData.description}
                              </ThemedText>
                         )}
                    </View>

                    {/* Registration Status */}
                    {registrationStatus?.registered && (
                         <View style={styles.section}>
                              <View style={styles.sectionHeader}>
                                   <ThemedText type="defaultSemiBold">
                                        {registrationStatus.message}
                                   </ThemedText>
                                   <Ionicons name="checkmark-outline" size={15} color="#1F2937" />
                              </View>
                              {registrationStatus.registrationTime && (
                                   <View style={styles.detailRow}>
                                        <ThemedText type="caption" style={styles.detailText}>
                                             {formatDateTime(registrationStatus.registrationTime)} |{" "}
                                             <ThemedText type="caption" style={styles.detailText}>
                                                  {registrationStatus.registrationLocationName}
                                             </ThemedText>
                                        </ThemedText>
                                   </View>
                              )}
                         </View>
                    )}

                    {/* Schedule */}
                    <View style={styles.section}>
                         <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                              EVENT SCHEDULE
                         </ThemedText>
                         <View style={styles.scheduleItem}>
                              <ThemedText type="caption" style={styles.label}>
                                   Registration
                              </ThemedText>
                              <ThemedText type="body2" style={styles.value}>
                                   {formatDateTime(eventData?.registrationDateTime)}
                              </ThemedText>
                         </View>
                         <View style={styles.scheduleItem}>
                              <ThemedText type="caption" style={styles.label}>
                                   Event Start
                              </ThemedText>
                              <ThemedText type="body2" style={styles.value}>
                                   {formatDateTime(eventData?.startingDateTime)}
                              </ThemedText>
                         </View>
                         <View style={styles.scheduleItem}>
                              <ThemedText type="caption" style={styles.label}>
                                   Event End
                              </ThemedText>
                              <ThemedText type="body2" style={styles.value}>
                                   {formatDateTime(eventData?.endingDateTime)}
                              </ThemedText>
                         </View>
                    </View>

                    {/* Locations */}
                    <View style={styles.section}>
                         <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                              LOCATIONS
                         </ThemedText>
                         <View style={styles.locationsRow}>
                              <View style={styles.locationItem}>
                                   <ThemedText type="caption" style={styles.label}>
                                        Registration
                                   </ThemedText>
                                   <ThemedText type="body2" style={styles.locationName}>
                                        {eventData?.registrationLocation?.locationName || "N/A"}
                                   </ThemedText>
                                   {eventData?.registrationLocation?.environment && (
                                        <ThemedText type="caption" style={styles.environmentText}>
                                             {eventData.registrationLocation.environment}
                                        </ThemedText>
                                   )}
                              </View>

                              <View style={styles.locationDivider} />

                              <View style={styles.locationItem}>
                                   <ThemedText type="caption" style={styles.label}>
                                        Venue
                                   </ThemedText>
                                   <ThemedText type="body2" style={styles.locationName}>
                                        {eventData?.venueLocation?.locationName || "N/A"}
                                   </ThemedText>
                                   {eventData?.venueLocation?.environment && (
                                        <ThemedText type="caption" style={styles.environmentText}>
                                             {eventData.venueLocation.environment}
                                        </ThemedText>
                                   )}
                              </View>
                         </View>
                    </View>

                    {/* Requirements */}
                    <View style={styles.section}>
                         <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                              REGISTRATION REQUIREMENTS
                         </ThemedText>
                         <View style={styles.requirementRow}>
                              <Ionicons
                                   name={
                                        config.facialEnabled
                                             ? "checkmark-circle-outline"
                                             : "close-circle-outline"
                                   }
                                   size={18}
                                   color="#1F2937"
                              />
                              <ThemedText type="body2" style={styles.requirementText}>
                                   Facial Verification
                              </ThemedText>
                         </View>
                         <View style={styles.requirementRow}>
                              <Ionicons
                                   name={
                                        config.attendanceMonitoringEnabled
                                             ? "checkmark-circle-outline"
                                             : "close-circle-outline"
                                   }
                                   size={18}
                                   color="#1F2937"
                              />
                              <ThemedText type="body2" style={styles.requirementText}>
                                   Attendance Monitoring
                              </ThemedText>
                         </View>
                         {config.strictLocationValidation && (
                              <View style={styles.requirementRow}>
                                   <Ionicons
                                        name="checkmark-circle-outline"
                                        size={18}
                                        color="#1F2937"
                                   />
                                   <ThemedText type="body2" style={styles.requirementText}>
                                        Two-Step Registration
                                   </ThemedText>
                              </View>
                         )}
                    </View>

                    {/* Tracking Status */}
                    {isTrackingThisEvent && (
                         <View style={styles.statusNotice}>
                              <View style={styles.trackingDot} />
                              <View style={{ flex: 1 }}>
                                   <ThemedText type="defaultSemiBold">
                                        Attendance Tracking Active
                                   </ThemedText>
                                   <ThemedText type="caption" style={styles.label}>
                                        Background monitoring is running
                                   </ThemedText>
                              </View>
                         </View>
                    )}

                    {/* Location Status */}
                    {locationStatus && (
                         <View style={styles.statusNotice}>
                              <Ionicons
                                   name={
                                        locationStatus.isInside
                                             ? "checkmark-circle-outline"
                                             : "alert-circle-outline"
                                   }
                                   size={18}
                                   color="#1F2937"
                              />
                              <ThemedText type="body2" style={styles.noticeText}>
                                   {locationStatus.message}
                              </ThemedText>
                              {verifyingLocation && (
                                   <ActivityIndicator size="small" color="#6B7280" />
                              )}
                         </View>
                    )}
               </ScrollView>

               {/* Fixed Button */}
               <View style={styles.fixedButtonContainer}>{renderRegistrationButton()}</View>
          </SafeAreaView>
     )
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: "#FFFFFF",
     },
     centerContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
     },
     scrollContent: {
          paddingBottom: moderateScale(120),
     },
     heroSection: {
          padding: spacing.md,
          paddingTop: spacing.xl,
     },
     statusRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.md,
     },
     statusBadge: {
          color: "#6B7280",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontSize: normalize(11),
          fontWeight: "600",
     },
     liveIndicator: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
     },
     liveDot: {
          width: moderateScale(6),
          height: moderateScale(6),
          borderRadius: moderateScale(3),
          backgroundColor: "#1F2937",
     },
     liveText: {
          color: "#1F2937",
          fontSize: normalize(11),
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontWeight: "600",
     },
     eventTitle: {
          fontSize: normalize(26),
          lineHeight: normalize(32),
          marginBottom: spacing.sm,
          color: "#1F2937",
     },
     description: {
          color: "#6B7280",
          lineHeight: normalize(22),
     },
     section: {
          padding: spacing.md,
     },
     sectionTitle: {
          marginBottom: spacing.sm,
          color: "#1F2937",
     },
     sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
     },
     detailRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginTop: spacing.xs,
     },
     detailText: {
          color: "#6B7280",
     },
     scheduleItem: {
          paddingVertical: spacing.sm,
     },
     label: {
          color: "#6B7280",
          marginBottom: spacing.xs,
          fontSize: normalize(12),
     },
     value: {
          color: "#1F2937",
     },
     locationsRow: {
          flexDirection: "row",
          gap: spacing.lg,
     },
     locationItem: {
          flex: 1,
     },
     locationDivider: {
          width: 1,
          backgroundColor: "#E5E7EB",
     },
     locationName: {
          color: "#1F2937",
          marginBottom: spacing.xs,
     },
     environmentText: {
          color: "#6B7280",
          fontSize: normalize(11),
     },
     requirementRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingVertical: spacing.sm,
     },
     requirementText: {
          flex: 1,
          color: "#1F2937",
     },
     statusNotice: {
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: spacing.lg,
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: "#F9FAFB",
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: moderateScale(8),
          gap: spacing.sm,
     },
     trackingDot: {
          width: moderateScale(8),
          height: moderateScale(8),
          borderRadius: moderateScale(4),
          backgroundColor: "#1F2937",
     },
     noticeText: {
          flex: 1,
          color: "#1F2937",
     },
     fixedButtonContainer: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.lg,
          paddingBottom: spacing.xl,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4,
     },

     twoStepButtonContainer: {
          gap: spacing.sm,
     },

     stepProgressBar: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.xs,
          paddingHorizontal: spacing.md,
     },

     stepCompleted: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
     },

     stepText: {
          color: "#d97757",
          fontSize: normalize(13),
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
     },

     stepConnector: {
          flex: 1,
          height: 2,
          backgroundColor: "#E5E7EB",
          marginHorizontal: spacing.sm,
          maxWidth: moderateScale(60),
     },

     stepPending: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
     },

     stepCircle: {
          width: moderateScale(16),
          height: moderateScale(16),
          borderRadius: moderateScale(8),
          borderWidth: 2,
          borderColor: "#D1D5DB",
          backgroundColor: "#FFFFFF",
     },

     stepTextPending: {
          color: "#9CA3AF",
          fontSize: normalize(12),
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
     },

     helperText: {
          color: "#6B7280",
          fontSize: normalize(11),
          textAlign: "center",
          lineHeight: normalize(16),
     },
     gradientContainer: {
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          bottom: 0,
          zIndex: 0,
     },
     gradientBackground: {
          flex: 1,
          opacity: 0.4,
     },
})
