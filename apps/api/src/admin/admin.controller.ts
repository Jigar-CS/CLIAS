import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Query,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminService, ParsedStudentRow } from './admin.service';
import { CounsellorAssignmentService } from './counsellor-assignment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private counsellorAssignmentService: CounsellorAssignmentService,
  ) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('institutes')
  async getInstitutes() {
    return this.adminService.getInstitutes();
  }

  @Post('departments')
  async createDepartment(@Body() body: { instituteId: string; code: string; name: string }) {
    return this.adminService.createDepartment(body);
  }

  @Post('institutes')
  async createInstitute(@Body() body: { code: string; name: string }) {
    return this.adminService.createInstitute(body);
  }

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  async updateSettings(@Body() body: any) {
    return this.adminService.updateSettings(body);
  }

  @Post('students/preview-csv')
  @HttpCode(HttpStatus.OK)
  async previewCsv(@Body('csvText') csvText: string) {
    return this.adminService.parseCsvText(csvText);
  }

  @Post('students/import')
  @HttpCode(HttpStatus.OK)
  async commitImport(@Body('rows') rows: ParsedStudentRow[]) {
    return this.adminService.commitImport(rows);
  }

  @Get('students')
  async getStudents(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuthorizedStudents({
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('students/sample-csv')
  getSampleCsv(@Res() res: Response) {
    const csv = this.adminService.getSampleCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="clias_authorized_students_sample.csv"');
    return res.send(csv);
  }

  // ---------------------------------------------------------------------------
  // Counsellor - Student Allocation Management (Super Admin & HOD)
  // ---------------------------------------------------------------------------
  @Post('counsellor-assignments/upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOD)
  @HttpCode(HttpStatus.OK)
  async uploadCounsellorAssignments(
    @Body() body: { fileBase64?: string; fileName?: string; csvText?: string },
  ) {
    if (!body.fileBase64 && !body.csvText) {
      throw new BadRequestException('File payload (fileBase64 or csvText) is required.');
    }

    const fileName = body.fileName || (body.csvText ? 'assignments.csv' : 'assignments.xlsx');
    let buffer: Buffer;

    if (body.fileBase64) {
      // Strip potential base64 prefix (e.g. data:application/pdf;base64,...)
      const cleanBase64 = body.fileBase64.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    } else {
      buffer = Buffer.from(body.csvText || '', 'utf-8');
    }

    return this.counsellorAssignmentService.processUploadedFile(buffer, fileName);
  }

  @Get('counsellor-assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOD)
  async getCounsellorAssignments() {
    return this.counsellorAssignmentService.getAllAssignments();
  }

  @Delete('counsellor-assignments/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOD)
  async deleteCounsellorAssignment(@Param('id') id: string) {
    return this.counsellorAssignmentService.deleteAssignment(id);
  }

  @Get('counsellor-assignments/sample')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOD)
  getSampleCounsellorAssignments(
    @Query('format') format: 'xlsx' | 'csv',
    @Res() res: Response,
  ) {
    const targetFormat = format === 'csv' ? 'csv' : 'xlsx';
    const sample = this.counsellorAssignmentService.getSampleFile(targetFormat);
    res.setHeader('Content-Type', sample.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${sample.filename}"`);
    return res.send(sample.buffer);
  }

  // ---------------------------------------------------------------------------
  // Faculty Multi-Course Assignment Management (Super Admin & HOD)
  // ---------------------------------------------------------------------------

  @Get('faculty-course-assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOD)
  async getFacultyCourseAssignments(@Req() req: any) {
    return this.adminService.getFacultyCourseAssignments(req.user);
  }

  @Post('faculty-course-assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOD)
  async assignCourseToFaculty(
    @Req() req: any,
    @Body() body: { facultyId: string; courseId: string },
  ) {
    return this.adminService.assignCourseToFaculty(req.user, body.facultyId, body.courseId);
  }

  @Delete('faculty-course-assignments/:facultyId/:courseId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOD)
  async removeCourseFromFaculty(
    @Req() req: any,
    @Param('facultyId') facultyId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.adminService.removeCourseFromFaculty(req.user, facultyId, courseId);
  }
}
