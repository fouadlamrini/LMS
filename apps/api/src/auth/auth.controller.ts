import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { Role } from 'src/roles/role.enum';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  fullName: string;
}
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.validateUser(
      body.email,
      body.password,
    );

    if (result.error) {
      throw new UnauthorizedException(result.error);
    }

    // result.user is guaranteed to exist
    return this.authService.login(result.user!);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(
    @Req()
    req: {
      user: { userId: string; email: string; role: string; fullName: string };
    },
  ) {
    return {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
    };
  }
}
