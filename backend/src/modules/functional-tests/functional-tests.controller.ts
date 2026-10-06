import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AddTestEvidenceDto, CreateTestCaseDto, CreateTestRecordDto, ExecuteTestCaseDto, UpdateTestCaseDto, UpdateTestRecordDto } from './dto/functional-test.dto';
import { FunctionalTestsService } from './functional-tests.service';
@Controller('test-records') @UseGuards(JwtAuthGuard)
export class FunctionalTestsController {
 constructor(private readonly service:FunctionalTestsService){}
 @Post() create(@Body() dto:CreateTestRecordDto,@Req() req:any){return this.service.create(dto,req.user)}
 @Get() list(@Req() req:any){return this.service.list(req.user)}
 @Get(':id/summary') summary(@Param('id') id:string,@Req() req:any){return this.service.summary(id,req.user)}
 @Get(':id') get(@Param('id') id:string,@Req() req:any){return this.service.get(id,req.user)}
 @Patch(':id') update(@Param('id') id:string,@Body() dto:UpdateTestRecordDto,@Req() req:any){return this.service.update(id,dto,req.user)}
 @Post(':id/close') close(@Param('id') id:string,@Req() req:any){return this.service.close(id,req.user)}
 @Post(':id/cases') addCase(@Param('id') id:string,@Body() dto:CreateTestCaseDto,@Req() req:any){return this.service.addCase(id,dto,req.user)}
}
@Controller('test-cases') @UseGuards(JwtAuthGuard)
export class FunctionalTestCasesController {
 constructor(private readonly service:FunctionalTestsService){}
 @Patch(':id') update(@Param('id') id:string,@Body() dto:UpdateTestCaseDto,@Req() req:any){return this.service.updateCase(id,dto,req.user)}
 @Post(':id/execute') execute(@Param('id') id:string,@Body() dto:ExecuteTestCaseDto,@Req() req:any){return this.service.execute(id,dto,req.user)}
 @Post(':id/evidence') evidence(@Param('id') id:string,@Body() dto:AddTestEvidenceDto,@Req() req:any){return this.service.addEvidence(id,dto.documentId,req.user)}
}
