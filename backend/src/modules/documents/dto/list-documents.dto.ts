import { IsIn, IsOptional, IsString } from 'class-validator';

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
}