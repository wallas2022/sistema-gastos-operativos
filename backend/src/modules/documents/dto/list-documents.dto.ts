import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ListDocumentsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'CARGADO',
    'PROCESANDO',
    'PROCESADO',
    'PENDIENTE_REVISION',
    'CONFIRMADO',
    'ERROR_OCR',
  ])
  status?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;
}