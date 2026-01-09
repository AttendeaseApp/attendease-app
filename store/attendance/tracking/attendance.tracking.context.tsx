import { EventStatusCheckResponse } from "@/domain/interface/event/status/event.status.check.response";
import { subscribeEventStatusCheck } from "@/server/service/api/event/status/subscribe-event-status-check";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Alert, AppState } from "react-native";
import { useStartAttendanceTracking } from "@/utils/attendance/tracking/attendance-tracking-utility";
import { useStopAttendanceTracking } from "@/utils/attendance/tracking/stop-attendance-tracking";

interface TrackingState {
    isTracking: boolean;
    eventId: string | null;
    locationId: string | null;
    lastTrackingTime: string | null;
    eventStatus: string | null;
    latitude: number | null;
    longitude: number | null;
}

interface AttendanceTrackingContextType {
    trackingState: TrackingState;
    startTracking: (eventId: string, locationId: string) => void;
    stopTracking: () => void;
}

const AttendanceTrackingContext = createContext<AttendanceTrackingContextType | undefined>(undefined);

const STORAGE_KEY = "@attendance_tracking_state";

/**
 * Provides global attendance tracking state that persists across navigation.
 * Tracking continues even when user navigates away from the event page.
 * Only starts tracking for events that require attendance monitoring.
 */
export function AttendanceTrackingProvider({ children }: { children: React.ReactNode }) {
    const [trackingState, setTrackingState] = useState<TrackingState>({
        isTracking: false,
        eventId: null,
        locationId: null,
        lastTrackingTime: null,
        eventStatus: null,
        latitude: null,
        longitude: null,
    });

    const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const subscriptionRef = useRef<any>(null);
    const hasShownEndAlertRef = useRef(false);
    const appState = useRef(AppState.currentState);

    // Get the functions from hooks at top level (not inside other functions)
    const startAttendanceTrackingFn = useStartAttendanceTracking();
    const stopAttendanceTrackingFn = useStopAttendanceTracking();

    // Stabilize callbacks with useCallback
    const startTracking = useCallback(
        (eventId: string, locationId: string) => {
            if (!locationId) {
                console.warn("Cannot start tracking: No venue location ID provided");
                Alert.alert("Tracking Not Available", "Venue location is not configured for this event.");
                return;
            }

            // Don't start if already tracking this event
            if (trackingState.isTracking && trackingState.eventId === eventId) {
                console.log("Already tracking this event, skipping...");
                return;
            }

            // Clear any existing tracking first
            if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
                trackingIntervalRef.current = null;
            }

            hasShownEndAlertRef.current = false;

            setTrackingState((prev) => ({
                ...prev,
                isTracking: true,
                eventId,
                locationId,
            }));

            // Call the function returned by the hook (not the hook itself)
            trackingIntervalRef.current = startAttendanceTrackingFn({
                eventId,
                locationId,
                setIsTracking: (tracking) => {
                    setTrackingState((prev) => ({ ...prev, isTracking: tracking }));
                },
                setLatitude: (lat) => {
                    setTrackingState((prev) => ({ ...prev, latitude: lat }));
                },
                setLongitude: (lng) => {
                    setTrackingState((prev) => ({ ...prev, longitude: lng }));
                },
                setLastTrackingTime: (time) => {
                    setTrackingState((prev) => ({
                        ...prev,
                        lastTrackingTime: time,
                    }));
                },
            });
        },
        [startAttendanceTrackingFn, trackingState.isTracking, trackingState.eventId],
    );

    const stopTracking = useCallback(() => {
        // Clear interval
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
        }

        // Unsubscribe from event status
        if (subscriptionRef.current) {
            subscriptionRef.current?.unsubscribe();
            subscriptionRef.current = null;
        }

        // Call stop tracking function
        stopAttendanceTrackingFn({
            setIsTracking: (tracking) => {
                setTrackingState((prev) => ({
                    ...prev,
                    isTracking: typeof tracking === "function" ? tracking(prev.isTracking) : tracking,
                }));
            },
        });

        // Reset state
        setTrackingState({
            isTracking: false,
            eventId: null,
            locationId: null,
            lastTrackingTime: null,
            eventStatus: null,
            latitude: null,
            longitude: null,
        });
    }, [stopAttendanceTrackingFn]);

    // Load persisted state on mount
    useEffect(() => {
        const loadState = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed: TrackingState = JSON.parse(saved);
                    setTrackingState(parsed);

                    // Resume tracking if it was active
                    if (parsed.isTracking && parsed.eventId && parsed.locationId) {
                        setTimeout(() => {
                            startTracking(parsed.eventId!, parsed.locationId!);
                        }, 100);
                    }
                }
            } catch (error) {
                console.error("Failed to load tracking state:", error);
            }
        };
        loadState();
    }, [startTracking]);

    // Persist state changes
    useEffect(() => {
        const saveState = async () => {
            try {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trackingState));
            } catch (error) {
                console.error("Failed to save tracking state:", error);
            }
        };
        if (trackingState.isTracking) {
            saveState();
        }
    }, [trackingState]);

    // Handle app state changes (background/foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === "active") {
                console.log("App has come to the foreground!");
                if (trackingState.isTracking && trackingState.eventId && trackingState.locationId) {
                    // Resume tracking when app comes back
                    startTracking(trackingState.eventId, trackingState.locationId);
                }
            }
            if (trackingState.isTracking && nextAppState.match(/background|inactive/)) {
                console.log("App backgrounded, state is saved...");
            }
            appState.current = nextAppState;
        });
        return () => subscription?.remove();
    }, [trackingState.isTracking, trackingState.eventId, trackingState.locationId, startTracking]);

    // Subscribe to event status changes
    useEffect(() => {
        if (!trackingState.isTracking || !trackingState.eventId) return;

        hasShownEndAlertRef.current = false;

        // Clean up previous subscription if exists
        if (subscriptionRef.current) {
            subscriptionRef.current?.unsubscribe();
            subscriptionRef.current = null;
        }

        subscriptionRef.current = subscribeEventStatusCheck(trackingState.eventId, (eventState: EventStatusCheckResponse) => {
            setTrackingState((prev) => ({
                ...prev,
                eventStatus: eventState.statusMessage,
            }));

            if (eventState.eventHasEnded) {
                stopTracking();
                if (!hasShownEndAlertRef.current) {
                    hasShownEndAlertRef.current = true;
                    Alert.alert("Event Concluded", "The event has ended. Attendance tracking has been stopped automatically.", [{ text: "OK" }]);
                }
            }
        });

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current?.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [trackingState.isTracking, trackingState.eventId, stopTracking]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
            }
            if (subscriptionRef.current) {
                subscriptionRef.current?.unsubscribe();
            }
        };
    }, []);

    return (
        <AttendanceTrackingContext.Provider
            value={{
                trackingState,
                startTracking,
                stopTracking,
            }}
        >
            {children}
        </AttendanceTrackingContext.Provider>
    );
}

/**
 * Hook to access global attendance tracking state
 */
export function useAttendanceTracking() {
    const context = useContext(AttendanceTrackingContext);
    if (context === undefined) {
        throw new Error("useAttendanceTracking must be used within AttendanceTrackingProvider");
    }
    return context;
}
