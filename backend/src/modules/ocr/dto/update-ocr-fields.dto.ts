import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OcrFieldDto {
  @IsString()
  name: string;

  @IsString()
  detectedValue: string;

  @IsString()
  finalValue: string;

  @IsOptional()
  @IsBoolean()
  corrected?: boolean;
}

export class UpdateOcrFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OcrFieldDto)
  fields: OcrFieldDto[];
}