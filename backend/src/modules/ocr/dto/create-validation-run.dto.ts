import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateValidationRunDto {
  @IsString() documentType: string;
  @IsObject() expectedResult: Record<string, unknown>;
  @IsObject() obtainedResult: Record<string, unknown>;
  @IsBoolean() correct: boolean;
  @IsOptional() @IsString() observations?: string;
}
