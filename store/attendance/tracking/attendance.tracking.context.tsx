// import { EventStatusCheckResponse } from "@/domain/interface/event/status/event.status.check.response";
// import { subscribeEventStatusCheck } from "@/server/service/api/event/status/subscribe-event-status-check";
// import React, { createContext, useContext, useRef, useState } from "react";
// import { Alert } from "react-native";
// import { useStartAttendanceTracking } from "@/utils/attendance/tracking/attendance-tracking-utility";
// import { useStopAttendanceTracking } from "@/utils/attendance/tracking/stop-attendance-tracking";

// interface TrackingState {
//     isTracking: boolean;
//     eventId: string | null;
//     locationId: string | null;
//     lastTrackingTime: string | null;
//     eventStatus: string | null;
//     latitude: number | null;
//     longitude: number | null;
// }

// interface AttendanceTrackingContextType {
//     trackingState: TrackingState;
//     startTracking: (eventId: string, locationId: string) => void;
//     stopTracking: () => void;
// }

// const AttendanceTrackingContext = createContext<
//     AttendanceTrackingContextType | undefined
// >(undefined);

// /**
//  * Simplified attendance tracking provider.
//  * Manages tracking state without persistence - let each screen handle its own initialization.
//  */
// export function AttendanceTrackingProvider({
//     children,
// }: {
//     children: React.ReactNode;
// }) {
//     const [trackingState, setTrackingState] = useState<TrackingState>({
//         isTracking: false,
//         eventId: null,
//         locationId: null,
//         lastTrackingTime: null,
//         eventStatus: null,
//         latitude: null,
//         longitude: null,
//     });

//     const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
//         null,
//     );
//     const subscriptionRef = useRef<{ unsubscribe?: () => void } | null>(null);
//     const hasShownEndAlertRef = useRef(false);

//     const startAttendanceTrackingFn = useStartAttendanceTracking();
//     const stopAttendanceTrackingFn = useStopAttendanceTracking();

//     const startTracking = (eventId: string, locationId: string) => {
//         if (!locationId) {
//             console.warn(
//                 "Cannot start tracking: No venue location ID provided",
//             );
//             Alert.alert(
//                 "Tracking Not Available",
//                 "Venue location is not configured for this event.",
//             );
//             return;
//         }

//         stopTracking();

//         hasShownEndAlertRef.current = false;

//         setTrackingState((prev) => ({
//             ...prev,
//             isTracking: true,
//             eventId,
//             locationId,
//         }));

//         trackingIntervalRef.current = startAttendanceTrackingFn({
//             eventId,
//             locationId,
//             setIsTracking: (tracking) => {
//                 setTrackingState((prev) => ({ ...prev, isTracking: tracking }));
//             },
//             setLatitude: (lat) => {
//                 setTrackingState((prev) => ({ ...prev, latitude: lat }));
//             },
//             setLongitude: (lng) => {
//                 setTrackingState((prev) => ({ ...prev, longitude: lng }));
//             },
//             setLastTrackingTime: (time) => {
//                 setTrackingState((prev) => ({
//                     ...prev,
//                     lastTrackingTime: time,
//                 }));
//             },
//         });

//         subscribeEventStatusCheck(
//             eventId,
//             (eventState: EventStatusCheckResponse) => {
//                 setTrackingState((prev) => ({
//                     ...prev,
//                     eventStatus: eventState.statusMessage,
//                 }));

//                 if (eventState.eventHasEnded && !hasShownEndAlertRef.current) {
//                     hasShownEndAlertRef.current = true;
//                     stopTracking();
//                     Alert.alert(
//                         "Event Concluded",
//                         "The event has ended. Attendance tracking has been stopped automatically.",
//                         [{ text: "OK" }],
//                     );
//                 }
//             },
//         ).then((subscription) => {
//             subscriptionRef.current = subscription;
//         });
//     };

//     const stopTracking = () => {
//         if (trackingIntervalRef.current) {
//             clearInterval(trackingIntervalRef.current);
//             trackingIntervalRef.current = null;
//         }

//         if (subscriptionRef.current?.unsubscribe) {
//             subscriptionRef.current.unsubscribe();
//             subscriptionRef.current = null;
//         }

//         stopAttendanceTrackingFn({
//             setIsTracking: (tracking) => {
//                 setTrackingState((prev) => ({
//                     ...prev,
//                     isTracking:
//                         typeof tracking === "function"
//                             ? tracking(prev.isTracking)
//                             : tracking,
//                 }));
//             },
//         });

//         // Reset state
//         setTrackingState({
//             isTracking: false,
//             eventId: null,
//             locationId: null,
//             lastTrackingTime: null,
//             eventStatus: null,
//             latitude: null,
//             longitude: null,
//         });
//     };

//     return (
//         <AttendanceTrackingContext.Provider
//             value={{
//                 trackingState,
//                 startTracking,
//                 stopTracking,
//             }}
//         >
//             {children}
//         </AttendanceTrackingContext.Provider>
//     );
// }

// export function useAttendanceTracking() {
//     const context = useContext(AttendanceTrackingContext);
//     if (context === undefined) {
//         throw new Error(
//             "useAttendanceTracking must be used within AttendanceTrackingProvider",
//         );
//     }
//     return context;
// }
