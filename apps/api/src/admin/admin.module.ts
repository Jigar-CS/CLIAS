import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CounsellorAssignmentService } from './counsellor-assignment.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, CounsellorAssignmentService],
  exports: [AdminService, CounsellorAssignmentService],
})
export class AdminModule {}
