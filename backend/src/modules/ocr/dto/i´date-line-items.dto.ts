import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLineItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNumber()
  lineNumber: number;

  @IsOptional()
  @IsString()
  article?: string | null;

  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  lineSubtotal?: number | null;

  @IsOptional()
  @IsNumber()
  lineTax?: number | null;

  @IsNumber()
  lineTotal: number;

  @IsOptional()
  @IsBoolean()
  taxIncluded?: boolean | null;

  @IsOptional()
  @IsNumber()
  confidence?: number | null;
}

export class UpdateLineItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLineItemDto)
  items: UpdateLineItemDto[];
}