export interface DecodedToken {
  sub: string;
  studentNumber: string;
  role?: string;
  requiresFacialRegistration: boolean;
  exp: number;
  iat: number;
}
