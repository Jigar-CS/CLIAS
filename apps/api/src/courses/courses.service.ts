import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async getAllCourses(requester?: any) {
    // 1. If requester is HOD, restrict to their department's courses
    if (requester?.role === 'HOD') {
      let deptId = requester.departmentId;
      if (!deptId) {
        const faculty = await this.prisma.facultyProfile.findUnique({
          where: { userId: requester.id },
        });
        deptId = faculty?.departmentId;
      }
      if (!deptId && requester.email) {
        const emailParts = requester.email.toLowerCase().split('@')[0].split('.');
        const deptCode = emailParts[emailParts.length - 1].toUpperCase();
        const dept = await this.prisma.department.findFirst({
          where: { OR: [{ code: deptCode }, { code: `D_${deptCode}` }] },
        });
        deptId = dept?.id;
      }
      if (!deptId) {
        const defaultDept = await this.prisma.department.findFirst({
          where: { code: 'CSE' },
        });
        deptId = defaultDept?.id;
      }

      if (deptId) {
        return this.prisma.course.findMany({
          where: { departmentId: deptId },
          include: {
            topics: {
              select: {
                id: true,
                name: true,
                slug: true,
                _count: { select: { questions: true } },
              },
            },
            department: {
              include: { institute: true },
            },
            _count: { select: { questions: true } },
          },
          orderBy: { code: 'asc' },
        });
      }
      return [];
    }

    // 2. If requester is dedicated FACULTY (not HOD or Super Admin)
    if (requester?.role === 'FACULTY' || (requester?.isFaculty && requester?.role !== 'SUPER_ADMIN' && requester?.role !== 'HOD')) {
      let faculty = null;
      if (requester.facultyId) {
        faculty = await this.prisma.facultyProfile.findUnique({
          where: { id: requester.facultyId },
        });
      }
      if (!faculty && requester.id) {
        faculty = await this.prisma.facultyProfile.findUnique({
          where: { userId: requester.id },
        });
      }

      if (faculty) {
        const extraAssignments = ((await this.prisma.$queryRawUnsafe(
          'SELECT courseId FROM faculty_course_assignments WHERE facultyId = ? OR facultyId = ?',
          faculty.id,
          faculty.userId,
        ).catch(() => [])) as any[]) || [];
        const extraCourseIds = Array.isArray(extraAssignments) ? extraAssignments.map((a: any) => a.courseId) : [];
        const allCourseIds = Array.from(new Set([faculty.courseId, ...extraCourseIds].filter(Boolean)));

        if (allCourseIds.length > 0) {
          return this.prisma.course.findMany({
            where: { id: { in: allCourseIds } },
            include: {
              topics: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  _count: { select: { questions: true } },
                },
              },
              department: {
                include: { institute: true },
              },
              _count: { select: { questions: true } },
            },
            orderBy: { code: 'asc' },
          });
        }
      }
    }

    // 3. Super Admin, Students, or general access
    return this.prisma.course.findMany({
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { questions: true } },
          },
        },
        department: {
          include: { institute: true },
        },
        _count: { select: { questions: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getCourseById(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        topics: true,
      },
    });
  }

  async getCourseQuestions(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [
          { id: courseId },
          { code: courseId },
          { code: courseId.toUpperCase() },
        ],
      },
    });
    const targetId = course ? course.id : courseId;

    return this.prisma.question.findMany({
      where: {
        OR: [{ courseId: targetId }, { courseId }, { topic: { courseId: targetId } }],
      },
      include: {
        topic: true,
        options: {
          include: { misconception: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
