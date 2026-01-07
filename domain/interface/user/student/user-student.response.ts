/**
 * Interface matching the backend UserStudentResponse
 */
export interface UserStudentResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  accountStatus: string;
  userType: string;
  createdAt: string;
  updatedAt: string;
  studentId?: string;
  studentNumber?: string;
  section?: string;
  sectionId?: string;
  course?: string;
  courseId?: string;
  cluster?: string;
  clusterId?: string;
  biometricId?: string;
  biometricStatus?: string;
  biometricCreatedAt?: string;
  biometricLastUpdated?: string;
  hasBiometricData: boolean;
}
