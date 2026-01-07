import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ui/text/themed.text";
import { AttendanceStatusEnum } from "@/domain/enums/attendance/status/attendance.status.enum";

interface AttendanceHistoryCardProps {
  eventId: string;
  eventName: string;
  timeIn: string;
  timeOut: string;
  attendanceStatus: AttendanceStatusEnum;
  reason: string;
}

const AttendanceHistoryCard: React.FC<AttendanceHistoryCardProps> = ({
  eventName,
  timeIn,
  timeOut,
  attendanceStatus,
  reason,
}) => {
  return (
    <View style={styles.card}>
      <View>
        <ThemedText type="title">{attendanceStatus}</ThemedText>
        <ThemedText type="subTitleSecondary">{eventName}</ThemedText>
        <ThemedText type="default">
          Time In: {timeIn || "Unavailable"}
        </ThemedText>
        <ThemedText type="default">
          Time Out: {timeOut || "Unavailable"}
        </ThemedText>
        <ThemedText type="default">Reason: {reason}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    position: "relative",
  },
});

export default AttendanceHistoryCard;
