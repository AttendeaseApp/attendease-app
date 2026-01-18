import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { WEBSOCKET_BASE_URL } from "../constants/endpoints"
import { getAuthToken } from "./token-cache"

let wsClient: Client | null = null
let isConnecting = false
let connectionPromise: Promise<Client> | null = null

/**
 * Returns a connected STOMP WebSocket client
 */
export async function stompConnect(): Promise<Client> {
     if (wsClient && wsClient.connected) {
          return wsClient
     }
     if (isConnecting && connectionPromise) {
          return connectionPromise
     }
     isConnecting = true
     connectionPromise = connectInternal()
     try {
          const client = await connectionPromise
          return client
     } finally {
          isConnecting = false
          connectionPromise = null
     }
}

async function connectInternal(): Promise<Client> {
     const token = await getAuthToken()
     if (!token) throw new Error("No auth token found")
     if (wsClient) {
          try {
               wsClient.deactivate()
          } catch (e) {
               console.warn("Error deactivating old WS client:", e)
          }
     }
     wsClient = new Client({
          webSocketFactory: () => new SockJS(WEBSOCKET_BASE_URL),
          connectHeaders: {
               "Jwt-Token": token,
          },
          debug: __DEV__ ? (msg) => console.log("[LOCATION WS DEBUG]", msg) : undefined, // ⬅️ Only in dev
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          beforeConnect: async () => {
               const freshToken = await getAuthToken()
               if (freshToken && wsClient) {
                    wsClient.connectHeaders = {
                         "Jwt-Token": freshToken,
                    }
               }
          },
     })

     return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
               reject(new Error("WebSocket connection timeout"))
               wsClient?.deactivate()
          }, 15000)

          wsClient!.onConnect = () => {
               clearTimeout(timeoutId)
               if (__DEV__) console.log("Location WebSocket connected")
               resolve(wsClient!)
          }

          wsClient!.onStompError = (frame) => {
               clearTimeout(timeoutId)
               console.error("Location WS ERROR:", frame.headers["message"])
               reject(new Error(frame.headers["message"]))
          }

          wsClient!.onWebSocketError = (event) => {
               clearTimeout(timeoutId)
               console.error("WebSocket connection error:", event)
               reject(new Error("WebSocket connection failed"))
          }

          wsClient!.activate()
     })
}

/**
 * Disconnects and cleans up the WebSocket connection
 */
export function stompDisconnect(): void {
     if (wsClient) {
          try {
               wsClient.deactivate()
               if (__DEV__) console.log("WebSocket disconnected")
          } catch (e) {
               console.warn("Error disconnecting WebSocket:", e)
          } finally {
               wsClient = null
          }
     }
}

/**
 * Check if WebSocket is connected
 */
export function isStompConnected(): boolean {
     return wsClient?.connected ?? false
}
