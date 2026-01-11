// Option 1: Change the hook to match the component (RECOMMENDED)
// hooks/events/status/useEventStatus.ts

import { useEffect, useState, useRef } from "react"
import { subscribeEventStatusCheck } from "@/server/service/api/event/status/subscribe-event-status-check"
import { EventStatusCheckResponse } from "@/domain/interface/event/status/event.status.check.response"

interface UseEventStatusMonitoringReturn {
     eventState: EventStatusCheckResponse | null // Changed from eventStatus
     isConnected: boolean
     error: string | null
     lastUpdate: Date | null
}

/**
 * Hook for monitoring real-time event status changes via WebSocket
 * @param eventId - The event ID to monitor
 * @param enabled - Whether to enable monitoring (default: true)
 */
export function useEventStatusMonitoring(
     eventId: string | null,
     enabled: boolean = true
): UseEventStatusMonitoringReturn {
     const [eventState, setEventState] = useState<EventStatusCheckResponse | null>(null) // Changed from eventStatus
     const [isConnected, setIsConnected] = useState(false)
     const [error, setError] = useState<string | null>(null)
     const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
     const subscriptionRef = useRef<any>(null)
     const mountedRef = useRef(true)

     useEffect(() => {
          mountedRef.current = true
          if (!eventId || !enabled) {
               console.log(
                    `[EventStatus] Monitoring disabled for event: ${eventId}, enabled: ${enabled}`
               )
               return
          }

          console.log(`[EventStatus] Starting monitoring for event: ${eventId}`)

          const connect = async () => {
               try {
                    const subscription = await subscribeEventStatusCheck(eventId, (state) => {
                         if (!mountedRef.current) {
                              console.log(
                                   `[EventStatus] Received update but component unmounted: ${eventId}`
                              )
                              return
                         }

                         console.log(
                              `[EventStatus] Status update for ${eventId}:`,
                              state.statusMessage
                         )
                         setEventState(state)
                         setLastUpdate(new Date())
                         setIsConnected(true)
                         setError(null)
                    })

                    if (mountedRef.current) {
                         subscriptionRef.current = subscription
                         setIsConnected(true)
                         console.log(`[EventStatus] Connected to event ${eventId}`)
                    } else {
                         subscription?.unsubscribe?.()
                    }
               } catch (err: any) {
                    if (mountedRef.current) {
                         console.error(`[EventStatus] Failed to connect for event ${eventId}:`, err)
                         setError(err.message || "Failed to connect")
                         setIsConnected(false)
                    }
               }
          }

          connect()

          return () => {
               mountedRef.current = false
               console.log(`[EventStatus] Cleaning up monitoring for event: ${eventId}`)
               if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe?.()
                    subscriptionRef.current = null
               }
               setIsConnected(false)
          }
     }, [eventId, enabled])

     return {
          eventState, // Changed from eventStatus
          isConnected,
          error,
          lastUpdate,
     }
}
