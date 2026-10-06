import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const positiveDecimal = /^(?:0*[1-9]\d*)(?:\.\d{1,10})?$|^0*\.\d*[1-9]\d*$/;

export class CreateExchangeRateDto {
  @IsString()
  @IsNotEmpty()
  fromCurrencyId!: string;

  @IsString()
  @IsNotEmpty()
  toCurrencyId!: string;

  @IsString()
  @Matches(positiveDecimal, { message: 'rate debe ser un decimal positivo con hasta 10 decimales.' })
  rate!: string;

  @IsDateString()
  effectiveDate!: string;
}

export class UpdateExchangeRateDto {
  @IsOptional()
  @IsString()
  @Matches(positiveDecimal, { message: 'rate debe ser un decimal positivo con hasta 10 decimales.' })
  rate?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ExchangeRateQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fromCurrencyId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  toCurrencyId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  active?: string;
}
