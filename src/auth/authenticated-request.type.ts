import type { Request } from 'express';
import { AuthUser } from './auth-user.interface';

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};
