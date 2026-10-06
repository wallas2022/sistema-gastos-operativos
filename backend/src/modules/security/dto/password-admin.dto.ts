import { IsBoolean, IsOptional, IsString } from 'class-validator';
export class AdminResetPasswordDto { @IsOptional() @IsString() temporaryPassword?: string; @IsOptional() @IsBoolean() forceChange?: boolean; }
