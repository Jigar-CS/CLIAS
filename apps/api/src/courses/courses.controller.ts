import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getCourses(@Request() req: any) {
    return this.coursesService.getAllCourses(req?.user);
  }

  @Get(':id')
  async getCourse(@Param('id') id: string) {
    return this.coursesService.getCourseById(id);
  }

  @Get(':id/questions')
  async getCourseQuestions(@Param('id') id: string) {
    return this.coursesService.getCourseQuestions(id);
  }
}
