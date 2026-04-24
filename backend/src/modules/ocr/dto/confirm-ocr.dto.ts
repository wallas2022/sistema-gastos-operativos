import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmOcrDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}