import { Controller, Post, Body, UnauthorizedException, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'TRAINER' | 'LEARNER';
}
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.validateUser(body.email, body.password);

    if (result.error) {
      throw new UnauthorizedException(result.error);
    }

    // result.user is guaranteed to exist
    return this.authService.login(result.user!);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: JwtPayload }) {
    return {
      userId: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    };
  }

}
