import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { ExpenseType, RequestPriority } from "@prisma/client";

export class CreateExpenseRequestItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitAmount: number;
}

export class CreateExpenseRequestDto {
  @IsString()
  @IsNotEmpty()
  type: ExpenseType;

  @IsString()
  @IsOptional()
  priority?: RequestPriority;

  @IsString()
  @IsNotEmpty()
  concept: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  justification?: string;

  @IsString()
  @IsNotEmpty()
  requesterName: string;

  @IsString()
  @IsNotEmpty()
  requesterRole: string;

  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsString()
  @IsNotEmpty()
  currencyId!: string;

  @IsString()
  @IsOptional()
  businessUnit?: string;

  @IsString()
  @IsOptional()
  costCenter?: string;

  @IsString()
  @IsOptional()
  budgetAccount?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  days?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  estimatedDate?: string;

  @IsString()
  @IsNotEmpty()
  countryId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseRequestItemDto)
  items: CreateExpenseRequestItemDto[];
}