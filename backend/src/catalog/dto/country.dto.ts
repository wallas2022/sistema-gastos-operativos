import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

export class CreateCountryDto {
  @IsString()
  @Length(2, 10)
  code: string;

  @IsString()
  @Length(1, 100)
  name: string;
}

export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  @Length(2, 10)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
