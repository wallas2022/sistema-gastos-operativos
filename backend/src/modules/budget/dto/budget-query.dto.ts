import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { BudgetVersionStatus } from '@prisma/client';

export class BudgetQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2100) year?: number;
  @IsOptional() @IsUUID() versionId?: string;
  @IsOptional() @IsEnum(BudgetVersionStatus) status?: BudgetVersionStatus;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() countryId?: string;
  @IsOptional() @IsString() businessUnit?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsString() account?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) month?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() sortBy = 'accountCode';
  @IsOptional() @IsString() sortOrder: 'asc' | 'desc' = 'asc';
}

export class AvailableBudgetQueryDto {
  @IsUUID() companyId!: string;
  @IsUUID() countryId!: string;
  @IsOptional() @IsString() estimatedDate?: string;
}
