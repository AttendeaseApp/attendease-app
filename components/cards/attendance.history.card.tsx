import React from "react"
import { StyleSheet, View } from "react-native"
import { ThemedText } from "../ui/text/themed.text"
import { AttendanceStatusEnum } from "@/domain/enums/attendance/status/attendance.status.enum"
import { normalize, spacing } from "@/themes/responsive"

interface AttendanceHistoryCardProps {
     eventId: string
     eventName: string
     academicYearName: string
     semesterName: string
     timeIn: string
     timeOut: string
     attendanceStatus: AttendanceStatusEnum
     reason: string
}

const AttendanceHistoryCard: React.FC<AttendanceHistoryCardProps> = ({
     eventName,
     timeIn,
     academicYearName,
     semesterName,
     timeOut,
     attendanceStatus,
     reason,
}) => {
     return (
          <View style={styles.card}>
               <View>
                    <ThemedText type="title" style={styles.attendanceStatus}>
                         {attendanceStatus}
                    </ThemedText>
                    <ThemedText type="subTitleSecondary" style={styles.eventTitle}>
                         {eventName}
                    </ThemedText>
                    <ThemedText type="default" style={styles.defaults}>
                         {academicYearName}
                    </ThemedText>
                    <ThemedText type="default" style={styles.defaults}>
                         {semesterName}
                    </ThemedText>
                    <ThemedText type="default" style={styles.defaults}>
                         Time In: {timeIn || "Unavailable"}
                    </ThemedText>
                    <ThemedText type="default" style={styles.defaults}>
                         Time Out: {timeOut || "Unavailable"}
                    </ThemedText>
                    <ThemedText type="default" style={styles.defaults}>
                         Reason: {reason}
                    </ThemedText>
               </View>
          </View>
     )
}

const styles = StyleSheet.create({
     card: {
          padding: 16,
          position: "relative",
     },
     attendanceStatus: {
          fontSize: normalize(20),
          lineHeight: normalize(21),
          marginBottom: spacing.sm,
          color: "#1F2937",
     },
     eventTitle: {
          fontSize: normalize(16),
          lineHeight: normalize(16),
          marginBottom: spacing.sm,
          color: "#1F2937",
     },
     defaults: {
          fontSize: normalize(14),
          lineHeight: normalize(14),
          marginBottom: spacing.sm,
          color: "#1F2937",
     },
})

export default AttendanceHistoryCard
