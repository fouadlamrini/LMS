import { Request } from 'express';
import { Role } from '../roles/role.enum';

export interface RequestWithUser extends Request {
  user: {
    sub: string; // _id dyal user as string
    role: Role;
    email: string;
  };
}
