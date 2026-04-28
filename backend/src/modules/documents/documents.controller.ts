import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { OcrService } from '../ocr/ocr.service';







@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: { userId: string } },
  ) {
    return this.documentsService.upload(file, req.user.userId);
  }

 @Get()
  findAll(@Query() query: ListDocumentsDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

   @Get(':id/file')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const result = await this.documentsService.getFileStream(id);

    if (!result) {
      throw new NotFoundException('Archivo no encontrado');
    }

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.fileName}"`,
    );

    return res.send(result.buffer);
  }






}