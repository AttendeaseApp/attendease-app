export interface EventStatusCheckResponse {
  eventId: string;
  eventHasStarted: boolean;
  eventIsOngoing: boolean;
  eventHasEnded: boolean;
  statusMessage: string;
}
