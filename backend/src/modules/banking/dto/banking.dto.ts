import { BankAccountType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBankAccountDto {
  @IsUUID() bankId!: string;
  @IsEnum(BankAccountType) accountType!: BankAccountType;
  @IsString() @IsNotEmpty() accountNumber!: string;
  @IsString() @IsNotEmpty() holderName!: string;
  @IsUUID() currencyId!: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateBankAccountDto {
  @IsOptional() @IsUUID() bankId?: string;
  @IsOptional() @IsEnum(BankAccountType) accountType?: BankAccountType;
  @IsOptional() @IsString() @IsNotEmpty() accountNumber?: string;
  @IsOptional() @IsString() @IsNotEmpty() holderName?: string;
  @IsOptional() @IsUUID() currencyId?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsString() comment?: string;
}

export class CreateBankDto {
  @IsString() @IsNotEmpty() code!: string;
  @IsString() @IsNotEmpty() name!: string;
}

export class UpdateBankDto {
  @IsOptional() @IsString() @IsNotEmpty() code?: string;
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
