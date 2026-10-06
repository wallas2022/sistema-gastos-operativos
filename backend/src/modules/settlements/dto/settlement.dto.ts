import { PaymentMethod } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSettlementDto {
  @IsUUID() expenseRequestId!: string;
  @IsUUID() paymentId!: string;
}

export class SelectSettlementDocumentDto {
  @IsUUID() documentId!: string;
}

export class SettlementCommentDto {
  @IsString() @IsNotEmpty() comment!: string;
}

export class CreateSettlementRefundDto {
  @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
  @IsString() @IsNotEmpty() amount!: string;
  @IsUUID() currencyId!: string;
  @IsDateString() operationDate!: string;
  @IsString() @IsNotEmpty() referenceNumber!: string;
  @IsUUID() bankId!: string;
  @IsString() @IsNotEmpty() observations!: string;
}

export class ListSettlementsDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() requesterId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() request?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
