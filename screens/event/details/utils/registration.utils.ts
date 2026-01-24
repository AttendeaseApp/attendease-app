import { Alert } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { AttendanceStatusEnum } from "@/domain/enums/attendance/status/attendance.status.enum"
import { checkEventRegistrationStatus } from "@/server/service/api/event/registration/check-event-registration-status"

interface RegistrationConfig {
     facialEnabled: boolean
     attendanceMonitoringEnabled: boolean
     strictLocationValidation: boolean
}

export function getRegistrationConfig(eventData: any): RegistrationConfig {
     return {
          facialEnabled: eventData?.facialVerificationEnabled ?? true,
          attendanceMonitoringEnabled: eventData?.attendanceLocationMonitoringEnabled ?? true,
          strictLocationValidation: eventData?.strictLocationValidation ?? false,
     }
}

export function shouldRequireFacialVerification(config: RegistrationConfig): boolean {
     return config.facialEnabled && !config.attendanceMonitoringEnabled
}

export function shouldStartAttendanceTracking(config: RegistrationConfig, eventData: any): boolean {
     return config.attendanceMonitoringEnabled && !!eventData?.venueLocationId
}

export async function checkBiometricsRegistration(): Promise<boolean> {
     const registrationComplete = await AsyncStorage.getItem("facialRegistrationComplete")
     return registrationComplete === "true"
}

export function showBiometricRegistrationAlert(
     onRegister: () => void,
     onCancel?: () => void
): void {
     Alert.alert(
          "Biometric Registration Required",
          "This event requires facial verification, but you haven't registered your biometric data yet. Would you like to register now?",
          [
               {
                    text: "Cancel",
                    style: "cancel",
                    onPress: onCancel,
               },
               {
                    text: "Register Biometrics",
                    onPress: onRegister,
               },
          ],
          { cancelable: true }
     )
}

export function getButtonText(
     loading: boolean,
     registrationInProgress: boolean,
     requireFace: boolean
): string {
     if (loading || registrationInProgress) {
          return "REGISTERING..."
     }
     if (requireFace) {
          return "VERIFY"
     }
     return "REGISTER"
}

export function isRegistrationDisabled(
     registered: boolean,
     eventStatus: string,
     EventStatus: any
): boolean {
     return registered || eventStatus === EventStatus.CONCLUDED
}

export function shouldTriggerAutoUpgrade(
     attendanceStatus: string,
     strictLocationValidation: boolean,
     isPollingForUpgrade: boolean
): boolean {
     return (
          attendanceStatus === AttendanceStatusEnum.PARTIALLY_REGISTERED &&
          strictLocationValidation &&
          !isPollingForUpgrade
     )
}

export function shouldResumeTracking(
     status: any,
     attendanceMonitoringEnabled: boolean,
     venueLocationId: string | undefined,
     isTrackingThisEvent: boolean
): boolean {
     const validStatuses = [
          AttendanceStatusEnum.REGISTERED,
          AttendanceStatusEnum.LATE,
          AttendanceStatusEnum.PRESENT,
          AttendanceStatusEnum.IDLE,
     ]

     return (
          status.registered &&
          validStatuses.includes(status.attendanceStatus) &&
          attendanceMonitoringEnabled &&
          !!venueLocationId &&
          !isTrackingThisEvent
     )
}

export async function handlePostRegistration(
     eventId: string,
     strictLocationValidation: boolean,
     shouldStartTracking: boolean,
     eventData: any,
     startAutoUpgradePolling: () => void,
     startTracking: (eventId: string, venueLocationId: string) => void,
     setRegistrationStatus: (status: any) => void
): Promise<void> {
     try {
          console.log("[Registration] Registration successful, fetching updated status...")
          const updatedStatus = await checkEventRegistrationStatus(eventId)
          setRegistrationStatus(updatedStatus)

          if (
               updatedStatus.attendanceStatus === AttendanceStatusEnum.PARTIALLY_REGISTERED &&
               strictLocationValidation
          ) {
               console.log("[Registration] Partially registered, starting auto-upgrade polling...")
               startAutoUpgradePolling()
          } else if (shouldStartTracking && updatedStatus.registered) {
               console.log("[Registration] Starting attendance tracking...")
               startTracking(eventId, eventData!.venueLocationId!)
          }
     } catch (error) {
          console.error("[Registration] Failed to refresh status after registration:", error)
     }
}
