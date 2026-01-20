import React, { createContext, useContext, useState } from "react"
import { Alert } from "react-native"
import {
     startAttendanceTracking,
     stopAttendanceTracking,
} from "@/utils/attendance/tracking/attendance-tracking-manager"

interface TrackingState {
     isTracking: boolean
     eventId: string | null
     locationId: string | null
}

interface AttendanceTrackingContextType {
     trackingState: TrackingState
     startTracking: (eventId: string, locationId: string) => Promise<void>
     stopTracking: () => Promise<void>
}

const AttendanceTrackingContext = createContext<AttendanceTrackingContextType | undefined>(
     undefined
)

export function AttendanceTrackingProvider({ children }: { children: React.ReactNode }) {
     const [trackingState, setTrackingState] = useState<TrackingState>({
          isTracking: false,
          eventId: null,
          locationId: null,
     })

     const startTracking = async (eventId: string, locationId: string) => {
          if (!locationId) {
               Alert.alert(
                    "Tracking Not Available",
                    "Venue location is not configured for this event."
               )
               return
          }

          try {
               await startAttendanceTracking(eventId, locationId)
               setTrackingState({ isTracking: true, eventId, locationId })
          } catch (error: any) {
               Alert.alert("Tracking Error", error.message || "Failed to start tracking")
          }
     }

     const stopTracking = async () => {
          await stopAttendanceTracking()
          setTrackingState({ isTracking: false, eventId: null, locationId: null })
     }

     return (
          <AttendanceTrackingContext.Provider
               value={{ trackingState, startTracking, stopTracking }}
          >
               {children}
          </AttendanceTrackingContext.Provider>
     )
}

export function useAttendanceTracking() {
     const context = useContext(AttendanceTrackingContext)
     if (!context) {
          throw new Error("Client ERROR: AttendanceTrackingProvider")
     }
     return context
}
