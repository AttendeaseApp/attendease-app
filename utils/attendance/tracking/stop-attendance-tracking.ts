import { Dispatch, SetStateAction } from "react";

export interface StopAttendanceTrackingParams {
    setIsTracking: Dispatch<SetStateAction<boolean>>;
}

/**
 * Returns a function that stops attendance tracking by setting isTracking to false.
 *
 * This is NOT a React hook - it's a regular function that returns a cleanup function.
 *
 * @returns Function to stop tracking
 */
export function useStopAttendanceTracking() {
    return ({ setIsTracking }: StopAttendanceTrackingParams) => {
        setIsTracking(false);
    };
}
