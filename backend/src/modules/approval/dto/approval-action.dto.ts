import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ApprovalCommentDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RequiredApprovalCommentDto {
  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class DelegateApprovalDto extends RequiredApprovalCommentDto {
  @IsUUID()
  targetUserId: string;
}

export class ReassignApprovalDto extends RequiredApprovalCommentDto {
  @IsUUID()
  targetUserId: string;
}
