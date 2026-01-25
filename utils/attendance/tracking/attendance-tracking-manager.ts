import * as Location from "expo-location"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ATTENDANCE_TRACKING_TASK } from "./attendance-background-task"

export async function startAttendanceTracking(eventId: string, locationId: string) {
     const fg = await Location.requestForegroundPermissionsAsync()
     if (fg.status !== "granted") {
          throw new Error("Foreground location permission denied")
     }

     const bg = await Location.requestBackgroundPermissionsAsync()
     if (bg.status !== "granted") {
          throw new Error("Background location permission denied")
     }

     const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(ATTENDANCE_TRACKING_TASK)

     if (alreadyRunning) {
          console.log("[AttendanceTracking] Already running")
          return
     }

     await AsyncStorage.setItem("attendanceTracking", JSON.stringify({ eventId, locationId }))

     await Location.startLocationUpdatesAsync(ATTENDANCE_TRACKING_TASK, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 300000,
          distanceInterval: 25,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
               notificationTitle: "Attendance Tracking",
               notificationBody: "Your attendance is being monitored",
          },
          extras: { eventId, locationId },
     } as Location.LocationTaskOptions & {
          extras: { eventId: string; locationId: string }
     })

     console.log("[AttendanceTracking] Background tracking started")
}

export async function stopAttendanceTracking() {
     const isRunning = await Location.hasStartedLocationUpdatesAsync(ATTENDANCE_TRACKING_TASK)

     if (isRunning) {
          await Location.stopLocationUpdatesAsync(ATTENDANCE_TRACKING_TASK)
     }

     await AsyncStorage.removeItem("attendanceTracking")

     console.log("[AttendanceTracking] Background tracking stopped")
}
