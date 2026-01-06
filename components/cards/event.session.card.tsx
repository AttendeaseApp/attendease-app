import { EventStatus } from "@/domain/enums/event/status/event.status.enum";
import { Location } from "@/domain/interface/location/location-interface";
import { formatDateTime } from "@/utils/date-time-formatter-util";
import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, ButtonText } from "../ui/button";
import { ThemedText } from "../ui/text/themed.text";

interface EventCardProps {
    eventId: string;
    eventName: string;
    eventStatus: EventStatus;
    registrationDateTime?: string;
    startingDateTime?: string;
    endingDateTime?: string;
    registrationLocation?: Location;
    venueLocation?: Location;
    registrationLocationId?: string;
    venueLocationId?: string;
    facialVerificationEnabled?: boolean;
    attendanceLocationMonitoringEnabled?: boolean;
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
    registrationDateTime,
    startingDateTime,
    endingDateTime,
    registrationLocation,
    venueLocation,
    registrationLocationId,
    venueLocationId,
}) => {
    const router = useRouter();

    const handleCardPress = async () => {
        router.push({
            pathname: "./(routes)/event/registration",
            params: {
                eventId,
                registrationLocationId,
                venueLocationId,
            },
        });
    };

    const statusStyle = getStatusStyle(eventStatus);

    return (
        <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.7}>
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
                {registrationDateTime && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Registration
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {formatDateTime(registrationDateTime)}
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* Start Time */}
                {startingDateTime && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Starts
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {formatDateTime(startingDateTime)}
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* End Time */}
                {endingDateTime && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Ends
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {formatDateTime(endingDateTime)}
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* Registration Location */}
                {registrationLocation && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Registration at
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {registrationLocation.locationName}
                                {registrationLocation.environment && (
                                    <ThemedText type="default" style={styles.environmentBadge}>
                                        {" "}
                                        • {registrationLocation.environment}
                                    </ThemedText>
                                )}
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* Venue Location */}
                {venueLocation && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                            <ThemedText type="default" style={styles.detailLabel}>
                                Venue
                            </ThemedText>
                            <ThemedText type="default" style={styles.detailValue}>
                                {venueLocation.locationName}
                                {venueLocation.environment && (
                                    <ThemedText type="default" style={styles.environmentBadge}>
                                        {" "}
                                        • {venueLocation.environment}
                                    </ThemedText>
                                )}
                            </ThemedText>
                        </View>
                    </View>
                )}
            </View>

            {/* Action Button */}
            <View style={styles.buttonContainer}>
                <Button action="secondary" size="xs" onPress={handleCardPress}>
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
        marginBottom: 8,
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
    environmentBadge: {
        fontSize: 12,
        color: "#6B7280",
    },
    buttonContainer: {
        position: "absolute",
        bottom: 16,
        right: 16,
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
