import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { requirePermission } from '../auth/permissions.util';
import { BudgetImportService } from './budget-import.service';

@Controller('budget-imports')
@UseGuards(JwtAuthGuard)
export class BudgetImportController {
  constructor(private readonly imports: BudgetImportService) {}
  @Post('preview') @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  preview(@UploadedFile() file: Express.Multer.File, @Body('currencyId') currencyId: string, @Req() req: any) { this.authorize(req.user); this.file(file); return this.imports.preview(file, currencyId); }
  @Post() @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  importBudget(@UploadedFile() file: Express.Multer.File, @Body('comment') comment: string, @Body('currencyId') currencyId: string, @Req() req: any) { this.authorize(req.user); this.file(file); return this.imports.importBudget(file, comment, currencyId, req.user); }
  @Get('versions') list(@Req() req: any) { this.authorize(req.user); return this.imports.listVersions(); }
  @Get('versions/:id') detail(@Param('id') id: string, @Req() req: any) { this.authorize(req.user); return this.imports.getVersion(id); }
  @Get('versions/:currentId/compare/:previousId') compare(@Param('currentId') currentId: string, @Param('previousId') previousId: string, @Req() req: any) { this.authorize(req.user); return this.imports.compareVersions(currentId, previousId); }
  private authorize(user: any) { requirePermission(user, 'EXPENSE_REQUEST_VIEW_ALL'); }
  private file(file?: Express.Multer.File): asserts file is Express.Multer.File { if (!file || !file.originalname.toLowerCase().endsWith('.xlsx')) throw new BadRequestException('Debe adjuntar el archivo oficial en formato XLSX.'); }
}
