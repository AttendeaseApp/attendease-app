import * as TaskManager from "expo-task-manager"
import * as Location from "expo-location"
import { attendanceTrackingService } from "@/server/service/api/attendance/tracking/attendance-tracking-service"
import { checkEventStatus } from "@/hooks/events/status/checkEventStatus"

export const ATTENDANCE_TRACKING_TASK = "ATTENDANCE_TRACKING_TASK"

TaskManager.defineTask(ATTENDANCE_TRACKING_TASK, async ({ data, error }) => {
     if (error) {
          console.error("[AttendanceTask] Task error:", error)
          return
     }

     const { locations } = data as any
     const location = locations?.[0]
     if (!location) return

     const { latitude, longitude } = location.coords
     const { eventId, locationId } = location.extras || {}

     if (!eventId || !locationId) {
          console.warn("[AttendanceTask] Missing eventId or locationId")
          return
     }

     try {
          const statusResult = await checkEventStatus(eventId)

          if (!statusResult.success || !statusResult.data) return

          const { eventIsOngoing, eventHasEnded } = statusResult.data

          if (eventHasEnded) {
               console.log("[AttendanceTask] Event ended – stopping background tracking")
               await Location.stopLocationUpdatesAsync(ATTENDANCE_TRACKING_TASK)
               return
          }

          if (!eventIsOngoing) {
               console.log("[AttendanceTask] Event not ongoing – skipping ping")
               return
          }

          await attendanceTrackingService(eventId, locationId, latitude, longitude)

          console.log(`[AttendanceTask] Attendance ping sent: ${latitude}, ${longitude}`)
     } catch (err) {
          console.error("[AttendanceTask] Ping failed:", err)
     }
})
