import { IsEmail, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto { @IsEmail() email: string; }
export class ResetPasswordDto { @IsString() token: string; @IsString() @MinLength(1) newPassword: string; @IsString() confirmation: string; }
export class ChangePasswordDto { @IsString() currentPassword: string; @IsString() newPassword: string; @IsString() confirmation: string; }
