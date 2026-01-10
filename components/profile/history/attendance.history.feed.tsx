import React, { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator,
    View,
    FlatList,
    RefreshControl,
    StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AttendanceHistoryCard from "@/components/cards/attendance.history.card";
import { ThemedText } from "@/components/ui/text/themed.text";
import { getAllAttendanceHistory } from "@/server/service/api/profile/attendance/attendance-history-service";
import { Ionicons } from "@expo/vector-icons";

export default function AttendanceHistories() {
    const [histories, setAttendanceHistories] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        getAllAttendanceHistory(setAttendanceHistories, setLoading);
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await getAllAttendanceHistory(setAttendanceHistories, setLoading);
        setRefreshing(false);
    }, []);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#27548A" />
                <ThemedText type="default" style={styles.loadingText}>
                    Loading attendance history...
                </ThemedText>
            </View>
        );
    }

    if (!histories) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.errorIconContainer}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={64}
                        color="#772F1A"
                    />
                </View>
                <ThemedText type="default" style={styles.errorTitle}>
                    Unable to Load History
                </ThemedText>
                <ThemedText type="default" style={styles.errorDescription}>
                    There was a problem loading your attendance records. Please
                    try again.
                </ThemedText>
            </View>
        );
    }

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="checkmark-outline" size={64} color="#676F54" />
            </View>
            <ThemedText type="default" style={styles.emptyTitle}>
                No Attendance Records
            </ThemedText>
            <ThemedText type="default" style={styles.emptyDescription}>
                Your attendance history will appear here once you start
                attending events.
            </ThemedText>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <ThemedText type="subtitle" style={styles.headerTitle}>
                Attendance Histories
            </ThemedText>
            <View style={styles.countBadge}>
                <ThemedText type="subtitle" style={styles.countText}>
                    {histories.length} record/s
                </ThemedText>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {histories.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={histories}
                    keyExtractor={(item, index) =>
                        item.eventId || `event-${index}`
                    }
                    renderItem={({ item }) => (
                        <AttendanceHistoryCard
                            eventId={item.eventId}
                            eventName={item.eventName}
                            academicYearName={item.academicYearName}
                            semesterName={item.semesterName}
                            timeIn={item.timeIn}
                            timeOut={item.timeOut}
                            attendanceStatus={item.attendanceStatus}
                            reason={item.reason}
                        />
                    )}
                    ListHeaderComponent={renderHeader}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 80 },
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#27548A"]}
                            tintColor="#27548A"
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        opacity: 0.6,
    },
    errorIconContainer: {
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        marginBottom: 8,
        textAlign: "center",
    },
    errorDescription: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: "center",
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyTitle: {
        fontSize: 25,
        marginBottom: 8,
        textAlign: "center",
    },
    emptyDescription: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: "center",
        lineHeight: 20,
    },
    listContent: {
        paddingTop: 0,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
    },
    countBadge: {
        paddingVertical: 4,
    },
    countText: {
        fontSize: 14,
        color: "#4F46E5",
    },
});
