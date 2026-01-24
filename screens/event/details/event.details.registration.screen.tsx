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

     const {
          isPollingForUpgrade,
          autoUpgradeMessage,
          startAutoUpgradePolling,
          stopAutoUpgradePolling,
     } = useAutoUpgradePolling(
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
          const buttonText = getButtonText(loading, registrationInProgressRef.current, requireFace)
          const isDisabled = isRegistrationDisabled(
               registrationStatus?.registered ?? false,
               eventData?.eventStatus ?? "",
               EventStatus
          )

          return (
               <Button variant="solid" onPress={() => handleRegister()} disabled={isDisabled}>
                    <ButtonText>{buttonText}</ButtonText>
               </Button>
          )
     }

     if (loadingEvent || !eventId) {
          return <ActivityIndicator size="large" color="#2A2C24" />
     }

     return (
          <SafeAreaView style={{ flex: 1 }}>
               <StatusBar barStyle="dark-content" />
               <ScrollView
                    contentContainerStyle={{ paddingBottom: 180 }}
                    refreshControl={
                         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
               >
                    <View style={styles.contentWrapper}>
                         {/* Event Status */}
                         <View style={styles.infoSection}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                   <ThemedText type="defaultSemiBold">
                                        {eventData?.eventStatus || "N/A"}
                                   </ThemedText>
                                   {liveEventState && shouldMonitorEventStatus && (
                                        <View>
                                             <ThemedText
                                                  type="default"
                                                  style={styles.liveStatusText}
                                             >
                                                  {liveEventState.statusMessage}
                                             </ThemedText>
                                        </View>
                                   )}
                              </View>
                         </View>

                         {/* Event Name */}
                         <View style={styles.infoSection}>
                              <ThemedText type="title">{eventData?.eventName || "N/A"}</ThemedText>
                         </View>

                         {/* Registration Status Badge */}
                         {registrationStatus?.registered && (
                              <View
                                   style={[
                                        styles.statusBadge,
                                        styles.partialBadge,
                                        styles.successBadge,
                                        styles.infoBadge,
                                   ]}
                              >
                                   <ThemedText type="defaultSemiBold" style={styles.statusText}>
                                        {registrationStatus.message}
                                   </ThemedText>
                                   {registrationStatus.registrationTime && (
                                        <ThemedText type="default" style={styles.statusSubtext}>
                                             Registered:{" "}
                                             {formatDateTime(registrationStatus.registrationTime)}
                                        </ThemedText>
                                   )}
                                   {registrationStatus.registrationLocationName && (
                                        <ThemedText type="default" style={styles.statusSubtext}>
                                             Location: {registrationStatus.registrationLocationName}
                                        </ThemedText>
                                   )}
                              </View>
                         )}

                         {/* Description */}
                         <View style={styles.infoSection}>
                              <ThemedText type="defaultSemiBold">Description</ThemedText>
                              <ThemedText type="default">
                                   {eventData?.description || "N/A"}
                              </ThemedText>
                         </View>

                         {/* Schedule */}
                         <View style={styles.infoSection}>
                              <ThemedText type="default">
                                   Registration starts at exactly{" "}
                                   {formatDateTime(eventData?.registrationDateTime)}.
                              </ThemedText>
                              <ThemedText type="default">
                                   The event will then proceed to start on{" "}
                                   {formatDateTime(eventData?.startingDateTime)} and will end on{" "}
                                   {formatDateTime(eventData?.endingDateTime)}.
                              </ThemedText>
                         </View>

                         {/* Eligibility */}
                         <View style={styles.infoSection}>
                              <ThemedText type="defaultSemiBold">Eligibility</ThemedText>
                              {eventData?.eligibleStudents ? (
                                   <>
                                        {eventData.eligibleStudents.allStudents ? (
                                             <ThemedText type="default">
                                                  Open to all students
                                             </ThemedText>
                                        ) : (
                                             <View style={{ gap: 8 }}>
                                                  {eventData.eligibleStudents.cluster?.length &&
                                                       eventData.eligibleStudents.cluster.length >
                                                            0 && (
                                                            <View>
                                                                 <ThemedText type="defaultSemiBold">
                                                                      Clusters
                                                                 </ThemedText>
                                                                 <ThemedText type="default">
                                                                      {eventData.eligibleStudents.clusterNames?.join(
                                                                           ", "
                                                                      ) ||
                                                                           eventData.eligibleStudents.cluster?.join(
                                                                                ", "
                                                                           )}
                                                                 </ThemedText>
                                                            </View>
                                                       )}
                                                  {eventData.eligibleStudents.course?.length &&
                                                       eventData.eligibleStudents.course.length >
                                                            0 && (
                                                            <View>
                                                                 <ThemedText type="defaultSemiBold">
                                                                      Courses
                                                                 </ThemedText>
                                                                 <ThemedText type="default">
                                                                      {eventData.eligibleStudents.courseNames?.join(
                                                                           ", "
                                                                      ) ||
                                                                           eventData.eligibleStudents.course?.join(
                                                                                ", "
                                                                           )}
                                                                 </ThemedText>
                                                            </View>
                                                       )}
                                                  {eventData.eligibleStudents.sections?.length &&
                                                       eventData.eligibleStudents.sections.length >
                                                            0 && (
                                                            <View>
                                                                 <ThemedText type="default">
                                                                      Sections
                                                                 </ThemedText>
                                                                 <ThemedText type="defaultSemiBold">
                                                                      {eventData.eligibleStudents.sectionNames?.join(
                                                                           ", "
                                                                      ) ||
                                                                           eventData.eligibleStudents.sections?.join(
                                                                                ", "
                                                                           )}
                                                                 </ThemedText>
                                                            </View>
                                                       )}
                                             </View>
                                        )}
                                   </>
                              ) : (
                                   <ThemedText type="defaultSemiBold">N/A</ThemedText>
                              )}
                         </View>

                         {/* Strict Location Validation Info */}
                         {config.strictLocationValidation && (
                              <View style={styles.infoSection}>
                                   <ThemedText type="defaultSemiBold">
                                        Registration Process
                                   </ThemedText>
                                   <ThemedText type="default">
                                        This event uses two-step registration:{"\n"}
                                        1. Check in at registration area{"\n"}
                                        2. Proceed to venue (automatic check-in)
                                   </ThemedText>
                              </View>
                         )}

                         {/* Facial & Attendance */}
                         <View style={styles.infoSection}>
                              <ThemedText type="defaultSemiBold">Facial Verification</ThemedText>
                              <ThemedText type="default">
                                   {config.facialEnabled ? "Required" : "Not Required"}
                              </ThemedText>
                         </View>

                         <View style={styles.infoSection}>
                              <ThemedText type="defaultSemiBold">Attendance Monitoring</ThemedText>
                              <ThemedText type="default">
                                   {config.attendanceMonitoringEnabled
                                        ? "Required"
                                        : "Not Required"}
                              </ThemedText>
                         </View>

                         {/* Locations */}
                         <View style={styles.infoSection}>
                              <ThemedText type="defaultSemiBold">Registration Location</ThemedText>
                              {eventData?.registrationLocation ? (
                                   <ThemedText type="default">
                                        {eventData.registrationLocation.locationName ||
                                             "Unavailable"}
                                        <ThemedText type="default" style={styles.environmentBadge}>
                                             {" "}
                                             • {eventData.registrationLocation.environment || "N/A"}
                                        </ThemedText>
                                   </ThemedText>
                              ) : (
                                   <ThemedText type="defaultSemiBold">Unavailable</ThemedText>
                              )}
                         </View>

                         <View style={styles.infoSection}>
                              <ThemedText type="defaultSemiBold">Event Venue</ThemedText>
                              {eventData?.venueLocation ? (
                                   <ThemedText type="default">
                                        {eventData.venueLocation.locationName || "Unavailable"}
                                        <ThemedText type="default" style={styles.environmentBadge}>
                                             {" "}
                                             • {eventData.venueLocation.environment || "N/A"}
                                        </ThemedText>
                                   </ThemedText>
                              ) : (
                                   <ThemedText type="defaultSemiBold">Unavailable</ThemedText>
                              )}
                         </View>

                         {/* Auto-Upgrade Status */}
                         {isPollingForUpgrade && autoUpgradeMessage && (
                              <View style={styles.autoUpgradeContainer}>
                                   <ActivityIndicator size="small" color="#2563eb" />
                                   <ThemedText type="default" style={styles.autoUpgradeText}>
                                        {autoUpgradeMessage}
                                   </ThemedText>
                              </View>
                         )}

                         {/* Attendance Tracking Status */}
                         <View style={styles.eventRegistrationInfoSection}>
                              {config.attendanceMonitoringEnabled ? (
                                   <>
                                        {isTrackingThisEvent ? (
                                             <View style={styles.pingStatusContainer}>
                                                  <ThemedText type="default">
                                                       Attendance tracking is active for this event.
                                                  </ThemedText>
                                                  <ThemedText type="default">
                                                       Background pings are being sent while the
                                                       event is ongoing.
                                                  </ThemedText>
                                             </View>
                                        ) : (
                                             <View style={styles.infoSection}>
                                                  <ThemedText type="defaultSemiBold">
                                                       Attendance Tracking Status
                                                  </ThemedText>
                                                  <ThemedText type="default">
                                                       {registrationStatus?.registered
                                                            ? "Tracking will begin when event starts."
                                                            : "Inactive, click register below to begin tracking."}
                                                  </ThemedText>
                                             </View>
                                        )}
                                   </>
                              ) : (
                                   <View style={styles.infoSection}>
                                        <ThemedText type="defaultSemiBold">
                                             Attendance Tracking
                                        </ThemedText>
                                        <ThemedText type="default">
                                             Location monitoring is not required for this event.
                                             Registration only.
                                        </ThemedText>
                                   </View>
                              )}

                              {/* Location verification status with loading indicator */}
                              {locationStatus && (
                                   <View style={styles.locationStatusContainer}>
                                        {verifyingLocation && (
                                             <ActivityIndicator size="small" color="#6B7280" />
                                        )}
                                        <ThemedText
                                             type="default"
                                             style={[
                                                  styles.locationStatusText,
                                                  locationStatus.isInside &&
                                                       styles.locationInsideText,
                                                  !locationStatus.isInside &&
                                                       styles.locationOutsideText,
                                             ]}
                                        >
                                             {locationStatus.message}
                                        </ThemedText>
                                   </View>
                              )}
                         </View>
                    </View>
               </ScrollView>
               <View style={styles.fixedButtonContainer}>{renderRegistrationButton()}</View>
          </SafeAreaView>
     )
}

