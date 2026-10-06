import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login') login(@Body() dto: LoginDto) { return this.authService.login(dto); }
  @Post('forgot-password') forgot(@Body() dto: ForgotPasswordDto, @Req() req: any) { return this.authService.forgotPassword(dto, this.ip(req)); }
  @Post('reset-password') reset(@Body() dto: ResetPasswordDto, @Req() req: any) { return this.authService.resetPassword(dto, this.ip(req)); }
  @UseGuards(JwtAuthGuard) @Post('change-password') change(@Body() dto: ChangePasswordDto, @Req() req: any) { return this.authService.changePassword(req.user.id, dto, this.ip(req)); }
  private ip(req: any) { return req.ip || req.socket?.remoteAddress; }
}
