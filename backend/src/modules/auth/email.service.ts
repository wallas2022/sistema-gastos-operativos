import { Injectable, Logger } from '@nestjs/common';

export type PasswordResetEmail = { to: string; name: string; resetUrl: string; expiresMinutes: number };

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  async sendPasswordReset(message: PasswordResetEmail): Promise<void> {
    // Abstracción de desarrollo: sustituible por SMTP/Microsoft 365/SendGrid sin cambiar AuthService.
    this.logger.log(`Password reset email queued to=${message.to} expiresMinutes=${message.expiresMinutes}`);
  }
}
