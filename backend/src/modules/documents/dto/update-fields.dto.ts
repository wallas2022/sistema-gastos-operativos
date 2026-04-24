import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class UpdateExtractedFieldDto {
  @IsUUID()
  id: string;

  @IsString()
  fieldValue: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsBoolean()
  reviewed?: boolean;
}

export class UpdateDocumentFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateExtractedFieldDto)
  fields: UpdateExtractedFieldDto[];
}