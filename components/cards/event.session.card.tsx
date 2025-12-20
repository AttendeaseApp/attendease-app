import { EventStatus } from "@/domain/enums/event/status/event.status.enum";
import { EventLocation } from "@/domain/interface/location/registration/registration.location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ThemedText } from "../ui/text/themed.text";
import { formatDateTime } from "@/utils/date-time-formatter-util";
import { Button } from "../ui/button";
import { ButtonText } from "../ui/button";
import { Octicons } from "@expo/vector-icons";
import { getAutoRegisterSetting } from "@/utils/settings/auto-registration.settings";
import { useAttendanceTracking } from "@/store/attendance/tracking/attendance.tracking.context";
import { sendLocalNotification } from "@/utils/notifications/push-notifications";
import * as Location from "expo-location";

interface EventCardProps {
    eventName: string;
    eventStatus: EventStatus;
    timeInRegistrationStartDateTime?: string;
    startDateTime?: string;
    endDateTime?: string;
    locationId?: string;
    eventLocation?: EventLocation;
    eventId: string;
    facialVerificationEnabled?: boolean;
}

const getStatusStyle = (status: EventStatus) => {
    switch (status) {
        case EventStatus.ONGOING:
            return {
                color: "#10B981",
                backgroundColor: "#D1FAE5",
                icon: "sparkles" as const,
            };
        case EventStatus.REGISTRATION:
            return {
                color: "#F59E0B",
                backgroundColor: "#FEF3C7",
                icon: "ticket" as const,
            };
        case EventStatus.UPCOMING:
            return {
                color: "#3B82F6",
                backgroundColor: "#DBEAFE",
                icon: "pin" as const,
            };
        case EventStatus.CANCELLED:
            return {
                color: "#EF4444",
                backgroundColor: "#FEE2E2",
                icon: "close-circle" as const,
            };
        case EventStatus.CONCLUDED:
        case EventStatus.FINALIZED:
            return {
                color: "#6B7280",
                backgroundColor: "#F3F4F6",
                icon: "checkmark-circle" as const,
            };
        default:
            return {
                color: "#6B7280",
                backgroundColor: "#F3F4F6",
                icon: "help-circle" as const,
            };
    }
};

export const EventSessionCard: React.FC<EventCardProps> = ({
    eventId,
    eventName,
    eventStatus,
    timeInRegistrationStartDateTime,
    startDateTime,
    endDateTime,
    eventLocation,
    facialVerificationEnabled = true,
}) => {
    const router = useRouter();
    const { startTracking } = useAttendanceTracking();
    const [isAutoRegistering, setIsAutoRegistering] = useState(false);

    const performAutoRegistration = async () => {
        if (!eventLocation?.locationId) {
            Alert.alert("Error", "Event location is not available.");
            return;
        }

        try {
            setIsAutoRegistering(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Location permission is needed to register for events.");
                setIsAutoRegistering(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const response = await fetch("YOUR_API_ENDPOINT/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Add your auth headers here
                },
                body: JSON.stringify({
                    eventId,
                    locationId: eventLocation.locationId,
                    latitude,
                    longitude,
                    faceData: null, // No facial verification
                }),
            });

            if (!response.ok) {
                throw new Error("Registration failed");
            }

            startTracking(eventId, eventLocation.locationId);

            await sendLocalNotification("Event Registration", `You've been automatically registered for "${eventName}"!`);

            Alert.alert("Auto-Registered", `You've been successfully registered for "${eventName}" and attendance tracking has started!`, [{ text: "OK" }]);
        } catch (error) {
            console.error("Auto-registration failed:", error);
            Alert.alert("Registration Failed", "Unable to auto-register. Please try manually.");
        } finally {
            setIsAutoRegistering(false);
        }
    };

    const handleCardPress = async () => {
        const autoRegisterEnabled = await getAutoRegisterSetting();
        const canRegister = eventStatus === EventStatus.REGISTRATION || eventStatus === EventStatus.ONGOING;

        if (autoRegisterEnabled && canRegister && !facialVerificationEnabled) {
            Alert.alert(
                "Auto-Registration",
                `Would you like to automatically register for "${eventName}"?`,
                [
                    {
                        text: "View Details",
                        style: "cancel",
                        onPress: () => {
                            router.push({
                                pathname: "/(modals)/event/details",
                                params: {
                                    eventId,
                                    locationId: eventLocation?.locationId,
                                },
                            });
                        },
                    },
                    {
                        text: "Register Now",
                        onPress: performAutoRegistration,
                    },
                ],
                { cancelable: true },
            );
        } else {
            router.push({
                pathname: "/(modals)/event/details",
                params: {
                    eventId,
                    locationId: eventLocation?.locationId,
                },
            });
        }
    };

    const statusStyle = getStatusStyle(eventStatus);

    return (
        <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.7} disabled={isAutoRegistering}>
            {/* Loading overlay */}
            {isAutoRegistering && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#27548A" />
                    <ThemedText type="default" style={styles.loadingText}>
                        Registering...
                    </ThemedText>
                </View>
            )}

            {/* Status Badge */}
            <View>
                <ThemedText type="subtitle" style={[styles.statusText, { color: statusStyle.color }]}>
                    {eventStatus}
                </ThemedText>
            </View>

            {/* Event Name */}
            <ThemedText type="title" style={styles.eventName}>
                {eventName}
            </ThemedText>

            {/* Event Details */}
            <View style={styles.detailsContainer}>
                {/* Registration Time */}
                {timeInRegistrationStartDateTime && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Registration
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {formatDateTime(timeInRegistrationStartDateTime)}
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* Start Time */}
                {startDateTime && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Starts
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {formatDateTime(startDateTime)}
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* End Time */}
                {endDateTime && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Ends
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {formatDateTime(endDateTime)}
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* Location */}
                {eventLocation && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Location
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {eventLocation.locationName}
                            </ThemedText>
                        </View>
                    </View>
                )}
            </View>

            {/*goto event details*/}
            <View style={styles.buttonContainer}>
                <Button action="secondary" size="xs" onPress={handleCardPress} disabled={isAutoRegistering}>
                    <ThemedText type="default">More</ThemedText>
                    <ButtonText>
                        <Octicons name="arrow-right" />
                    </ButtonText>
                </Button>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        backgroundColor: "#FFFFFF",
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#eee",
        position: "relative",
    },
    statusText: {
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    eventName: {
        marginBlock: 11,
    },
    detailsContainer: {
        marginBottom: 50,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    detailTextContainer: {
        flex: 1,
        gap: 2,
    },
    detailLabel: {
        fontSize: 12,
        color: "#6B7280",
    },
    detailValue: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "400",
    },
    buttonContainer: {
        position: "absolute",
        bottom: 16,
        right: 16,
    },
    viewButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        minWidth: 80,
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: "#6B7280",
    },
});

export default EventSessionCard;
