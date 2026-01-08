import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'JWT_SECRET_KEY', // khlli JWT_SECRET_KEY f env
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,  
      role: payload.role,
      email: payload.email,
    };
  }
}
