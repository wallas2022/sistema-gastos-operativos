import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodDto {
  CHEQUE = 'CHEQUE',
  TRANSFERENCIA = 'TRANSFERENCIA',
  DEPOSITO = 'DEPOSITO',
  EFECTIVO = 'EFECTIVO',
  OTRO = 'OTRO',
}

export class CreateExpenseRequestPaymentDto {
  @IsString()
  @IsNotEmpty()
  expenseRequestId: string;

  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @IsEnum(PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @IsString()
  @IsNotEmpty()
  currencyId: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amountPaid: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsString()
  @IsNotEmpty()
  referenceNumber: string;

  @IsOptional()
  @IsString()
  beneficiaryName?: string;

  @IsOptional()
  @IsString()
  beneficiaryTaxId?: string;

  @IsOptional()
  @IsString()
  checkNumber?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
