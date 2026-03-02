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
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

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
  async me(
    @Req()
    req: {
      user: { userId: string; email: string; role: string; fullName: string };
    },
  ) {
    // Fetch fresh user data from database instead of using JWT payload
    const user = await this.usersService.getMe(req.user.userId);
    return user;
  }
}
