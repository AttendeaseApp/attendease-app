import { Dispatch, SetStateAction } from "react";

export interface StopAttendanceTrackingParams {
  setIsTracking: Dispatch<SetStateAction<boolean>>;
}

/**
 * Stops attendance tracking by setting isTracking to false.
 *
 * @param params - Object containing setIsTracking state setter
 */
export function useStopAttendanceTracking({
  setIsTracking,
}: StopAttendanceTrackingParams) {
  setIsTracking(false);
}
