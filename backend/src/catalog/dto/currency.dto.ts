import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

export class CreateCurrencyDto {
  @IsString()
  @Length(2, 10)
  code: string;

  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 10)
  symbol: string;
}

export class UpdateCurrencyDto {
  @IsOptional()
  @IsString()
  @Length(2, 10)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  symbol?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
