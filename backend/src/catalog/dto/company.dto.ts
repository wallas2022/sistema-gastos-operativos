import { IsBoolean, IsOptional, IsString, IsUUID, Length } from "class-validator";

export class CreateCompanyDto {
  @IsString()
  @Length(1, 20)
  code: string;

  @IsString()
  @Length(1, 150)
  name: string;

  @IsOptional() @IsString() @Length(1, 200) legalName?: string;
  @IsOptional() @IsString() @Length(1, 150) tradeName?: string;
  @IsOptional() @IsString() @Length(3, 30) taxId?: string;

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

  @IsOptional() @IsString() @Length(1, 200) legalName?: string;
  @IsOptional() @IsString() @Length(1, 150) tradeName?: string;
  @IsOptional() @IsString() @Length(3, 30) taxId?: string;

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
