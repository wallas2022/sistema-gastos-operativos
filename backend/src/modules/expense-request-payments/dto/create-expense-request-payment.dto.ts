import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

  @IsEnum(PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @IsString()
  @IsNotEmpty()
  currencyId: string;

  @IsNumber()
  @Min(0.01)
  amountPaid: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

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