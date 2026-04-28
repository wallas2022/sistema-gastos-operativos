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
import { UpdateLineItemsDto } from './dto/i´date-line-items.dto';


@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post(':documentId')
  process(@Param('documentId') documentId: string) {
    return this.ocrService.processDocument(documentId);
  }

  @Get(':documentId/result')
  getResult(@Param('documentId') documentId: string) {
    return this.ocrService.getResult(documentId);
  }

  @Put(':documentId/fields')
  updateFields(
    @Param('documentId') documentId: string,
    @Body() dto: UpdateDocumentFieldsDto,
  ) {
    return this.ocrService.updateFields(documentId, dto);
  }

 @Post(':documentId/confirm')
  async confirmDocument(
    @Param('documentId') documentId: string,
    @Body() dto: ConfirmOcrDto,
    @Req() req: any,
  ) {
    return this.ocrService.confirmDocument(
      documentId,
      req.user.userId,
      dto.comment,
    );
  }

  @Put(':documentId/items')
  updateLineItems(
    @Param('documentId') documentId: string,
    @Body() dto: UpdateLineItemsDto,
  ) {
    return this.ocrService.updateLineItems(documentId, dto);
  }
}
