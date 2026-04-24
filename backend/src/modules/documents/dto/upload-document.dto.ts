import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateFieldItemDto {
  @IsUUID()
  id: string;

  @IsString()
  fieldValue: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;
}

export class UpdateDocumentFieldsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateFieldItemDto)
  fields: UpdateFieldItemDto[];
}