import { IsBoolean, IsOptional, IsString, IsUUID, Length } from "class-validator";

export class CreateCompanyDto {
  @IsString()
  @Length(1, 20)
  code: string;

  @IsString()
  @Length(1, 150)
  name: string;

  @IsUUID()
  countryId: string;

  @IsUUID()
  currencyId: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @Length(1, 20)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
