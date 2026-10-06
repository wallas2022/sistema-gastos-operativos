import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class UpdateOcrTotalDto {
  @IsNumberString()
  total!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
