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
import { verifyVenueLocationWithAutoUpgrade } from "@/server/service/api/geolocation/verify-venue-location-with-auto-upgrade"
import {
     checkEventRegistrationStatus,
     RegistrationStatusResponse,
} from "@/server/service/api/event/registration/check-event-registration-status"
import { AttendanceStatusEnum } from "@/domain/enums/attendance/status/attendance.status.enum"
import { useAttendanceTracking } from "@/store/attendance/tracking/attendance.tracking.context"
import { useEventStatusMonitoring } from "@/hooks/events/status/useEventStatus"
import { EventStatus } from "@/domain/enums/event/status/event.status.enum"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface LocationStatus {
     isInside: boolean
     message: string
}

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
     const [registrationStatus, setRegistrationStatus] =
          useState<RegistrationStatusResponse | null>(null)
     const [checkingStatus, setCheckingStatus] = useState(true)
     const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null)
     const [verifyingLocation, setVerifyingLocation] = useState(false)
     const [refreshing, setRefreshing] = useState(false)
     const [isPollingForUpgrade, setIsPollingForUpgrade] = useState(false)
     const [autoUpgradeMessage, setAutoUpgradeMessage] = useState<string | null>(null)

     const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
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

     // event configs
     const facialEnabled = eventData?.facialVerificationEnabled ?? true
     const attendanceMonitoringEnabled = eventData?.attendanceLocationMonitoringEnabled ?? true
     const strictLocationValidation = eventData?.strictLocationValidation ?? false
     const requireFace = facialEnabled && !attendanceMonitoringEnabled
     const shouldStartTracking = attendanceMonitoringEnabled && eventData?.venueLocationId

     const shouldMonitorEventStatus = eventData?.eventStatus === EventStatus.ONGOING

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

     useEffect(() => {
          async function verifyLocation() {
               if (latitude === null || longitude === null || !eventId) return

               try {
                    setVerifyingLocation(true)
                    const response = await verifyRegistrationLocation(eventId, latitude, longitude)
                    setLocationStatus({
                         isInside: response.inside,
                         message: response.message,
                    })
               } catch (error) {
                    console.error("Failed to verify registration location:", error)
                    setLocationStatus({
                         isInside: false,
                         message: "Unable to verify location. Please try again.",
                    })
               } finally {
                    setVerifyingLocation(false)
               }
          }

          verifyLocation()
     }, [eventId, latitude, longitude])

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

     const stopAutoUpgradePolling = useCallback(() => {
          if (pollingIntervalRef.current) {
               clearInterval(pollingIntervalRef.current)
               pollingIntervalRef.current = null
          }
          setIsPollingForUpgrade(false)
          setAutoUpgradeMessage(null)
     }, [])

     const startAutoUpgradePolling = useCallback(() => {
          if (pollingIntervalRef.current) {
               clearInterval(pollingIntervalRef.current)
          }

          setIsPollingForUpgrade(true)
          setAutoUpgradeMessage(
               "Walking to venue? We'll automatically check you in when you arrive!"
          )

          pollingIntervalRef.current = setInterval(async () => {
               if (latitude === null || longitude === null) return

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
                                   text: "Ok",
                                   onPress: async () => {
                                        const updatedStatus =
                                             await checkEventRegistrationStatus(eventId)
                                        setRegistrationStatus(updatedStatus)
                                        if (shouldStartTracking) {
                                             startTracking(eventId, eventData!.venueLocationId!)
                                        }
                                   },
                              },
                         ])
                    } else if (response.inside) {
                         stopAutoUpgradePolling()
                    }
               } catch (error) {
                    console.error("Auto-upgrade check failed:", error)
               }
          }, 10000)
     }, [
          eventId,
          latitude,
          longitude,
          stopAutoUpgradePolling,
          shouldStartTracking,
          startTracking,
          eventData,
     ])

     useEffect(() => {
          return () => {
               stopAutoUpgradePolling()
          }
     }, [stopAutoUpgradePolling])

     useEffect(() => {
          async function checkStatus() {
               if (!eventId) return
               try {
                    setCheckingStatus(true)
                    const status = await checkEventRegistrationStatus(eventId)
                    console.log("Registration status:", status)
                    setRegistrationStatus(status)

                    if (
                         status.attendanceStatus === AttendanceStatusEnum.PARTIALLY_REGISTERED &&
                         eventData?.strictLocationValidation &&
                         !isPollingForUpgrade
                    ) {
                         startAutoUpgradePolling()
                    }
                    if (
                         status.registered &&
                         [
                              AttendanceStatusEnum.REGISTERED,
                              AttendanceStatusEnum.LATE,
                              AttendanceStatusEnum.PRESENT,
                              AttendanceStatusEnum.IDLE,
                         ].includes(status.attendanceStatus) &&
                         eventData?.attendanceLocationMonitoringEnabled &&
                         eventData?.venueLocationId &&
                         !isTrackingThisEvent
                    ) {
                         console.log("Resuming tracking for registered student")
                         startTracking(eventId, eventData.venueLocationId)
                    }
               } catch (error) {
                    console.error("Failed to check registration:", error)
               } finally {
                    setCheckingStatus(false)
               }
          }

          if (eventData) {
               checkStatus()
          }
     }, [
          eventId,
          eventData?.strictLocationValidation,
          eventData?.attendanceLocationMonitoringEnabled,
          eventData?.venueLocationId,
          eventData,
          isPollingForUpgrade,
          startAutoUpgradePolling,
          isTrackingThisEvent,
          startTracking,
     ])

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
     }, [eventId, fetchEventData, latitude, longitude])

     const checkBiometricsRegistration = async (): Promise<boolean> => {
          const registrationComplete = await AsyncStorage.getItem("facialRegistrationComplete")
          return registrationComplete === "true"
     }

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
                         Alert.alert(
                              "Biometric Registration Required",
                              "This event requires facial verification, but you haven't registered your biometric data yet. Would you like to register now?",
                              [
                                   {
                                        text: "Cancel",
                                        style: "cancel",
                                   },
                                   {
                                        text: "Register Biometrics",
                                        onPress: async () => {
                                             const studentNumber =
                                                  await AsyncStorage.getItem("studentNumber")
                                             router.push({
                                                  pathname: "/(routes)/(biometrics)/onboarding",
                                                  params: {
                                                       studentNumber: studentNumber || "",
                                                       returnTo: "event",
                                                       eventId: eventId,
                                                  },
                                             })
                                        },
                                   },
                              ],
                              { cancelable: true }
                         )
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
                    try {
                         console.log(
                              "[Registration] Registration successful, fetching updated status..."
                         )
                         const updatedStatus = await checkEventRegistrationStatus(eventId)
                         setRegistrationStatus(updatedStatus)

                         if (
                              updatedStatus.attendanceStatus ===
                                   AttendanceStatusEnum.PARTIALLY_REGISTERED &&
                              strictLocationValidation
                         ) {
                              console.log(
                                   "[Registration] Partially registered, starting auto-upgrade polling..."
                              )
                              startAutoUpgradePolling()
                         } else if (shouldStartTracking && updatedStatus.registered) {
                              console.log("[Registration] Starting attendance tracking...")
                              startTracking(eventId, eventData!.venueLocationId!)
                         }
                    } catch (error) {
                         console.error(
                              "[Registration] Failed to refresh status after registration:",
                              error
                         )
                    } finally {
                         registrationInProgressRef.current = false
                    }
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
               strictLocationValidation,
               shouldStartTracking,
               startAutoUpgradePolling,
               eventData,
               startTracking,
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

     useEffect(() => {
          if (face) {
               console.log("[Registration] Face parameter updated:", face)
               console.log("[Registration] Current state:", {
                    faceProcessed: faceProcessedRef.current,
                    latitude,
                    longitude,
                    loading,
                    checkingStatus,
                    registrationInProgress: registrationInProgressRef.current,
               })
          }
     }, [face, latitude, longitude, loading, checkingStatus])

     const renderRegistrationButton = () => {
          const getButtonText = () => {
               if (loading || registrationInProgressRef.current) {
                    return "REGISTERING..."
               }
               if (requireFace) {
                    return "VERIFY"
               }
               return "REGISTER"
          }

          const isDisabled =
               registrationStatus?.registered || eventData?.eventStatus === EventStatus.CONCLUDED

          return (
               <Button variant="solid" onPress={() => handleRegister()} disabled={isDisabled}>
                    <ButtonText>{getButtonText()}</ButtonText>
               </Button>
          )
     }

     if (loadingEvent) {
          return <ActivityIndicator size="large" color="#2A2C24" />
     }

     if (!eventId) {
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
                         {strictLocationValidation && (
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
                                   {facialEnabled ? "Required" : "Not Required"}
                              </ThemedText>
                         </View>

                         <View style={styles.infoSection}>
                              <ThemedText type="defaultSemiBold">Attendance Monitoring</ThemedText>
                              <ThemedText type="default">
                                   {attendanceMonitoringEnabled ? "Required" : "Not Required"}
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
                              {attendanceMonitoringEnabled ? (
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
