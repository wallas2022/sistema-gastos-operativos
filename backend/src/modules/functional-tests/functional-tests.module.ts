import { Module } from '@nestjs/common';
import { FunctionalTestsController, FunctionalTestCasesController } from './functional-tests.controller';
import { FunctionalTestsService } from './functional-tests.service';
@Module({controllers:[FunctionalTestsController,FunctionalTestCasesController],providers:[FunctionalTestsService],exports:[FunctionalTestsService]})
export class FunctionalTestsModule {}
