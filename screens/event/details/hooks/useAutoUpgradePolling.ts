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
     const upgradeAttemptedRef = useRef(false)

     const stopAutoUpgradePolling = useCallback(() => {
          if (pollingIntervalRef.current) {
               clearInterval(pollingIntervalRef.current)
               pollingIntervalRef.current = null
          }
          setIsPollingForUpgrade(false)
          setAutoUpgradeMessage(null)
          upgradeAttemptedRef.current = false
          console.log("[AutoUpgrade] Polling stopped")
     }, [])

     const checkForUpgrade = useCallback(async () => {
          if (latitude === null || longitude === null) {
               console.log("[AutoUpgrade] No location data yet")
               return
          }

          try {
               console.log("[AutoUpgrade] Checking at:", { latitude, longitude })

               const response = await verifyVenueLocationWithAutoUpgrade(
                    eventId,
                    latitude,
                    longitude
               )

               console.log("[AutoUpgrade] Response:", response)

               if (response.autoUpgraded) {
                    console.log("[AutoUpgrade] Successfully upgraded!")
                    stopAutoUpgradePolling()

                    Alert.alert("Registration Completed!", response.message, [
                         {
                              text: "Ok",
                              onPress: async () => {
                                   const updatedStatus = await checkEventRegistrationStatus(eventId)
                                   setRegistrationStatus(updatedStatus)

                                   if (
                                        shouldStartTracking &&
                                        eventData?.venueLocation?.locationId
                                   ) {
                                        console.log("[AutoUpgrade] Starting attendance tracking")
                                        startTracking(eventId, eventData.venueLocation.locationId)
                                   }
                              },
                         },
                    ])
                    return
               }

               if (response.inside) {
                    if (upgradeAttemptedRef.current) {
                         console.log("[AutoUpgrade] Inside venue but no upgrade - checking status")

                         const currentStatus = await checkEventRegistrationStatus(eventId)

                         if (
                              currentStatus.registered &&
                              currentStatus.registrationLocationName
                                   ?.toLowerCase()
                                   .includes("venue")
                         ) {
                              console.log("[AutoUpgrade] Already fully registered at venue")
                              stopAutoUpgradePolling()
                              return
                         }
                    }

                    upgradeAttemptedRef.current = true
                    setAutoUpgradeMessage(
                         "You're at the venue. Attempting to complete registration..."
                    )
                    return
               }

               upgradeAttemptedRef.current = false
               setAutoUpgradeMessage("Walking to venue? We'll check you in when you arrive!")
               console.log("[AutoUpgrade] Outside venue - will check again in 10 seconds")
          } catch (error) {
               console.error("[AutoUpgrade] Check failed:", error)
               setAutoUpgradeMessage("Checking your location...")
          }
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

     const startAutoUpgradePolling = useCallback(() => {
          if (pollingIntervalRef.current) {
               console.log("[AutoUpgrade] Clearing existing interval")
               clearInterval(pollingIntervalRef.current)
          }

          console.log("[AutoUpgrade] Starting polling")
          setIsPollingForUpgrade(true)
          setAutoUpgradeMessage(null)
          upgradeAttemptedRef.current = false

          checkForUpgrade()

          pollingIntervalRef.current = setInterval(checkForUpgrade, 10000)
     }, [checkForUpgrade])

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
