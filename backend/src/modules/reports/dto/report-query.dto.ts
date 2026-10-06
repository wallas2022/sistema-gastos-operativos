import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReportQueryDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() countryId?: string;
  @IsOptional() @IsString() businessUnit?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2100) year?: number;
  @IsOptional() @IsString() account?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() requesterId?: string;
  @IsOptional() @IsString() expenseType?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() documentType?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() costCenter?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 10;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @Transform(({ value }) => String(value).toLowerCase()) @IsIn(['asc', 'desc']) sortOrder: 'asc' | 'desc' = 'asc';
}
