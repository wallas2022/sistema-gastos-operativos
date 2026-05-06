import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';

@Module({
  imports: [PrismaModule, PassportModule],
  providers: [SecurityService],
  controllers: [SecurityController],
  exports: [SecurityService],
})
export class SecurityModule {}
