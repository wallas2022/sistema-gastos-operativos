import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateFieldItemDto {
  @IsString()
  id: string;

  @IsString()
  fieldValue: string;

  @IsOptional()
  @IsNumber()
  confidence?: number | null;
}

export class UpdateDocumentFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFieldItemDto)
  fields: UpdateFieldItemDto[];
}