import { EventStatus } from "@/domain/enums/event/status/event.status.enum";
import { Location } from "@/domain/interface/location/location-interface";
import { formatDateTime } from "@/utils/date-time-formatter-util";
import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Button, ButtonText } from "../ui/button";
import { ThemedText } from "../ui/text/themed.text";
import {
  checkEventRegistrationStatus,
  RegistrationStatusResponse,
} from "@/server/service/api/event/registration/check-event-registration-status";

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

const getRegistrationStatusStyle = (attendanceStatus?: string) => {
  switch (attendanceStatus) {
    case "REGISTERED":
    case "PRESENT":
    case "IDLE":
      return {
        color: "#065F46",
        backgroundColor: "#D1FAE5",
        borderColor: "#10B981",
        label: "Registered",
      };
    case "LATE":
      return {
        color: "#92400E",
        backgroundColor: "#FEF3C7",
        borderColor: "#F59E0B",
        label: "Registered (Late)",
      };
    case "PARTIALLY_REGISTERED":
      return {
        color: "#92400E",
        backgroundColor: "#FEF3C7",
        borderColor: "#F59E0B",
        label: "Partially Registered",
      };
    case "ABSENT":
      return {
        color: "#991B1B",
        backgroundColor: "#FEE2E2",
        borderColor: "#EF4444",
        label: "Absent",
      };
    case "EXCUSED":
      return {
        color: "#1E40AF",
        backgroundColor: "#DBEAFE",
        borderColor: "#3B82F6",
        label: "Excused",
      };
    default:
      return null;
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
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    async function fetchRegistrationStatus() {
      if (
        ![
          EventStatus.ONGOING,
          EventStatus.REGISTRATION,
          EventStatus.CONCLUDED,
        ].includes(eventStatus)
      ) {
        return;
      }
      try {
        setLoadingStatus(true);
        const status = await checkEventRegistrationStatus(eventId);
        setRegistrationStatus(status);
      } catch (error) {
        console.error("Failed to fetch registration status:", error);
      } finally {
        setLoadingStatus(false);
      }
    }

    fetchRegistrationStatus();
  }, [eventId, eventStatus]);

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
  const registrationStatusStyle = registrationStatus?.isRegistered
    ? getRegistrationStatusStyle(registrationStatus.attendanceStatus)
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.statusRow}>
        <ThemedText
          type="subtitle"
          style={[styles.statusText, { color: statusStyle.color }]}
        >
          {eventStatus}
        </ThemedText>

        {loadingStatus && (
          <View style={styles.registrationStatusBadge}>
            <ActivityIndicator size="small" color="#6B7280" />
          </View>
        )}

        {!loadingStatus && registrationStatusStyle && (
          <View
            style={[
              styles.registrationStatusBadge,
              {
                backgroundColor: registrationStatusStyle.backgroundColor,
                borderColor: registrationStatusStyle.borderColor,
              },
            ]}
          >
            <ThemedText
              type="default"
              style={[
                styles.registrationStatusText,
                { color: registrationStatusStyle.color },
              ]}
            >
              {registrationStatusStyle.label}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Event Name */}
      <ThemedText type="title" style={styles.eventName}>
        {eventName}
      </ThemedText>

      {/* Registration Status Details */}
      {registrationStatus?.isRegistered && (
        <View style={styles.registrationDetailsContainer}>
          {registrationStatus.registrationTime && (
            <View style={styles.registrationDetailRow}>
              <Octicons name="clock" size={12} color="#6B7280" />
              <ThemedText type="default" style={styles.registrationDetailText}>
                Registered:{" "}
                {formatDateTime(registrationStatus.registrationTime)}
              </ThemedText>
            </View>
          )}
          {registrationStatus.registrationLocationName && (
            <View style={styles.registrationDetailRow}>
              <Octicons name="location" size={12} color="#6B7280" />
              <ThemedText type="default" style={styles.registrationDetailText}>
                {registrationStatus.registrationLocationName}
              </ThemedText>
            </View>
          )}
          {registrationStatus.attendanceStatus === "PARTIALLY_REGISTERED" && (
            <View style={styles.partialRegistrationWarning}>
              <Octicons name="alert" size={12} color="#F59E0B" />
              <ThemedText type="default" style={styles.partialRegistrationText}>
                Please proceed to venue to complete registration
              </ThemedText>
            </View>
          )}
        </View>
      )}

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
          <ThemedText type="default">
            {registrationStatus?.isRegistered
              ? "View Details"
              : "View & Register"}
          </ThemedText>
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statusText: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  registrationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  registrationStatusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  eventName: {
    marginBlock: 11,
  },
  registrationDetailsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    gap: 6,
  },
  registrationDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  registrationDetailText: {
    fontSize: 12,
    color: "#4B5563",
  },
  partialRegistrationWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    padding: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 4,
  },
  partialRegistrationText: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "500",
    flex: 1,
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
});

export default EventSessionCard;
