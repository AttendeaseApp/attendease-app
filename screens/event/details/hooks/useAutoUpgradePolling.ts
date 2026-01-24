import { useState, useCallback, useRef, useEffect } from "react"
import { Alert } from "react-native"
import { verifyVenueLocationWithAutoUpgrade } from "@/server/service/api/geolocation/verify-venue-location-with-auto-upgrade"
import { checkEventRegistrationStatus } from "@/server/service/api/event/registration/check-event-registration-status"

export function useAutoUpgradePolling(
     eventId: string,
     latitude: number | null,
     longitude: number | null,
     shouldStartTracking: boolean,
     eventData: any,
     startTracking: (eventId: string, venueLocationId: string) => void,
     setRegistrationStatus: (status: any) => void
) {
     const [isPollingForUpgrade, setIsPollingForUpgrade] = useState(false)
     const [autoUpgradeMessage, setAutoUpgradeMessage] = useState<string | null>(null)
     const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

     const stopAutoUpgradePolling = useCallback(() => {
          if (pollingIntervalRef.current) {
               clearInterval(pollingIntervalRef.current)
               pollingIntervalRef.current = null
          }
          setIsPollingForUpgrade(false)
          setAutoUpgradeMessage(null)
     }, [])

     const startAutoUpgradePolling = useCallback(() => {
          if (pollingIntervalRef.current) {
               clearInterval(pollingIntervalRef.current)
          }

          setIsPollingForUpgrade(true)
          setAutoUpgradeMessage(
               "Walking to venue? We'll automatically check you in when you arrive!"
          )

          pollingIntervalRef.current = setInterval(async () => {
               if (latitude === null || longitude === null) return

               try {
                    const response = await verifyVenueLocationWithAutoUpgrade(
                         eventId,
                         latitude,
                         longitude
                    )

                    if (response.autoUpgraded) {
                         stopAutoUpgradePolling()
                         Alert.alert("Registration Completed!", response.message, [
                              {
                                   text: "Ok",
                                   onPress: async () => {
                                        const updatedStatus =
                                             await checkEventRegistrationStatus(eventId)
                                        setRegistrationStatus(updatedStatus)
                                        if (shouldStartTracking) {
                                             startTracking(eventId, eventData!.venueLocationId!)
                                        }
                                   },
                              },
                         ])
                    } else if (response.inside) {
                         stopAutoUpgradePolling()
                    }
               } catch (error) {
                    console.error("Auto-upgrade check failed:", error)
               }
          }, 10000)
     }, [
          eventId,
          latitude,
          longitude,
          stopAutoUpgradePolling,
          shouldStartTracking,
          startTracking,
          eventData,
          setRegistrationStatus,
     ])

     useEffect(() => {
          return () => {
               stopAutoUpgradePolling()
          }
     }, [stopAutoUpgradePolling])

     return {
          isPollingForUpgrade,
          autoUpgradeMessage,
          startAutoUpgradePolling,
          stopAutoUpgradePolling,
     }
}
