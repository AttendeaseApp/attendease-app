import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, StatusBar, ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { ButtonText } from "@/components/ui/button";
import { ScreenLayoutContainer } from "@/components/layout/screen.layout.container";
import { ThemedText } from "@/components/ui/text/themed.text";
import { useAttendanceTracking } from "@/store/attendance/tracking/attendance.tracking.context";
import { Event } from "@/domain/interface/event/session/event.session";
import { useEventRegistration } from "@/hooks/events/registration/useEventRegistration";
import { subscribeToEventById } from "@/server/service/api/event/subscribe-to-event-by-id";
import { formatDateTime } from "@/utils/date-time-formatter-util";
import { SafeAreaView } from "react-native-safe-area-context";
import { verifyRegistrationLocation } from "@/server/service/api/geolocation/verify-registration-location";
import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response";
import { checkEventRegistrationStatus, RegistrationStatusResponse } from "@/server/service/api/event/registration/check-event-registration-status";

interface LocationStatus {
    isInside: boolean;
    message: string;
}

export default function EventDetailsRegistrationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        eventId: string;
        registrationLocationId?: string;
        venueLocationId?: string;
        face?: string;
    }>();
    const eventId = params.eventId;
    const face = params.face;

    const { trackingState, startTracking } = useAttendanceTracking();

    const [eventData, setEventData] = useState<Event | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatusResponse | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [hasRegistrationAttempted, setHasRegistrationAttempted] = useState(false);
    const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    if (!eventId) {
        return (
            <ScreenLayoutContainer>
                <ActivityIndicator size="large" color="#2A2C24" />
            </ScreenLayoutContainer>
        );
    }

    const isTrackingThisEvent = trackingState.isTracking && trackingState.eventId === eventId;
    const { latitude, longitude, loading, locationLoading, register: performRegistration } = useEventRegistration(eventId);

    const eventFetchingSubscription = useCallback(async () => {
        setLoadingEvent(true);
        const subscription = await subscribeToEventById(eventId, (data) => {
            console.log("[WS] Event received:", data);
            setEventData(data);
            setLoadingEvent(false);
        });
        return () => subscription.unsubscribe?.();
    }, [eventId]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        eventFetchingSubscription().then((unsub) => (cleanup = unsub));
        return () => cleanup?.();
    }, [eventFetchingSubscription]);

    useEffect(() => {
        async function checkStatus() {
            if (!eventId) return;

            try {
                const status = await checkEventRegistrationStatus(eventId);
                setRegistrationStatus(status);
                if (status.isRegistered && eventData?.attendanceLocationMonitoringEnabled && eventData?.venueLocationId) {
                    console.log("Student already registered, checking if tracking should resume");
                }
            } catch (error) {
                console.error("Failed to check registration:", error);
            } finally {
                setCheckingStatus(false);
            }
        }

        checkStatus();
    }, [eventId, eventData?.attendanceLocationMonitoringEnabled, eventData?.venueLocationId]);

    useEffect(() => {
        let unsubscribe: any;

        async function setup() {
            if (latitude === null || longitude === null) return;

            unsubscribe = await verifyRegistrationLocation(eventId, latitude, longitude, (response: LocationTrackingResponse) => {
                setLocationStatus({
                    isInside: response.inside,
                    message: response.message,
                });
            });
        }

        setup();
        return () => unsubscribe?.unsubscribe?.();
    }, [eventId, latitude, longitude]);

    const facialEnabled = eventData?.facialVerificationEnabled ?? true;
    const attendanceMonitoringEnabled = eventData?.attendanceLocationMonitoringEnabled ?? true;
    const requireFace = facialEnabled && !attendanceMonitoringEnabled;
    const shouldStartTracking = attendanceMonitoringEnabled;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const status = await checkEventRegistrationStatus(eventId);
            setRegistrationStatus(status);
        } catch (error) {
            console.error("Failed to refresh registration status:", error);
        }

        setTimeout(() => setRefreshing(false), 500);
    }, [eventId]);

    const handleRegister = () => {
        if (locationLoading || latitude === null || longitude === null) {
            console.warn("Cannot start verification: Location data is still loading or unavailable.");
            return;
        }

        if (requireFace) {
            setHasRegistrationAttempted(false);
            router.push({
                pathname: "/(routes)/(biometrics)/verification",
                params: { eventId },
            });
        } else {
            setHasRegistrationAttempted(true);
            performRegistration(null, async () => {
                const updatedStatus = await checkEventRegistrationStatus(eventId);
                setRegistrationStatus(updatedStatus);

                if (shouldStartTracking && eventData?.venueLocationId) {
                    startTracking(eventId, eventData.venueLocationId);
                } else {
                    console.log("Attendance monitoring disabled - skipping tracking");
                }
            });
        }
    };

    useEffect(() => {
        if (latitude !== null && longitude !== null && !loading && !hasRegistrationAttempted) {
            if (requireFace && face) {
                setHasRegistrationAttempted(true);
                performRegistration(face, async () => {
                    const updatedStatus = await checkEventRegistrationStatus(eventId);
                    setRegistrationStatus(updatedStatus);
                    if (shouldStartTracking && eventData?.venueLocationId) {
                        startTracking(eventId, eventData.venueLocationId);
                    } else {
                        console.log("Attendance monitoring disabled - skipping tracking");
                    }
                });
            }
        }
    }, [face, performRegistration, startTracking, eventId, eventData?.venueLocationId, latitude, longitude, loading, hasRegistrationAttempted, requireFace, shouldStartTracking]);

    if (loadingEvent) {
        return (
            <ScreenLayoutContainer>
                <ActivityIndicator size="large" color="#2A2C24" />
            </ScreenLayoutContainer>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.headerContainer}>
                <ScrollView contentContainerStyle={{ paddingBottom: 180 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    {/* --- Event Info Sections --- */}
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">{eventData?.eventStatus || "N/A"}</ThemedText>
                    </View>

                    <View style={styles.infoSection}>
                        <ThemedText type="loginTitle">{eventData?.eventName || "N/A"}</ThemedText>
                    </View>

                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">Description</ThemedText>
                        <ThemedText type="default">{eventData?.description || "N/A"}</ThemedText>
                    </View>

                    <View style={styles.infoSection}>
                        <ThemedText type="default">Registration starts at exactly {formatDateTime(eventData?.registrationDateTime)}.</ThemedText>
                        <ThemedText type="default">
                            The event will then proceed to start on {formatDateTime(eventData?.startingDateTime)} and will end on {formatDateTime(eventData?.endingDateTime)}.
                        </ThemedText>
                    </View>

                    {/* --- Eligibility --- */}
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">Eligibility</ThemedText>
                        {eventData?.eligibleStudents ? (
                            <>
                                {eventData.eligibleStudents.allStudents ? (
                                    <ThemedText type="default">Open to all students</ThemedText>
                                ) : (
                                    <View style={{ gap: 8 }}>
                                        {eventData.eligibleStudents.cluster?.length && eventData.eligibleStudents.cluster.length > 0 && (
                                            <View>
                                                <ThemedText type="defaultSemiBold">Clusters</ThemedText>
                                                <ThemedText type="default">{eventData.eligibleStudents.clusterNames?.join(", ") || eventData.eligibleStudents.cluster?.join(", ")}</ThemedText>
                                            </View>
                                        )}
                                        {eventData.eligibleStudents.course?.length && eventData.eligibleStudents.course.length > 0 && (
                                            <View>
                                                <ThemedText type="defaultSemiBold">Courses</ThemedText>
                                                <ThemedText type="default">{eventData.eligibleStudents.courseNames?.join(", ") || eventData.eligibleStudents.course?.join(", ")}</ThemedText>
                                            </View>
                                        )}
                                        {eventData.eligibleStudents.sections?.length && eventData.eligibleStudents.sections.length > 0 && (
                                            <View>
                                                <ThemedText type="default">Sections</ThemedText>
                                                <ThemedText type="defaultSemiBold">{eventData.eligibleStudents.sectionNames?.join(", ") || eventData.eligibleStudents.sections?.join(", ")}</ThemedText>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </>
                        ) : (
                            <ThemedText type="defaultSemiBold">N/A</ThemedText>
                        )}
                    </View>

                    {/* --- Facial & Attendance --- */}
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">Facial Verification</ThemedText>
                        <ThemedText type="default">{facialEnabled ? "Required" : "Not Required"}</ThemedText>
                    </View>

                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">Attendance Monitoring</ThemedText>
                        <ThemedText type="default">{attendanceMonitoringEnabled ? "Required" : "Not Required"}</ThemedText>
                    </View>

                    {/* --- Registration & Venue --- */}
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">Registration Location</ThemedText>
                        {eventData?.registrationLocation ? (
                            <ThemedText type="default">
                                {eventData.registrationLocation.locationName || "Unavailable"}
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

                    {/* --- Attendance Tracking Status --- */}
                    <View style={styles.eventRegistrationInfoSection}>
                        {attendanceMonitoringEnabled ? (
                            <>
                                {isTrackingThisEvent ? (
                                    <View style={styles.pingStatusContainer}>
                                        {trackingState.eventStatus && <ThemedText type="default">{trackingState.eventStatus}</ThemedText>}
                                        <ThemedText type="default">
                                            {trackingState.eventStatus?.includes("ongoing")
                                                ? "Pinging every 5 minutes while event is ongoing."
                                                : trackingState.eventStatus?.includes("not started") || trackingState.eventStatus?.includes("registration")
                                                  ? "Waiting for event to start before sending pings."
                                                  : "Monitoring event status..."}
                                        </ThemedText>
                                        <ThemedText type="default" style={styles.lastPingText}>
                                            Last successful ping: {trackingState.lastTrackingTime || "waiting for first ping..."}
                                        </ThemedText>
                                    </View>
                                ) : (
                                    <View style={styles.infoSection}>
                                        <ThemedText type="defaultSemiBold">Attendance Tracking Status</ThemedText>
                                        <ThemedText type="default">
                                            {registrationStatus?.isRegistered ? "Tracking will begin when event starts." : "Inactive, click register below to begin tracking."}
                                        </ThemedText>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.infoSection}>
                                <ThemedText type="defaultSemiBold">Attendance Tracking</ThemedText>
                                <ThemedText type="default">Location monitoring is not required for this event. Registration only.</ThemedText>
                            </View>
                        )}

                        {/* Location verification status */}
                        {locationStatus && (
                            <View style={styles.infoSection}>
                                <ThemedText type="default">{locationStatus.message}</ThemedText>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Fixed Register/Status Button */}
                <View style={styles.fixedButtonContainer}>
                    {registrationStatus?.isRegistered ? (
                        <View style={styles.registeredBadge}>
                            <ThemedText type="defaultSemiBold" style={styles.registeredTitle}>
                                ✓ Already Registered
                            </ThemedText>
                            <ThemedText type="default" style={styles.registeredMessage}>
                                {registrationStatus.message}
                            </ThemedText>
                            <ThemedText type="default" style={styles.registeredTime}>
                                Registered: {formatDateTime(registrationStatus.registrationTime)}
                            </ThemedText>
                        </View>
                    ) : (
                        <Button
                            onPress={handleRegister}
                            disabled={
                                checkingStatus ||
                                loading ||
                                locationLoading ||
                                latitude === null ||
                                longitude === null ||
                                isTrackingThisEvent ||
                                eventData?.eventStatus === "UPCOMING" ||
                                eventData?.eventStatus === "CONCLUDED" ||
                                eventData?.eventStatus === "FINALIZED"
                            }
                        >
                            <ButtonText>{loading ? "REGISTERING..." : requireFace ? "VERIFY & REGISTER" : "REGISTER"}</ButtonText>
                        </Button>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        padding: 16,
        paddingBottom: 24,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        zIndex: 13,
    },
    infoSection: {
        marginBottom: 16,
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
        backgroundColor: "#FFFFFF",
    },
    pingStatusContainer: {
        flexDirection: "column",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: "#D2CCA1",
    },
    lastPingText: {
        marginTop: 4,
        fontSize: 15,
        opacity: 0.8,
    },
    registeredBadge: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: "#D1FAE5",
        borderWidth: 1,
        borderColor: "#10B981",
    },
    registeredTitle: {
        color: "#065F46",
        marginBottom: 4,
    },
    registeredMessage: {
        color: "#047857",
        marginBottom: 4,
    },
    registeredTime: {
        fontSize: 12,
        color: "#059669",
    },
    environmentBadge: {
        fontSize: 12,
        color: "#6B7280",
    },
});
