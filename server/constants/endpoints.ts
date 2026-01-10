/**
 * Main entry point for the ATTENDEASE BACKEND SERVICE
 */
export const API_BASE_URL = "http://192.168.1.7:8082";

/**
 * WebSocket Base URL
 */
export const WEBSOCKET_BASE_URL = `${API_BASE_URL}/attendease-websocket`;

/**
 * AUTHENTICATION and REGISTRATION
 * Enpoints used for authentication and registration of related info of student
 * - LOGIN_ENDPOINT - Used fot logging in of the student
 * - REGISTER_FACE - Used for biometrics registration
 */
export const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/student/login`;
export const REGISTER_FACE = `${API_BASE_URL}/api/auth/biometrics/register-face-image`;

/**
 * EVENT RETRIEVAL SERVICE
 * Used for event retrieval services with websockets endpoints
 * - RETRIEVE_ONGOING_REGISTRATION_AND_ACTIVE_EVENTS -  Used to retrieve all ONGOING, REGISTRATION, and ACTIVE events
 * - GET_EVENT_BY_ID - Get a specific event using its id
 * - GET_EVENT_STATE_STATUS - Retrieves the current state of an event.
 */
export const RETRIEVE_ONGOING_REGISTRATION_AND_ACTIVE_EVENTS = `${API_BASE_URL}/api/registration/events`;
export const GET_EVENT_BY_ID = (id: string) =>
    `${API_BASE_URL}/api/registration/events/${id}`;
export const GET_EVENT_STATE_STATUS = (id: string) =>
    `${API_BASE_URL}/api/registration/${id}/start-status`;
export const REST_EVENT_RETRIEVAL = `${API_BASE_URL}/api/student/event/homepage`;

/**
 * EVENT REGISTRATION
 * Used mostly for event registration service
 * - REGISTER_STUDENT_ON_EVENT_ENDPOINT -Used to register the authenticated student to an event
 * - PING_ATTENDANCE_ENDPOINT - Used to ping the status on students attendance
 * - CHECK_CURRENT_LOCATION - Used to verify if student is within the registration/venue location
 * - CHECK_ATTENDANCE_STATUS - Used to verify the authenticated students attendance status
 */
export const REGISTER_STUDENT_ON_EVENT_ENDPOINT = `${API_BASE_URL}/api/registration`;
export const PING_ATTENDANCE_ENDPOINT = `${API_BASE_URL}/api/registration/ping`;
export const CHECK_CURRENT_LOCATION = `${API_BASE_URL}/api/registration/check-location`;
export const CHECK_ATTENDANCE_STATUS = (eventId: string) =>
    `${API_BASE_URL}/api/student/event/registration/status/${eventId}`;

/**
 * USER PROFILE SERVICE
 * This endpoints are used student related informations service
 * - RETRIEVE_USER_PROFILE - Used to retrieve the profile of an authenticated student
 * - UPDATE_PASSWORD - Used to update the password of an authenticated student
 * - GET_ATTENDANCE_HISTORY_ENDPOINT - Used to retrieve all the attendance history of a student
 */
export const RETRIEVE_USER_PROFILE = `${API_BASE_URL}/api/profile/me`;
export const UPDATE_PASSWORD = `${API_BASE_URL}/api/profile/update-password`;
export const GET_ATTENDANCE_HISTORY_ENDPOINT = `${API_BASE_URL}/api/attendance/history`;

/**
 * BIOMETRICS MANAGEMENT
 * This endpoints are used to manage the student/s biometrics data
 * - GET_FACIAL_STATUS - Used to get biometrics status of the authenticated student
 * - DELETE_FACIAL_DATA - Used to remove biometrics of the authenticated student
 */
export const GET_FACIAL_STATUS = `${API_BASE_URL}/api/manage/biometrics/status`;
export const DELETE_FACIAL_DATA = `${API_BASE_URL}/api/manage/biometrics/delete`;
