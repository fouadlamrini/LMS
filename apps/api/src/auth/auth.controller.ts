import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    // verify credentials
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      return { message: 'Email w password ghalat' };
    }
    // generate JWT
    return this.authService.login(user);
  }
}
