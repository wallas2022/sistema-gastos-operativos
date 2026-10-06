import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateDocumentFieldsDto } from './dto/update-fields.dto';
import { ConfirmOcrDto } from './dto/confirm-ocr.dto';
import { UpdateLineItemsDto } from './dto/update-line-items.dto';
import { CreateValidationRunDto } from './dto/create-validation-run.dto';
import { UpdateOcrTotalDto } from './dto/update-total.dto';


@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Get('analytics/metrics')
  metrics(@Req() req: any) { return this.ocrService.metrics(req.user); }

  @Post(':documentId')
  process(@Param('documentId') documentId: string, @Req() req: any) {
    return this.ocrService.processDocument(documentId, req.user);
  }

  @Get(':documentId/result')
  getResult(@Param('documentId') documentId: string, @Req() req: any) {
    return this.ocrService.getResult(documentId, req.user);
  }

  @Put(':documentId/fields')
  updateFields(
    @Param('documentId') documentId: string,
    @Body() dto: UpdateDocumentFieldsDto,
    @Req() req: any,
  ) {
    return this.ocrService.updateFields(documentId, dto, req.user);
  }

  @Put(':documentId/total')
  updateTotal(@Param('documentId') documentId: string, @Body() dto: UpdateOcrTotalDto, @Req() req: any) {
    return this.ocrService.updateTotal(documentId, dto.total, dto.reason, req.user);
  }

 @Post(':documentId/confirm')
  async confirmDocument(
    @Param('documentId') documentId: string,
    @Body() dto: ConfirmOcrDto,
    @Req() req: any,
  ) {
    return this.ocrService.confirmDocument(
      documentId,
      req.user,
      dto.comment,
    );
  }

  @Put(':documentId/items')
  updateLineItems(
    @Param('documentId') documentId: string,
    @Body() dto: UpdateLineItemsDto,
    @Req() req: any,
  ) {
    return this.ocrService.updateLineItems(documentId, dto, req.user);
  }

  @Post(':documentId/validation-runs')
  createValidationRun(@Param('documentId') documentId: string, @Body() dto: CreateValidationRunDto, @Req() req: any) {
    return this.ocrService.createValidationRun(documentId, dto, req.user);
  }

  @Post(':documentId/validate-compliance')
  validateCompliance(@Param('documentId') documentId: string, @Req() req: any) { return this.ocrService.validateCompliance(documentId, req.user); }
}
