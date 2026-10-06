import { BudgetSourceType } from '@prisma/client';

export type BudgetIssueSeverity = 'ERROR' | 'WARNING';
export interface BudgetImportIssue { severity: BudgetIssueSeverity; code: string; message: string; sheet?: string; row?: number; column?: string; }
export interface BudgetSourceLine { sourceRow: number; sourceCountryCode: string; businessUnit: string; objectCode: string; subCode: string; accountCode: string; accountDescription: string; detailDescription: string; area: string; frequency?: string; currency: string; months: number[]; annualAmount: number; sourceAnnualAmount?: number; sourceComment?: string; }
export interface BudgetSourceDocument { sourceType: BudgetSourceType; sourceFileName: string; sourceHash: string; sourceSheet: string; sourceUpdatedAt?: string; fiscalYear: number; lines: BudgetSourceLine[]; issues: BudgetImportIssue[]; metadata: Record<string, unknown>; }
