import { AttendanceStatusEnum } from "@/domain/enums/attendance/status/attendance.status.enum"
import { Event } from "@/domain/interface/event/session/event.session"
import {
     checkEventRegistrationStatus,
     RegistrationStatusResponse,
} from "@/server/service/api/event/registration/check-event-registration-status"
import { useCallback, useEffect, useState } from "react"

interface UseRegistrationStatusProps {
     eventId: string
     eventData: Event | null
     isPollingForUpgrade: boolean
     isTrackingThisEvent: boolean
     startAutoUpgradePolling: () => void
     startTracking: (eventId: string, venueLocationId: string) => void
}

export function useRegistrationStatus({
     eventId,
     eventData,
     isPollingForUpgrade,
     isTrackingThisEvent,
     startAutoUpgradePolling,
     startTracking,
}: UseRegistrationStatusProps) {
     const [registrationStatus, setRegistrationStatus] =
          useState<RegistrationStatusResponse | null>(null)
     const [checkingStatus, setCheckingStatus] = useState(true)

     const checkStatus = useCallback(async () => {
          if (!eventId) return

          try {
               setCheckingStatus(true)
               const status = await checkEventRegistrationStatus(eventId)
               console.log("Registration status:", status)
               setRegistrationStatus(status)

               if (
                    status.attendanceStatus === AttendanceStatusEnum.PARTIALLY_REGISTERED &&
                    eventData?.strictLocationValidation &&
                    !isPollingForUpgrade
               ) {
                    startAutoUpgradePolling()
               }

               if (
                    status.registered &&
                    [
                         AttendanceStatusEnum.REGISTERED,
                         AttendanceStatusEnum.LATE,
                         AttendanceStatusEnum.PRESENT,
                         AttendanceStatusEnum.IDLE,
                    ].includes(status.attendanceStatus) &&
                    eventData?.attendanceLocationMonitoringEnabled &&
                    eventData?.venueLocationId &&
                    !isTrackingThisEvent
               ) {
                    console.log("Resuming tracking for registered student")
                    startTracking(eventId, eventData.venueLocationId)
               }
          } catch (error) {
               console.error("Failed to check registration:", error)
          } finally {
               setCheckingStatus(false)
          }
     }, [
          eventId,
          eventData,
          isPollingForUpgrade,
          isTrackingThisEvent,
          startAutoUpgradePolling,
          startTracking,
     ])

     useEffect(() => {
          if (eventData) {
               checkStatus()
          }
     }, [eventData, checkStatus])

     return {
          registrationStatus,
          checkingStatus,
          setRegistrationStatus,
          checkStatus,
     }
}
