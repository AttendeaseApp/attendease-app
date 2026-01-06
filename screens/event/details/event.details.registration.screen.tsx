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
import { subscribeToLiveLocationVerificationResponse } from "@/server/service/api/geolocation/subscribe-to-location-verification-response";
import { publishCurrentLocationPositioning } from "@/server/service/api/geolocation/publish-current-location-positioning";
import { formatDateTime } from "@/utils/date-time-formatter-util";
import { SafeAreaView } from "react-native-safe-area-context";

interface LocationStatus {
    isInside: boolean;
    message: string;
}

/**
 * Event Details and Registration screen
 *
 * Features:
 * - Display event information
 * - Handle event registration
 * - Start/stop attendance tracking (persists across navigation)
 * - Automatically stops tracking when event concludes
 */
export default function EventDetailsRegistrationScreen() {
    const router = useRouter();
    const { eventId, locationId, face } = useLocalSearchParams<{
        eventId: string;
        locationId: string;
        face?: string;
    }>();

    const { trackingState, startTracking } = useAttendanceTracking();

    const isTrackingThisEvent = trackingState.isTracking && trackingState.eventId === eventId;

    const { latitude, longitude, loading, locationLoading, register: performRegistration } = useEventRegistration(eventId!, locationId!);
    const [eventData, setEventData] = useState<Event | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [hasRegistrationAttempted, setHasRegistrationAttempted] = useState(false);
    const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);

    const [refreshing, setRefreshing] = useState(false);

    const eventFetchingSubscription = useCallback(async () => {
        if (!eventId) return;
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
        eventFetchingSubscription().then((unsub) => {
            cleanup = unsub;
        });
        return () => cleanup?.();
    }, [eventFetchingSubscription]);

    useEffect(() => {
        let unsubscribe: any;
        async function setup() {
            unsubscribe = await subscribeToLiveLocationVerificationResponse((res) => {
                setLocationStatus({
                    isInside: res.inside,
                    message: res.message,
                });
            });
        }
        setup();
        return () => unsubscribe?.unsubscribe?.();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 500);
    }, []);

    useEffect(() => {
        if (latitude !== null && longitude !== null && locationId) {
            publishCurrentLocationPositioning(locationId, latitude, longitude);
        }
    }, [latitude, longitude, locationId]);

    const facialEnabled = eventData?.facialVerificationEnabled ?? true;
    const attendanceMonitoringEnabled = eventData?.attendanceLocationMonitoringEnabled ?? true;
    const requireFace = facialEnabled && !attendanceMonitoringEnabled;

    const handleRegister = () => {
        if (locationLoading || latitude === null || longitude === null) {
            console.warn("Cannot start verification: Location data is still loading or unavailable.");
            return;
        }
        if (requireFace) {
            setHasRegistrationAttempted(false);
            router.push({
                pathname: "/(routes)/(biometrics)/verification",
                params: { eventId, locationId },
            });
        } else {
            setHasRegistrationAttempted(true);
            performRegistration(null, () => startTracking(eventId!, locationId!));
        }
    };

    useEffect(() => {
        if (latitude !== null && longitude !== null && !loading && !hasRegistrationAttempted) {
            if (requireFace && face) {
                setHasRegistrationAttempted(true);
                performRegistration(face, () => startTracking(eventId!, locationId!));
            } else if (!requireFace) {
                setHasRegistrationAttempted(true);
                performRegistration(null, () => startTracking(eventId!, locationId!));
            }
        }
    }, [face, performRegistration, startTracking, eventId, locationId, latitude, longitude, loading, hasRegistrationAttempted, requireFace]);

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
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">Facial Verification</ThemedText>
                        <ThemedText type="default">{facialEnabled ? "Required" : "Not Required"}</ThemedText>
                    </View>
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">Attendance Monitoring</ThemedText>
                        <ThemedText type="default">{attendanceMonitoringEnabled ? "Required" : "Not Required"}</ThemedText>
                    </View>

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
                    <View style={styles.eventRegistrationInfoSection}>
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

                                <ThemedText
                                    type="default"
                                    style={{
                                        marginTop: 4,
                                        fontSize: 15,
                                        opacity: 0.8,
                                    }}
                                >
                                    Last successful ping: {trackingState.lastTrackingTime || "waiting for first ping..."}
                                </ThemedText>
                            </View>
                        ) : (
                            <View style={styles.infoSection}>
                                <ThemedText type="defaultSemiBold">Attendance Tracking Status</ThemedText>
                                <ThemedText type="default">Inactive, click register below to begin.</ThemedText>
                            </View>
                        )}
                        <View style={styles.infoSection}>{locationStatus && <ThemedText type="default">{locationStatus.message}</ThemedText>}</View>
                    </View>
                </ScrollView>

                <View style={styles.fixedButtonContainer}>
                    <Button
                        onPress={handleRegister}
                        disabled={
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
    },
    locationLoadingContainer: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        gap: 8,
        margin: 8,
    },
    buttonWrapper: { marginTop: 24 },
    pingStatusContainer: {
        flexDirection: "column",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: "#D2CCA1",
    },
    environmentBadge: {
        fontSize: 12,
        color: "#6B7280",
    },
});
