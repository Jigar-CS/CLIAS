import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ParsedStudentRow {
  enrollmentNumber: string;
  name: string;
  email: string;
  institute: string;
  department: string;
  program: string;
  semester: number;
  division: string;
  graduationYear: number;
}

export interface RowValidationError {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
}

export interface CsvPreviewResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validRows: ParsedStudentRow[];
  invalidRows: RowValidationError[];
}

@Injectable()
export class AdminService {
  private allowedDomain = process.env.UNIVERSITY_EMAIL_DOMAIN || 'charusat.edu.in';

  constructor(private prisma: PrismaService) {}

  parseCsvText(csvText: string): CsvPreviewResult {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or missing data rows.');
    }

    // Parse header row
    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const expectedCols = [
      'enrollmentnumber',
      'name',
      'email',
      'institute',
      'department',
      'program',
      'semester',
      'division',
      'graduationyear',
    ];

    const colIndexes: Record<string, number> = {};
    for (const exp of expectedCols) {
      const idx = headers.findIndex((h) => h === exp || h.replace(/[\s_-]/g, '') === exp);
      colIndexes[exp] = idx;
    }

    // Validate header presence
    const missingHeaders = expectedCols.filter((col) => colIndexes[col] === -1);
    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `CSV is missing required columns: ${missingHeaders.join(', ')}. Expected: ${expectedCols.join(', ')}`,
      );
    }

    const validRows: ParsedStudentRow[] = [];
    const invalidRows: RowValidationError[] = [];
    const seenEnrollments = new Set<string>();
    const seenEmails = new Set<string>();

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const rawCols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const rowErrors: string[] = [];

      const rawObj: Record<string, string> = {};
      expectedCols.forEach((col) => {
        rawObj[col] = rawCols[colIndexes[col]] || '';
      });

      const enrollmentNumber = rawObj['enrollmentnumber'];
      const name = rawObj['name'];
      const email = rawObj['email']?.toLowerCase();
      const institute = rawObj['institute'];
      const department = rawObj['department'];
      const program = rawObj['program'];
      const semesterRaw = rawObj['semester'];
      const division = rawObj['division'];
      const graduationYearRaw = rawObj['graduationyear'];

      // Validations
      if (!enrollmentNumber) {
        rowErrors.push('Missing enrollment number');
      } else if (seenEnrollments.has(enrollmentNumber.toUpperCase())) {
        rowErrors.push(`Duplicate enrollment number '${enrollmentNumber}' within this CSV`);
      } else {
        seenEnrollments.add(enrollmentNumber.toUpperCase());
      }

      if (!name) {
        rowErrors.push('Missing student name');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        rowErrors.push('Missing email');
      } else if (!emailRegex.test(email)) {
        rowErrors.push(`Invalid email format '${email}'`);
      } else if (!email.endsWith(`@${this.allowedDomain.toLowerCase()}`)) {
        rowErrors.push(`Email domain must be @${this.allowedDomain}`);
      } else if (seenEmails.has(email)) {
        rowErrors.push(`Duplicate email '${email}' within this CSV`);
      } else {
        seenEmails.add(email);
      }

      if (!institute) rowErrors.push('Missing institute code');
      if (!department) rowErrors.push('Missing department');
      if (!program) rowErrors.push('Missing program');
      if (!division) rowErrors.push('Missing division');

      const semester = parseInt(semesterRaw, 10);
      if (isNaN(semester) || semester < 1 || semester > 10) {
        rowErrors.push(`Invalid semester '${semesterRaw}'. Expected integer between 1 and 10`);
      }

      const graduationYear = parseInt(graduationYearRaw, 10);
      if (isNaN(graduationYear) || graduationYear < 2020 || graduationYear > 2040) {
        rowErrors.push(`Invalid graduation year '${graduationYearRaw}'. Expected valid year (2020-2040)`);
      }

      if (rowErrors.length > 0) {
        invalidRows.push({
          rowNumber,
          raw: rawObj,
          errors: rowErrors,
        });
      } else {
        validRows.push({
          enrollmentNumber: enrollmentNumber.toUpperCase(),
          name,
          email,
          institute: institute.toUpperCase(),
          department: department.toUpperCase(),
          program: program.toUpperCase(),
          semester,
          division: division.toUpperCase(),
          graduationYear,
        });
      }
    }

    return {
      totalRows: lines.length - 1,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
    };
  }

  async commitImport(validRows: ParsedStudentRow[]) {
    if (!validRows || validRows.length === 0) {
      throw new BadRequestException('No valid student rows provided for import.');
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of validRows) {
      const existing = await this.prisma.authorizedStudent.findUnique({
        where: { enrollmentNumber: row.enrollmentNumber },
      });

      if (existing) {
        await this.prisma.authorizedStudent.update({
          where: { enrollmentNumber: row.enrollmentNumber },
          data: {
            name: row.name,
            email: row.email,
            institute: row.institute,
            department: row.department,
            programName: row.program,
            semester: row.semester,
            division: row.division,
            graduationYear: row.graduationYear,
          },
        });
        updatedCount++;
      } else {
        await this.prisma.authorizedStudent.create({
          data: {
            enrollmentNumber: row.enrollmentNumber,
            name: row.name,
            email: row.email,
            institute: row.institute,
            department: row.department,
            programName: row.program,
            semester: row.semester,
            division: row.division,
            graduationYear: row.graduationYear,
          },
        });
        insertedCount++;
      }
    }

    return {
      success: true,
      message: `Successfully processed ${validRows.length} authorized student records (${insertedCount} added, ${updatedCount} updated).`,
      insertedCount,
      updatedCount,
    };
  }

  async getAuthorizedStudents(query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 2000;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { enrollmentNumber: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.authorizedStudent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrollmentNumber: 'asc' },
      }),
      this.prisma.authorizedStudent.count({ where }),
    ]);

    // Natural alphanumeric sorting by enrollmentNumber ID
    students.sort((a, b) =>
      (a.enrollmentNumber || '').localeCompare(b.enrollmentNumber || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );

    return {
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDashboardStats() {
    const [totalAuthorized, activatedCount, totalUsers, totalQuestions, totalAttempts] =
      await Promise.all([
        this.prisma.authorizedStudent.count(),
        this.prisma.authorizedStudent.count({ where: { activated: true } }),
        this.prisma.user.count(),
        this.prisma.question.count(),
        this.prisma.questionAttempt.count(),
      ]);

    return {
      totalAuthorizedStudents: totalAuthorized,
      activatedStudents: activatedCount,
      activationRate: totalAuthorized > 0 ? Math.round((activatedCount / totalAuthorized) * 100) : 0,
      totalRegisteredUsers: totalUsers,
      totalQuestionsInBank: totalQuestions,
      totalStudentAttempts: totalAttempts,
    };
  }

  getSampleCsv(): string {
    return `enrollmentNumber,name,email,institute,department,program,semester,division,graduationYear
24CS001,Rahul Patel,rahul@charusat.edu.in,CSPIT,CSE,BTECH,5,A,2028
24CS002,Priya Sharma,priya@charusat.edu.in,CSPIT,CSE,BTECH,5,A,2028
24CS003,Aarav Desai,aarav@charusat.edu.in,CSPIT,CSE,BTECH,5,B,2028
24CS004,Ananya Shah,ananya@charusat.edu.in,CSPIT,CSE,BTECH,5,B,2028
24CS005,Devansh Joshi,devansh@charusat.edu.in,CSPIT,CSE,BTECH,5,A,2028
`;
  }

  private customSettings: Record<string, any> = {};

  async getInstitutes() {
    const institutes = await this.prisma.institute.findMany({
      include: {
        departments: {
          include: {
            courses: true,
            programs: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = await Promise.all(
      institutes.map(async (inst) => {
        const departmentsWithMetrics = await Promise.all(
          inst.departments.map(async (dep) => {
            const studentCount = await this.prisma.authorizedStudent.count({
              where: {
                institute: inst.code,
                OR: [
                  { department: dep.name },
                  { department: dep.code },
                ],
              },
            });

            const facultyCount = await this.prisma.facultyProfile.count({
              where: { departmentId: dep.id },
            });

            const instSlug = inst.code.toLowerCase();
            const deptSlug = dep.code.toLowerCase().replace('_', '');
            const specificHodEmail = `hod.${instSlug}.${deptSlug}@charusat.edu.in`;

            const hodUser = await this.prisma.user.findFirst({
              where: {
                OR: [
                  { email: specificHodEmail },
                  {
                    facultyProfile: { departmentId: dep.id },
                    role: 'HOD',
                  },
                ],
              },
              select: { email: true },
            });

            const hodEmail = hodUser ? hodUser.email : (inst.code === 'CSPIT' && dep.code === 'CSE') ? 'hod@charusat.edu.in' : specificHodEmail;

            return {
              id: dep.id,
              code: dep.code,
              name: dep.name,
              hodName: `Dr. HOD (${dep.code})`,
              hodEmail,
              studentCount,
              facultyCount: Math.max(facultyCount, 1),
              curriculumModules: dep.courses.length,
              accreditation: 'NBA Tier-1 Validated',
            };
          }),
        );

        return {
          id: inst.id,
          code: inst.code,
          name: inst.name,
          deanName: `Dr. Dean (${inst.code})`,
          establishedYear: inst.code === 'CMPICA' ? 1999 : inst.code === 'DEPSTAR' ? 2017 : 2000,
          campusLocation: inst.code === 'CMPICA' ? 'Changa Management Quad' : inst.code === 'DEPSTAR' ? 'Changa Academic Zone B' : 'Changa Academic Zone A',
          departments: departmentsWithMetrics,
        };
      }),
    );

    return result;
  }

  async createDepartment(data: { instituteId: string; code: string; name: string }) {
    if (!data.instituteId || !data.code || !data.name) {
      throw new BadRequestException('Institute ID, department code, and name are required.');
    }
    return this.prisma.department.create({
      data: {
        instituteId: data.instituteId,
        code: data.code.toUpperCase(),
        name: data.name,
      },
    });
  }

  async createInstitute(data: { code: string; name: string }) {
    if (!data.code || !data.name) {
      throw new BadRequestException('Institute code and name are required.');
    }
    return this.prisma.institute.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
      },
    });
  }

  async getSettings() {
    return {
      universityName: process.env.UNIVERSITY_NAME || 'CHARUSAT',
      universityFullName: process.env.UNIVERSITY_FULL_NAME || 'Charotar University of Science and Technology',
      emailDomain: process.env.UNIVERSITY_EMAIL_DOMAIN || 'charusat.edu.in,charusat.ac.in',
      portalTitle: process.env.UNIVERSITY_PORTAL_TITLE || 'CLIAS — Learning Intelligence & Assessment System',
      jwtExpiry: process.env.JWT_EXPIRES_IN || '7d',
      otpExpiryMinutes: 5,
      maxLoginAttempts: 5,
      enforceStrictIsolation: true,
      aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      ragSimilarityThreshold: 0.75,
      socraticMaxTurns: 10,
      emailDriver: process.env.EMAIL_SERVICE_DRIVER || 'development',
      senderEmail: process.env.EMAIL_FROM || 'no-reply@charusat.edu.in',
      ...this.customSettings,
    };
  }

  async updateSettings(settings: Record<string, any>) {
    this.customSettings = { ...this.customSettings, ...settings };
    return this.getSettings();
  }

  // ===========================================================================
  // Faculty Multi-Course Assignment Management (Super Admin & HOD)
  // ===========================================================================

  async getFacultyCourseAssignments(requester?: any) {
    let hodDeptId: string | null = null;
    if (requester?.role === 'HOD') {
      hodDeptId = requester.departmentId;
      if (!hodDeptId) {
        const fac = await this.prisma.facultyProfile.findUnique({
          where: { userId: requester.id },
        });
        hodDeptId = fac?.departmentId || null;
      }
      if (!hodDeptId && requester.email) {
        const emailParts = requester.email.toLowerCase().split('@')[0].split('.');
        const deptCode = emailParts[emailParts.length - 1].toUpperCase();
        const dept = await this.prisma.department.findFirst({
          where: { OR: [{ code: deptCode }, { code: `D_${deptCode}` }] },
        });
        hodDeptId = dept?.id || null;
      }
    }

    // 1. Fetch all faculty profiles with user, department, and primary course (restricted to department if HOD)
    const faculties = await this.prisma.facultyProfile.findMany({
      where: hodDeptId ? { departmentId: hodDeptId } : {},
      include: {
        user: { select: { id: true, email: true, role: true } },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
                institute: { select: { code: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch all rows from faculty_course_assignments
    const rawAssignments = ((await this.prisma.$queryRawUnsafe(
      'SELECT id, facultyId, courseId, assignedAt FROM faculty_course_assignments',
    ).catch(() => [])) as any[]) || [];

    // 3. Fetch courses metadata for extra assignments
    const allAssignedCourseIds = Array.from(new Set(rawAssignments.map((a: any) => a.courseId)));
    const courses = await this.prisma.course.findMany({
      where: { id: { in: allAssignedCourseIds } },
      select: {
        id: true,
        code: true,
        name: true,
        department: {
          select: {
            id: true,
            code: true,
            name: true,
            institute: { select: { code: true, name: true } },
          },
        },
      },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // 4. Fetch available courses: if HOD, strictly their department's courses; if SUPER_ADMIN, all courses
    const availableCourses = await this.prisma.course.findMany({
      where: hodDeptId ? { departmentId: hodDeptId } : {},
      select: {
        id: true,
        code: true,
        name: true,
        semester: true,
        department: {
          select: {
            id: true,
            code: true,
            name: true,
            institute: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: [{ departmentId: 'asc' }, { code: 'asc' }],
    });

    const result = faculties.map((f) => {
      // Find extra assignments for this faculty (matching either f.id or f.userId)
      const assigned = rawAssignments
        .filter((a: any) => a.facultyId === f.id || a.facultyId === f.userId)
        .map((a: any) => {
          const c = courseMap.get(a.courseId);
          return {
            assignmentId: a.id,
            courseId: a.courseId,
            courseCode: c?.code || a.courseId,
            courseName: c?.name || 'Unknown Course',
            department: c?.department,
            assignedAt: a.assignedAt,
          };
        });

      return {
        facultyId: f.id,
        userId: f.userId,
        email: f.user.email,
        employeeCode: f.employeeCode,
        departmentId: f.departmentId,
        primaryCourse: f.course,
        additionalCourses: assigned,
      };
    });

    return {
      faculties: result,
      availableCourses,
      isHOD: !!hodDeptId,
      hodDepartmentId: hodDeptId,
    };
  }

  async assignCourseToFaculty(requester: any, facultyId: string, courseId: string) {
    if (!facultyId || !courseId) {
      throw new BadRequestException('Faculty ID and Course ID are required.');
    }

    // Verify course
    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { code: courseId }] },
    });
    if (!course) {
      throw new BadRequestException('Course not found.');
    }

    // If HOD, verify course belongs to HOD's department
    if (requester?.role === 'HOD') {
      let hodDeptId = requester.departmentId;
      if (!hodDeptId) {
        const fac = await this.prisma.facultyProfile.findUnique({
          where: { userId: requester.id },
        });
        hodDeptId = fac?.departmentId;
      }
      if (!hodDeptId || course.departmentId !== hodDeptId) {
        throw new ForbiddenException(
          'Access denied: As an HOD, you can only assign faculty to subjects within your own department.',
        );
      }
    }

    // Verify faculty
    const faculty = await this.prisma.facultyProfile.findFirst({
      where: { OR: [{ id: facultyId }, { userId: facultyId }] },
    });
    if (!faculty) {
      throw new BadRequestException('Faculty profile not found.');
    }

    // Check if course is already primary
    if (faculty.courseId === course.id) {
      return { success: true, message: `Course ${course.code} is already the primary subject for this faculty.` };
    }

    // Check existing in faculty_course_assignments
    const existing = ((await this.prisma.$queryRawUnsafe(
      'SELECT id FROM faculty_course_assignments WHERE (facultyId = ? OR facultyId = ?) AND courseId = ?',
      faculty.id,
      faculty.userId,
      course.id,
    ).catch(() => [])) as any[]) || [];

    if (existing && existing.length > 0) {
      return { success: true, message: `Faculty is already assigned to ${course.code}.` };
    }

    const id = `fac_course_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await this.prisma.$queryRawUnsafe(
      'INSERT INTO faculty_course_assignments (id, facultyId, courseId, assignedAt) VALUES (?, ?, ?, NOW())',
      id,
      faculty.id,
      course.id,
    );

    return {
      success: true,
      message: `Successfully assigned ${course.code} (${course.name}) to faculty ${faculty.employeeCode || faculty.id}.`,
      assignmentId: id,
    };
  }

  async removeCourseFromFaculty(requester: any, facultyId: string, courseId: string) {
    if (!facultyId || !courseId) {
      throw new BadRequestException('Faculty ID and Course ID are required.');
    }

    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { code: courseId }] },
    });
    if (!course) {
      throw new BadRequestException('Course not found.');
    }

    // If HOD, verify course belongs to HOD's department
    if (requester?.role === 'HOD') {
      let hodDeptId = requester.departmentId;
      if (!hodDeptId) {
        const fac = await this.prisma.facultyProfile.findUnique({
          where: { userId: requester.id },
        });
        hodDeptId = fac?.departmentId;
      }
      if (!hodDeptId || course.departmentId !== hodDeptId) {
        throw new ForbiddenException(
          'Access denied: As an HOD, you can only remove course assignments within your own department.',
        );
      }
    }

    const faculty = await this.prisma.facultyProfile.findFirst({
      where: { OR: [{ id: facultyId }, { userId: facultyId }] },
    });
    if (!faculty) {
      throw new BadRequestException('Faculty profile not found.');
    }

    await this.prisma.$queryRawUnsafe(
      'DELETE FROM faculty_course_assignments WHERE (facultyId = ? OR facultyId = ?) AND (courseId = ? OR courseId = ?)',
      faculty.id,
      faculty.userId,
      course.id,
      course.code,
    );

    return {
      success: true,
      message: `Successfully unassigned ${course.code} from faculty.`,
    };
  }
}
