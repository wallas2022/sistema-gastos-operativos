import { Controller, Get, NotFoundException, Param, Post, Query, Req, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { ListDocumentsDto } from './dto/list-documents.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('Usuario no autenticado');
    return this.documentsService.upload(file, req.user.id, req.user);
  }

  @Get()
  findAll(@Query() query: ListDocumentsDto, @Req() req: any) {
    return this.documentsService.findAll(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findOne(id, req.user);
  }

  @Get(':id/file')
  async getFile(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const result = await this.documentsService.getFileStream(id, req.user);
    if (!result) throw new NotFoundException('Archivo no encontrado');
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${result.fileName.replace(/[\r\n"]/g, '')}"`);
    return res.send(result.buffer);
  }
}
