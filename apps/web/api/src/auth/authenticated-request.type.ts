import { Request } from 'express';

export interface AuthUser {
  userId: string;
  role: string;
  email: string;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
