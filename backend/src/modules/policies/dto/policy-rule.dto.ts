import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ExpenseType,
  PolicyField,
  PolicyOperator,
  PolicyResultStatus,
  RequestPriority,
  RoleName,
} from '@prisma/client';

export class PolicyRuleDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PolicyField)
  field: PolicyField;

  @IsEnum(PolicyOperator)
  operator: PolicyOperator;

  @IsString()
  @IsNotEmpty()
  comparisonValue: string;

  @IsEnum(PolicyResultStatus)
  action: PolicyResultStatus;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsInt()
  @Min(1)
  @Max(9999)
  priority: number;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsEnum(ExpenseType)
  expenseType?: ExpenseType;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyApprovalStepDto)
  approvalSteps?: PolicyApprovalStepDto[];
}

export class PolicyApprovalStepDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsUUID()
  approverRoleId?: string;

  @IsOptional()
  @IsUUID()
  approverUserId?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class PolicyRuleFiltersDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @IsEnum(ExpenseType)
  expenseType?: ExpenseType;

  @IsOptional()
  @IsEnum(PolicyField)
  field?: PolicyField;

  @IsOptional()
  @IsEnum(PolicyOperator)
  operator?: PolicyOperator;

  @IsOptional()
  @IsEnum(PolicyResultStatus)
  action?: PolicyResultStatus;

  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsIn(['CURRENT', 'UPCOMING', 'EXPIRED'])
  validity?: 'CURRENT' | 'UPCOMING' | 'EXPIRED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['priority', 'code', 'name', 'createdAt', 'updatedAt'])
  sortBy?: 'priority' | 'code' | 'name' | 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class SimulatePolicyDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  countryId: string;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsString()
  budgetAccount?: string;

  @IsEnum(ExpenseType)
  expenseType: ExpenseType;

  @Type(() => Number)
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsEnum(RoleName)
  requesterRole: RoleName;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  days?: number;

  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;
}
