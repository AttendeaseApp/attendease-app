import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, ActivityIndicator, FlatList, View, RefreshControl, Animated } from "react-native";
import { EventSessionCard } from "../cards/event.session.card";
import { ThemedText } from "../ui/text/themed.text";
import { Event } from "@/domain/interface/event/session/event.session";
import { subscribeToEvents } from "@/server/service/api/homepage/subscribe-events";
import { Ionicons } from "@expo/vector-icons";
import { EventStatus } from "@/domain/enums/event/status/event.status.enum";

export default function EventSessionsFeed() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    useFocusEffect(
        useCallback(() => {
            let unsubscribe: (() => void) | null = null;

            async function initWebSocket() {
                unsubscribe = await subscribeToEvents((newEvents) => {
                    setEvents(newEvents);
                    setLoadingEvents(false);

                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }).start();
                });
            }

            initWebSocket();

            return () => {
                if (unsubscribe) unsubscribe();
                fadeAnim.setValue(0);
            };
        }, [fadeAnim]),
    );

    const ongoingEvents = events.filter((e) => e.eventStatus === EventStatus.ONGOING);
    const upcomingEvents = events.filter((e) => e.eventStatus === EventStatus.UPCOMING);
    const registrationEvents = events.filter((e) => e.eventStatus === EventStatus.REGISTRATION);

    if (loadingEvents) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#27548A" />
                <ThemedText type="default" style={{ marginTop: 12, opacity: 0.6 }}>
                    Loading events...
                </ThemedText>
            </View>
        );
    }

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="sparkles-outline" size={64} color="#EEC170" />
            </View>
            <ThemedText type="default" style={styles.emptyTitle}>
                There are no active events
            </ThemedText>
            <ThemedText type="default" style={styles.emptyDescription}>
                There are no events scheduled at the moment. Check back later!
            </ThemedText>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Events Feed
                </ThemedText>
                <View>
                    <ThemedText type="subtitle" style={styles.totalBadgeText}>
                        {events.length} event/s
                    </ThemedText>
                </View>
            </View>

            <View style={styles.statsContainer}>
                {ongoingEvents.length > 0 && (
                    <View style={[styles.statCard]}>
                        <Ionicons name="sparkles" size={25} color="#10B981" />
                        <View style={styles.statTextContainer}>
                            <ThemedText type="default" style={styles.statNumber}>
                                {ongoingEvents.length}
                            </ThemedText>
                            <ThemedText type="default" style={styles.statLabel}>
                                ONGOING
                            </ThemedText>
                        </View>
                    </View>
                )}

                {upcomingEvents.length > 0 && (
                    <View style={styles.statCard}>
                        <Ionicons name="pin" size={25} color="#3B82F6" />
                        <View style={styles.statTextContainer}>
                            <ThemedText type="default" style={styles.statNumber}>
                                {upcomingEvents.length}
                            </ThemedText>
                            <ThemedText type="default" style={styles.statLabel}>
                                UPCOMING
                            </ThemedText>
                        </View>
                    </View>
                )}

                {registrationEvents.length > 0 && (
                    <View style={[styles.statCard]}>
                        <Ionicons name="ticket" size={25} color="#F59E0B" />
                        <View style={styles.statTextContainer}>
                            <ThemedText type="default" style={styles.statNumber}>
                                {registrationEvents.length}
                            </ThemedText>
                            <ThemedText type="default" style={styles.statLabel}>
                                REGISTRATION
                            </ThemedText>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {events.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item, index) => item.eventId || `event-${index}`}
                    renderItem={({ item }) => (
                        <EventSessionCard
                            eventId={item.eventId}
                            eventName={item.eventName}
                            eventStatus={item.eventStatus}
                            timeInRegistrationStartDateTime={item.timeInRegistrationStartDateTime}
                            startDateTime={item.startDateTime}
                            endDateTime={item.endDateTime}
                            locationId={item.locationId}
                            eventLocation={item.eventLocation}
                            facialVerificationEnabled={item.facialVerificationEnabled}
                        />
                    )}
                    ListHeaderComponent={renderHeader}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#27548A"]} tintColor="#27548A" />}
                />
            )}
            <ThemedText type="default" style={styles.statLabel}>
                :)
            </ThemedText>
            <ThemedText type="default" style={styles.statLabel}>
                :)
            </ThemedText>
            <ThemedText type="default" style={styles.statLabel}>
                :)
            </ThemedText>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        paddingBottom: 20,
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 12,
    },
    statsContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
        flexWrap: "wrap",
    },
    statCard: {
        flex: 1,
        minWidth: 100,
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderRadius: 12,
        gap: 13,
        borderColor: "#eee",
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        backgroundColor: "#FFFFFF",
        elevation: 3,
    },
    statTextContainer: {
        flex: 1,
    },
    statNumber: {
        fontSize: 18,
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.9,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
    },
    totalBadgeText: {
        fontSize: 14,
        color: "#4F46E5",
    },
    emptyStateContainer: {
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
});
