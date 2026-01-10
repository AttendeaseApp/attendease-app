import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    View,
    Alert,
} from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/text/themed.text";
import { Event } from "@/domain/interface/event/session/event.session";
import { useEventRegistration } from "@/hooks/events/registration/useEventRegistration";
import { subscribeToEventById } from "@/server/service/api/event/subscribe-to-event-by-id";
import { formatDateTime } from "@/utils/date-time-formatter-util";
import { SafeAreaView } from "react-native-safe-area-context";
import { verifyRegistrationLocation } from "@/server/service/api/geolocation/verify-registration-location";
import { verifyVenueLocationWithAutoUpgrade } from "@/server/service/api/geolocation/verify-venue-location-with-auto-upgrade";
import { LocationTrackingResponse } from "@/domain/interface/location/location-tracking-response";
import {
    checkEventRegistrationStatus,
    RegistrationStatusResponse,
} from "@/server/service/api/event/registration/check-event-registration-status";

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

    const [eventData, setEventData] = useState<Event | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [registrationStatus, setRegistrationStatus] =
        useState<RegistrationStatusResponse | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(
        null,
    );
    const [refreshing, setRefreshing] = useState(false);
    const [isPollingForUpgrade, setIsPollingForUpgrade] = useState(false);
    const [autoUpgradeMessage, setAutoUpgradeMessage] = useState<string | null>(
        null,
    );

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );
    const registrationInProgressRef = useRef(false);
    const faceProcessedRef = useRef(false);

    const {
        latitude,
        longitude,
        loading,
        locationLoading,
        register: performRegistration,
    } = useEventRegistration(eventId || "");

    // event configs
    const facialEnabled = eventData?.facialVerificationEnabled ?? true;
    const attendanceMonitoringEnabled =
        eventData?.attendanceLocationMonitoringEnabled ?? true;
    const strictLocationValidation =
        eventData?.strictLocationValidation ?? false;
    const requireFace = facialEnabled && !attendanceMonitoringEnabled;
    const shouldStartTracking =
        attendanceMonitoringEnabled && eventData?.venueLocationId;

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
        let unsubscribe: any;
        async function setup() {
            if (latitude === null || longitude === null || !eventId) return;
            unsubscribe = await verifyRegistrationLocation(
                eventId,
                latitude,
                longitude,
                (response: LocationTrackingResponse) => {
                    setLocationStatus({
                        isInside: response.inside,
                        message: response.message,
                    });
                },
            );
        }

        setup();
        return () => unsubscribe?.unsubscribe?.();
    }, [eventId, latitude, longitude]);

    const stopAutoUpgradePolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        setIsPollingForUpgrade(false);
        setAutoUpgradeMessage(null);
    }, []);

    const startAutoUpgradePolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        setIsPollingForUpgrade(true);
        setAutoUpgradeMessage(
            "Walking to venue? We'll automatically check you in when you arrive!",
        );

        pollingIntervalRef.current = setInterval(async () => {
            if (latitude === null || longitude === null) return;

            try {
                const unsubscribe = await verifyVenueLocationWithAutoUpgrade(
                    eventId,
                    latitude,
                    longitude,
                    async (response: LocationTrackingResponse) => {
                        if (response.autoUpgraded) {
                            stopAutoUpgradePolling();
                            Alert.alert(
                                "Registration Completed!",
                                response.message,
                                [
                                    {
                                        text: "Ok",
                                        onPress: async () => {
                                            const updatedStatus =
                                                await checkEventRegistrationStatus(
                                                    eventId,
                                                );
                                            setRegistrationStatus(
                                                updatedStatus,
                                            );
                                        },
                                    },
                                ],
                            );
                        } else if (response.inside) {
                            stopAutoUpgradePolling();
                        }

                        unsubscribe?.unsubscribe?.();
                    },
                );
            } catch (error) {
                console.error("Auto-upgrade check failed:", error);
            }
        }, 10000);
    }, [eventId, latitude, longitude, stopAutoUpgradePolling]);

    useEffect(() => {
        return () => {
            stopAutoUpgradePolling();
        };
    }, [stopAutoUpgradePolling]);

    useEffect(() => {
        async function checkStatus() {
            if (!eventId) return;
            try {
                setCheckingStatus(true);
                const status = await checkEventRegistrationStatus(eventId);
                console.log("Registration status:", status);
                setRegistrationStatus(status);

                if (
                    status.attendanceStatus === "PARTIALLY_REGISTERED" &&
                    eventData?.strictLocationValidation &&
                    !isPollingForUpgrade
                ) {
                    startAutoUpgradePolling();
                }
                if (
                    status.isRegistered &&
                    ["REGISTERED", "LATE", "PRESENT", "IDLE"].includes(
                        status.attendanceStatus || "",
                    ) &&
                    eventData?.attendanceLocationMonitoringEnabled &&
                    eventData?.venueLocationId
                ) {
                    console.log("Resuming tracking for registered student");
                }
            } catch (error) {
                console.error("Failed to check registration:", error);
            } finally {
                setCheckingStatus(false);
            }
        }

        if (eventData) {
            checkStatus();
        }
    }, [
        eventId,
        eventData?.strictLocationValidation,
        eventData?.attendanceLocationMonitoringEnabled,
        eventData?.venueLocationId,
        eventData,
        isPollingForUpgrade,
        startAutoUpgradePolling,
    ]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const status = await checkEventRegistrationStatus(eventId);
            setRegistrationStatus(status);

            if (
                status.attendanceStatus === "PARTIALLY_REGISTERED" &&
                strictLocationValidation &&
                !isPollingForUpgrade
            ) {
                startAutoUpgradePolling();
            } else if (
                status.attendanceStatus !== "PARTIALLY_REGISTERED" &&
                isPollingForUpgrade
            ) {
                stopAutoUpgradePolling();
            }
        } catch (error) {
            console.error("Failed to refresh registration status:", error);
        }

        setTimeout(() => setRefreshing(false), 500);
    }, [
        eventId,
        strictLocationValidation,
        isPollingForUpgrade,
        startAutoUpgradePolling,
        stopAutoUpgradePolling,
    ]);

    const handleRegister = useCallback(
        async (faceData?: string) => {
            if (registrationInProgressRef.current) {
                console.log("Registration already in progress, skipping...");
                return;
            }

            if (locationLoading || latitude === null || longitude === null) {
                Alert.alert(
                    "Location Required",
                    "Waiting for location data. Please ensure location services are enabled.",
                );
                return;
            }

            if (requireFace && !faceData) {
                router.push({
                    pathname: "/(routes)/(biometrics)/verification",
                    params: { eventId },
                });
                return;
            }

            registrationInProgressRef.current = true;

            performRegistration(faceData || null, async () => {
                try {
                    const updatedStatus =
                        await checkEventRegistrationStatus(eventId);
                    setRegistrationStatus(updatedStatus);

                    if (
                        updatedStatus.attendanceStatus ===
                            "PARTIALLY_REGISTERED" &&
                        strictLocationValidation
                    ) {
                        startAutoUpgradePolling();
                    } else if (
                        shouldStartTracking &&
                        updatedStatus.isRegistered
                    )
                        Alert.alert("Success", updatedStatus.message);
                } catch (error) {
                    console.error(
                        "Failed to refresh status after registration:",
                        error,
                    );
                } finally {
                    registrationInProgressRef.current = false;
                }
            });
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
        ],
    );

    useEffect(() => {
        if (
            face &&
            !faceProcessedRef.current &&
            latitude !== null &&
            longitude !== null &&
            !loading &&
            !checkingStatus &&
            requireFace
        ) {
            faceProcessedRef.current = true;
            handleRegister(face);
        }
    }, [
        face,
        latitude,
        longitude,
        loading,
        checkingStatus,
        requireFace,
        handleRegister,
    ]);

    useEffect(() => {
        faceProcessedRef.current = false;
    }, [eventId]);

    const renderRegistrationButton = () => {
        const buttonText =
            loading || registrationInProgressRef.current
                ? "REGISTERING..."
                : requireFace
                  ? "VERIFY & REGISTER"
                  : "REGISTER";

        return (
            <Button onPress={() => handleRegister()}>
                <ButtonText>{buttonText}</ButtonText>
            </Button>
        );
    };

    if (loadingEvent) {
        return <ActivityIndicator size="large" color="#2A2C24" />;
    }

    if (!eventId) {
        return <ActivityIndicator size="large" color="#2A2C24" />;
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />
            <ScrollView
                contentContainerStyle={{ paddingBottom: 180 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <View style={styles.contentWrapper}>
                    {/* Event Status */}
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">
                            {eventData?.eventStatus || "N/A"}
                        </ThemedText>
                    </View>

                    {/* Event Name */}
                    <View style={styles.infoSection}>
                        <ThemedText type="loginTitle">
                            {eventData?.eventName || "N/A"}
                        </ThemedText>
                    </View>

                    {/* Registration Status Badge */}
                    {registrationStatus?.isRegistered && (
                        <View
                            style={[
                                styles.statusBadge,
                                styles.partialBadge,
                                styles.successBadge,
                                styles.infoBadge,
                            ]}
                        >
                            <ThemedText
                                type="defaultSemiBold"
                                style={styles.statusText}
                            >
                                {registrationStatus.message}
                            </ThemedText>
                            {registrationStatus.registrationTime && (
                                <ThemedText
                                    type="default"
                                    style={styles.statusSubtext}
                                >
                                    Registered:{" "}
                                    {formatDateTime(
                                        registrationStatus.registrationTime,
                                    )}
                                </ThemedText>
                            )}
                            {registrationStatus.registrationLocationName && (
                                <ThemedText
                                    type="default"
                                    style={styles.statusSubtext}
                                >
                                    Location:{" "}
                                    {
                                        registrationStatus.registrationLocationName
                                    }
                                </ThemedText>
                            )}
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">
                            Description
                        </ThemedText>
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
                            {formatDateTime(eventData?.startingDateTime)} and
                            will end on{" "}
                            {formatDateTime(eventData?.endingDateTime)}.
                        </ThemedText>
                    </View>

                    {/* Eligibility */}
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">
                            Eligibility
                        </ThemedText>
                        {eventData?.eligibleStudents ? (
                            <>
                                {eventData.eligibleStudents.allStudents ? (
                                    <ThemedText type="default">
                                        Open to all students
                                    </ThemedText>
                                ) : (
                                    <View style={{ gap: 8 }}>
                                        {eventData.eligibleStudents.cluster
                                            ?.length &&
                                            eventData.eligibleStudents.cluster
                                                .length > 0 && (
                                                <View>
                                                    <ThemedText type="defaultSemiBold">
                                                        Clusters
                                                    </ThemedText>
                                                    <ThemedText type="default">
                                                        {eventData.eligibleStudents.clusterNames?.join(
                                                            ", ",
                                                        ) ||
                                                            eventData.eligibleStudents.cluster?.join(
                                                                ", ",
                                                            )}
                                                    </ThemedText>
                                                </View>
                                            )}
                                        {eventData.eligibleStudents.course
                                            ?.length &&
                                            eventData.eligibleStudents.course
                                                .length > 0 && (
                                                <View>
                                                    <ThemedText type="defaultSemiBold">
                                                        Courses
                                                    </ThemedText>
                                                    <ThemedText type="default">
                                                        {eventData.eligibleStudents.courseNames?.join(
                                                            ", ",
                                                        ) ||
                                                            eventData.eligibleStudents.course?.join(
                                                                ", ",
                                                            )}
                                                    </ThemedText>
                                                </View>
                                            )}
                                        {eventData.eligibleStudents.sections
                                            ?.length &&
                                            eventData.eligibleStudents.sections
                                                .length > 0 && (
                                                <View>
                                                    <ThemedText type="default">
                                                        Sections
                                                    </ThemedText>
                                                    <ThemedText type="defaultSemiBold">
                                                        {eventData.eligibleStudents.sectionNames?.join(
                                                            ", ",
                                                        ) ||
                                                            eventData.eligibleStudents.sections?.join(
                                                                ", ",
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
                        <ThemedText type="defaultSemiBold">
                            Facial Verification
                        </ThemedText>
                        <ThemedText type="default">
                            {facialEnabled ? "Required" : "Not Required"}
                        </ThemedText>
                    </View>

                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">
                            Attendance Monitoring
                        </ThemedText>
                        <ThemedText type="default">
                            {attendanceMonitoringEnabled
                                ? "Required"
                                : "Not Required"}
                        </ThemedText>
                    </View>

                    {/* Locations */}
                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">
                            Registration Location
                        </ThemedText>
                        {eventData?.registrationLocation ? (
                            <ThemedText type="default">
                                {eventData.registrationLocation.locationName ||
                                    "Unavailable"}
                                <ThemedText
                                    type="default"
                                    style={styles.environmentBadge}
                                >
                                    {" "}
                                    •{" "}
                                    {eventData.registrationLocation
                                        .environment || "N/A"}
                                </ThemedText>
                            </ThemedText>
                        ) : (
                            <ThemedText type="defaultSemiBold">
                                Unavailable
                            </ThemedText>
                        )}
                    </View>

                    <View style={styles.infoSection}>
                        <ThemedText type="defaultSemiBold">
                            Event Venue
                        </ThemedText>
                        {eventData?.venueLocation ? (
                            <ThemedText type="default">
                                {eventData.venueLocation.locationName ||
                                    "Unavailable"}
                                <ThemedText
                                    type="default"
                                    style={styles.environmentBadge}
                                >
                                    {" "}
                                    •{" "}
                                    {eventData.venueLocation.environment ||
                                        "N/A"}
                                </ThemedText>
                            </ThemedText>
                        ) : (
                            <ThemedText type="defaultSemiBold">
                                Unavailable
                            </ThemedText>
                        )}
                    </View>

                    {/* Auto-Upgrade Status */}
                    {isPollingForUpgrade && autoUpgradeMessage && (
                        <View style={styles.autoUpgradeContainer}>
                            <ActivityIndicator size="small" color="#2563eb" />
                            <ThemedText
                                type="default"
                                style={styles.autoUpgradeText}
                            >
                                {autoUpgradeMessage}
                            </ThemedText>
                        </View>
                    )}

                    {/* Attendance Tracking Status */}
                    <View style={styles.eventRegistrationInfoSection}>
                        {/*{attendanceMonitoringEnabled ? (
                            <>
                                {isTrackingThisEvent ? (
                                    <View style={styles.pingStatusContainer}>
                                        {trackingState.eventStatus && (
                                            <ThemedText type="default">
                                                {trackingState.eventStatus}
                                            </ThemedText>
                                        )}
                                        <ThemedText type="default">
                                            {trackingState.eventStatus?.includes(
                                                "ongoing",
                                            )
                                                ? "Pinging every 5 minutes while event is ongoing."
                                                : trackingState.eventStatus?.includes(
                                                        "not started",
                                                    ) ||
                                                    trackingState.eventStatus?.includes(
                                                        "registration",
                                                    )
                                                  ? "Waiting for event to start before sending pings."
                                                  : "Monitoring event status..."}
                                        </ThemedText>
                                        <ThemedText
                                            type="default"
                                            style={styles.lastPingText}
                                        >
                                            Last successful ping:{" "}
                                            {trackingState.lastTrackingTime ||
                                                "waiting for first ping..."}
                                        </ThemedText>
                                    </View>
                                ) : (
                                    <View style={styles.infoSection}>
                                        <ThemedText type="defaultSemiBold">
                                            Attendance Tracking Status
                                        </ThemedText>
                                        <ThemedText type="default">
                                            {registrationStatus?.isRegistered
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
                                    Location monitoring is not required for this
                                    event. Registration only.
                                </ThemedText>
                            </View>
                        )}*/}

                        {/* Location verification status */}
                        {locationStatus && (
                            <View style={styles.infoSection}>
                                <ThemedText type="default">
                                    {locationStatus.message}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
            <View style={styles.fixedButtonContainer}>
                {renderRegistrationButton()}
            </View>
        </SafeAreaView>
    );
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
    secondaryButton: {
        backgroundColor: "#F59E0B",
        opacity: 0.8,
    },
    successButton: {
        backgroundColor: "#10B981",
    },
    infoButton: {
        backgroundColor: "#6366F1",
    },
    environmentBadge: {
        fontSize: 12,
        color: "#6B7280",
    },
});
