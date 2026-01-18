import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

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

}