const styles = StyleSheet.create({
     contentWrapper: {
          padding: 16,
          paddingBottom: 24,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          zIndex: 13,
     },
     infoSection: {
          marginBlock: 16,
     },
     eventRegistrationInfoSection: {
          marginTop: 100,
          gap: 8,
     },
     fixedButtonContainer: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 30,
     },
     pingStatusContainer: {
          flexDirection: "column",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          backgroundColor: "#D2CCA1",
     },
     autoUpgradeContainer: {
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          backgroundColor: "#DBEAFE",
          gap: 8,
     },
     autoUpgradeText: {
          color: "#1e40af",
          flex: 1,
     },
     statusBadge: {
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          borderWidth: 1,
     },
     partialBadge: {
          backgroundColor: "#FEF3C7",
          borderColor: "#F59E0B",
     },
     successBadge: {
          backgroundColor: "#D1FAE5",
          borderColor: "#10B981",
     },
     infoBadge: {
          backgroundColor: "#E0E7FF",
          borderColor: "#6366F1",
     },
     statusText: {
          marginBottom: 4,
     },
     statusSubtext: {
          fontSize: 12,
          opacity: 0.8,
          marginTop: 2,
     },
     environmentBadge: {
          fontSize: 12,
          color: "#6B7280",
     },
     liveStatusText: {
          color: "#991B1B",
          fontSize: 13,
     },
     locationStatusContainer: {
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          gap: 8,
     },
     locationStatusText: {
          flex: 1,
          fontSize: 14,
     },
     locationInsideText: {
          color: "#059669",
     },
     locationOutsideText: {
          color: "#DC2626",
     },
})
