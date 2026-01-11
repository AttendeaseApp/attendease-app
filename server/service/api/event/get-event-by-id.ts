import { Event } from "@/domain/interface/event/session/event.session"
import { userAuthenticatedContextFetch } from "@/server/utils/user-authenticated-context-fetch"
import { GET_EVENT_BY_ID } from "@/server/constants/endpoints"

export async function getEventById(eventId: string): Promise<Event> {
     const response = await userAuthenticatedContextFetch(GET_EVENT_BY_ID(eventId), {
          method: "GET",
     })
     if (!response.ok) {
          throw new Error(`Failed to fetch event: ${response.status}`)
     }
     return await response.json()
}
