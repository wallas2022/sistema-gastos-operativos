import {
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { ExpenseType, PaymentModality, RequestPriority } from "@prisma/client";

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
  @Min(0.01)
  unitAmount: number;
}

export class CreateExpenseRequestDto {
  // Se aceptan por compatibilidad con clientes anteriores, pero el servicio
  // obtiene siempre estos valores del JWT y nunca los persiste desde el body.
  @IsOptional()
  @IsUUID()
  requesterId?: string;

  @IsOptional()
  @IsString()
  requesterName?: string;

  @IsOptional()
  @IsString()
  requesterRole?: string;

  @IsEnum(ExpenseType)
  @IsNotEmpty()
  type: ExpenseType;

  @IsEnum(RequestPriority)
  @IsNotEmpty()
  priority: RequestPriority;

  @IsEnum(PaymentModality)
  paymentModality: PaymentModality;

  @IsOptional()
  @IsString()
  intendedBeneficiaryName?: string;

  @IsOptional()
  @IsString()
  intendedBeneficiaryTaxId?: string;

  @IsString()
  @IsNotEmpty()
  concept: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  justification: string;

  @IsUUID()
  companyId!: string;

  @IsUUID()
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

  @IsUUID()
  budgetLineId!: string;

  @IsUUID()
  budgetPeriodId!: string;

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

  @IsUUID()
  countryId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseRequestItemDto)
  items: CreateExpenseRequestItemDto[];
}

export class UpdateExpenseRequestDto extends CreateExpenseRequestDto {}

export class AssociateExpenseRequestDocumentsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds: string[];
}
