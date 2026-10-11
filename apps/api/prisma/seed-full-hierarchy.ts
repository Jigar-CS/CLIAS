import {
  PrismaClient,
  UserRole,
  UserStatus,
  QuestionDifficulty,
  QuestionType,
  QuestionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Realistic Indian Student Names Pool
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Dhruv', 'Kabir', 'Rohan', 'Jay', 'Devansh', 'Harshil', 'Manan', 'Om', 'Sahil', 'Utkarsh',
  'Yashraj', 'Fenil', 'Hitarth', 'Jinay', 'Lakshya', 'Naitik', 'Parth', 'Raj', 'Smit', 'Tirth',
  'Vatsal', 'Yash', 'Aum', 'Karan', 'Chirag', 'Het', 'Meet', 'Keval', 'Dhyan', 'Bhavya',
  'Diya', 'Ananya', 'Isha', 'Khushi', 'Neha', 'Pooja', 'Riya', 'Tanvi', 'Vidhi', 'Aayushi',
  'Charmi', 'Esha', 'Gopi', 'Ishani', 'Krisha', 'Mahek', 'Nishi', 'Prachi', 'Riddhi', 'Shreya',
  'Urvi', 'Vrinda', 'Zeel', 'Priya', 'Kavya', 'Sneha', 'Bhoomi', 'Dhara', 'Mansi', 'Heli',
];

const LAST_NAMES = [
  'Patel', 'Shah', 'Sharma', 'Desai', 'Joshi', 'Mehta', 'Trivedi', 'Verma', 'Vora', 'Parikh',
  'Dave', 'Kothari', 'Panchal', 'Bhatt', 'Solanki', 'Soni', 'Makwana', 'Chokshi', 'Vyas', 'Pandya',
  'Jadeja', 'Gohil', 'Zala', 'Rana', 'Barot', 'Prajapati', 'Dabhi', 'Thakkar', 'Raval', 'Ghelani',
  'Gandhi', 'Kapadia', 'Modh', 'Sutariya', 'Kanani', 'Sanghavi', 'Radadiya', 'Moradiya', 'Dobariya', 'Savaliya',
  'Bhalani', 'Gondaliya', 'Dalsaniya', 'Chothani', 'Khunt', 'Limbasiya', 'Vavadiya', 'Kalsariya', 'Sorathiya', 'Chauhan',
];

function generateStudentName(idx: number): { fullName: string; firstName: string } {
  const f = FIRST_NAMES[idx % FIRST_NAMES.length];
  const l = LAST_NAMES[Math.floor(idx / FIRST_NAMES.length) % LAST_NAMES.length];
  return { fullName: `${f} ${l}`, firstName: f };
}

// 7 Departments Config across CSPIT and DEPSTAR
const DEPARTMENTS_CONFIG = [
  // CSPIT
  {
    instituteCode: 'CSPIT',
    deptCode: 'CSE',
    deptName: 'Computer Science and Engineering',
    emailPrefix: 'cs',
    rollPrefix: 'CS',
    courses: [
      { code: 'CS301', name: 'Data Structures and Algorithms', sem: 3 },
      { code: 'CS302', name: 'Operating Systems', sem: 4 },
      { code: 'CS303', name: 'Database Management Systems', sem: 4 },
      { code: 'CS304', name: 'Computer Networks', sem: 5 },
      { code: 'CS305', name: 'Theory of Computation', sem: 5 },
      { code: 'CS306', name: 'Software Engineering', sem: 6 },
    ],
  },
  {
    instituteCode: 'CSPIT',
    deptCode: 'CE',
    deptName: 'Computer Engineering',
    emailPrefix: 'ce',
    rollPrefix: 'CE',
    courses: [
      { code: 'CE301', name: 'Object Oriented Programming with Java', sem: 3 },
      { code: 'CE302', name: 'Computer Organization & Architecture', sem: 4 },
      { code: 'CE303', name: 'Digital Electronics & Logic Design', sem: 4 },
      { code: 'CE304', name: 'Microprocessor & Interfaces', sem: 5 },
      { code: 'CE305', name: 'Embedded Systems & IoT', sem: 5 },
      { code: 'CE306', name: 'Cloud Computing & Virtualization', sem: 6 },
    ],
  },
  {
    instituteCode: 'CSPIT',
    deptCode: 'IT',
    deptName: 'Information Technology',
    emailPrefix: 'it',
    rollPrefix: 'IT',
    courses: [
      { code: 'IT301', name: 'Web Technologies & Frameworks', sem: 3 },
      { code: 'IT302', name: 'Information Security & Cryptography', sem: 4 },
      { code: 'IT303', name: 'Mobile Application Development', sem: 4 },
      { code: 'IT304', name: 'Distributed Systems', sem: 5 },
      { code: 'IT305', name: 'Big Data Analytics', sem: 5 },
      { code: 'IT306', name: 'DevOps & Continuous Delivery', sem: 6 },
    ],
  },
  {
    instituteCode: 'CSPIT',
    deptCode: 'AIML',
    deptName: 'Artificial Intelligence & Machine Learning',
    emailPrefix: 'aiml',
    rollPrefix: 'AIML',
    courses: [
      { code: 'AI301', name: 'Artificial Intelligence Foundations', sem: 3 },
      { code: 'AI302', name: 'Machine Learning Algorithms', sem: 4 },
      { code: 'AI303', name: 'Deep Learning & Neural Networks', sem: 4 },
      { code: 'AI304', name: 'Natural Language Processing', sem: 5 },
      { code: 'AI305', name: 'Computer Vision & Image Processing', sem: 5 },
      { code: 'AI306', name: 'Reinforcement Learning & Robotics', sem: 6 },
    ],
  },
  // DEPSTAR
  {
    instituteCode: 'DEPSTAR',
    deptCode: 'D_CSE',
    deptName: 'Computer Science and Engineering (DEPSTAR)',
    emailPrefix: 'dcs',
    rollPrefix: 'DCS',
    courses: [
      { code: 'DCS301', name: 'Advanced Algorithms & Complexity', sem: 3 },
      { code: 'DCS302', name: 'System Programming & Linux Internals', sem: 4 },
      { code: 'DCS303', name: 'Advanced Database Systems', sem: 4 },
      { code: 'DCS304', name: 'Wireless & Ad-Hoc Networks', sem: 5 },
      { code: 'DCS305', name: 'Cyber Security Essentials', sem: 5 },
      { code: 'DCS306', name: 'Full Stack Development', sem: 6 },
    ],
  },
  {
    instituteCode: 'DEPSTAR',
    deptCode: 'D_CE',
    deptName: 'Computer Engineering (DEPSTAR)',
    emailPrefix: 'dce',
    rollPrefix: 'DCE',
    courses: [
      { code: 'DCE301', name: 'Hardware-Software Co-Design', sem: 3 },
      { code: 'DCE302', name: 'Real-Time Operating Systems', sem: 4 },
      { code: 'DCE303', name: 'VLSI Design & Verification', sem: 4 },
      { code: 'DCE304', name: 'Advanced Microcontrollers', sem: 5 },
      { code: 'DCE305', name: 'Autonomous Systems', sem: 5 },
      { code: 'DCE306', name: 'Network Security & Protocols', sem: 6 },
    ],
  },
  {
    instituteCode: 'DEPSTAR',
    deptCode: 'D_IT',
    deptName: 'Information Technology (DEPSTAR)',
    emailPrefix: 'dit',
    rollPrefix: 'DIT',
    courses: [
      { code: 'DIT301', name: 'Cloud Native Architecture', sem: 3 },
      { code: 'DIT302', name: 'Enterprise Java & Microservices', sem: 4 },
      { code: 'DIT303', name: 'Blockchain Technology & Smart Contracts', sem: 4 },
      { code: 'DIT304', name: 'Data Mining & Warehousing', sem: 5 },
      { code: 'DIT305', name: 'UI/UX Design & HCI', sem: 5 },
      { code: 'DIT306', name: 'Agile Project Management', sem: 6 },
    ],
  },
];

const BATCHES = [
  { yearPrefix: '24', count: 50, sem: 4, gradYear: 2028 },
  { yearPrefix: '23', count: 30, sem: 6, gradYear: 2027 },
  { yearPrefix: '25', count: 30, sem: 2, gradYear: 2029 },
  { yearPrefix: '26', count: 30, sem: 1, gradYear: 2030 },
];

async function main() {
  console.log('🏛️ Starting Comprehensive Multi-Institute Multi-Department Seeding...');

  // Password hashes
  const staffPasswordHash = await bcrypt.hash('clias123', 10);

  // 1. Ensure Institutes
  const cspit = await prisma.institute.upsert({
    where: { code: 'CSPIT' },
    update: { name: 'Chandubhai S Patel Institute of Technology' },
    create: { code: 'CSPIT', name: 'Chandubhai S Patel Institute of Technology' },
  });

  const depstar = await prisma.institute.upsert({
    where: { code: 'DEPSTAR' },
    update: { name: 'Devang Patel Institute of Advance Technology and Research' },
    create: { code: 'DEPSTAR', name: 'Devang Patel Institute of Advance Technology and Research' },
  });

  const institutesMap = { CSPIT: cspit, DEPSTAR: depstar };
  console.log('✅ Institutes ready: CSPIT & DEPSTAR');

  // 2. Ensure Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@charusat.edu.in' },
    update: { passwordHash: staffPasswordHash, status: UserStatus.ACTIVE, role: UserRole.SUPER_ADMIN },
    create: {
      email: 'admin@charusat.edu.in',
      passwordHash: staffPasswordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log('👑 Super Admin ready: admin@charusat.edu.in (clias123)');

  // Clear previous counsellor assignments so user can manually test assigning via upload
  const clearedAssignments = await prisma.counsellorAssignment.deleteMany();
  console.log(`🧹 Reset ${clearedAssignments.count} existing counsellor assignments for fresh test!`);

  let totalStudentsCreated = 0;
  let totalStaffCreated = 0;
  let totalCoursesCreated = 0;

  let nameCounter = 0;

  // 3. Iterate through each Department
  for (const deptConfig of DEPARTMENTS_CONFIG) {
    const inst = institutesMap[deptConfig.instituteCode as keyof typeof institutesMap];

    // Department
    const department = await prisma.department.upsert({
      where: {
        instituteId_code: {
          instituteId: inst.id,
          code: deptConfig.deptCode,
        },
      },
      update: { name: deptConfig.deptName },
      create: {
        instituteId: inst.id,
        code: deptConfig.deptCode,
        name: deptConfig.deptName,
      },
    });

    // Program
    const program = await prisma.program.upsert({
      where: {
        departmentId_code: {
          departmentId: department.id,
          code: `BTECH_${deptConfig.deptCode}`,
        },
      },
      update: { name: `B.Tech ${deptConfig.deptName}` },
      create: {
        departmentId: department.id,
        code: `BTECH_${deptConfig.deptCode}`,
        name: `B.Tech ${deptConfig.deptName}`,
      },
    });

    // 4. Create 6 distinct courses for this department
    const createdCourses: any[] = [];
    for (const cData of deptConfig.courses) {
      const course = await prisma.course.upsert({
        where: { code: cData.code },
        update: { name: cData.name, semester: cData.sem, departmentId: department.id },
        create: {
          code: cData.code,
          name: cData.name,
          semester: cData.sem,
          departmentId: department.id,
        },
      });

      // Ensure at least 2 topics per course
      const t1 = await prisma.topic.upsert({
        where: { courseId_slug: { courseId: course.id, slug: 'fundamentals' } },
        update: { name: 'Core Fundamentals' },
        create: { courseId: course.id, slug: 'fundamentals', name: 'Core Fundamentals' },
      });

      const t2 = await prisma.topic.upsert({
        where: { courseId_slug: { courseId: course.id, slug: 'advanced-concepts' } },
        update: { name: 'Advanced Concepts' },
        create: { courseId: course.id, slug: 'advanced-concepts', name: 'Advanced Concepts' },
      });

      // Ensure at least 1 sample question per course
      const qCount = await prisma.question.count({ where: { courseId: course.id } });
      if (qCount === 0) {
        await prisma.question.create({
          data: {
            courseId: course.id,
            topicId: t1.id,
            type: QuestionType.MCQ_SINGLE,
            difficulty: QuestionDifficulty.MEDIUM,
            questionText: `What is the primary objective of studying ${cData.name}?`,
            explanation: `Understanding theoretical principles and practical applications in ${deptConfig.deptName}.`,
            status: QuestionStatus.APPROVED,
            options: {
              create: [
                { optionText: 'Developing efficient scalable systems', isCorrect: true, order: 1 },
                { optionText: 'Random guessing', isCorrect: false, order: 2 },
                { optionText: 'None of the above', isCorrect: false, order: 3 },
              ],
            },
          },
        });
      }

      createdCourses.push(course);
      totalCoursesCreated++;
    }

    // 5. Staff: 1 HOD, 3 Counsellors, 6 Faculties (Fac 1 & Fac 2 are also counsellors)
    const deptSlug = deptConfig.deptCode.toLowerCase().replace('_', '');
    const instSlug = deptConfig.instituteCode.toLowerCase();

    // HOD
    const hodEmail = `hod.${instSlug}.${deptSlug}@charusat.edu.in`;
    await prisma.user.upsert({
      where: { email: hodEmail },
      update: { passwordHash: staffPasswordHash, status: UserStatus.ACTIVE, role: UserRole.HOD },
      create: {
        email: hodEmail,
        passwordHash: staffPasswordHash,
        role: UserRole.HOD,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });
    totalStaffCreated++;

    const hodUser = await prisma.user.findUnique({ where: { email: hodEmail } });
    if (hodUser) {
      await prisma.facultyProfile.upsert({
        where: { userId: hodUser.id },
        update: { departmentId: department.id },
        create: {
          userId: hodUser.id,
          departmentId: department.id,
          employeeCode: `EMP_${hodEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')}`,
        },
      });
    }

    // Preserve default HOD alias for CSPIT CSE
    if (deptConfig.deptCode === 'CSE' && deptConfig.instituteCode === 'CSPIT') {
      const defaultHod = await prisma.user.upsert({
        where: { email: 'hod@charusat.edu.in' },
        update: { passwordHash: staffPasswordHash, status: UserStatus.ACTIVE, role: UserRole.HOD },
        create: {
          email: 'hod@charusat.edu.in',
          passwordHash: staffPasswordHash,
          role: UserRole.HOD,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        },
      });
      await prisma.facultyProfile.upsert({
        where: { userId: defaultHod.id },
        update: { departmentId: department.id },
        create: {
          userId: defaultHod.id,
          departmentId: department.id,
          employeeCode: 'EMP_HOD_DEFAULT_CSE',
        },
      });
    }

    // 3 Dedicated Counsellors
    for (let cIdx = 1; cIdx <= 3; cIdx++) {
      const counsellorEmail = `counsellor${cIdx}.${instSlug}.${deptSlug}@charusat.edu.in`;
      await prisma.user.upsert({
        where: { email: counsellorEmail },
        update: { passwordHash: staffPasswordHash, status: UserStatus.ACTIVE, role: UserRole.COUNSELLOR },
        create: {
          email: counsellorEmail,
          passwordHash: staffPasswordHash,
          role: UserRole.COUNSELLOR,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        },
      });
      totalStaffCreated++;

      // Preserve default counsellor@charusat.edu.in alias for CSPIT CSE counsellor 1
      if (cIdx === 1 && deptConfig.deptCode === 'CSE' && deptConfig.instituteCode === 'CSPIT') {
        await prisma.user.upsert({
          where: { email: 'counsellor@charusat.edu.in' },
          update: { passwordHash: staffPasswordHash, status: UserStatus.ACTIVE, role: UserRole.COUNSELLOR },
          create: {
            email: 'counsellor@charusat.edu.in',
            passwordHash: staffPasswordHash,
            role: UserRole.COUNSELLOR,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          },
        });
      }
    }

    // 6 Faculties (Each mapped to a distinct subject / course)
    for (let fIdx = 0; fIdx < 6; fIdx++) {
      const assignedCourse = createdCourses[fIdx];
      const facultyNum = fIdx + 1;
      const facultyEmail = `faculty${facultyNum}.${instSlug}.${deptSlug}@charusat.edu.in`;

      const facultyUser = await prisma.user.upsert({
        where: { email: facultyEmail },
        update: { passwordHash: staffPasswordHash, status: UserStatus.ACTIVE, role: UserRole.FACULTY },
        create: {
          email: facultyEmail,
          passwordHash: staffPasswordHash,
          role: UserRole.FACULTY,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        },
      });

      // Faculty Profile linked to this course
      await prisma.facultyProfile.upsert({
        where: { userId: facultyUser.id },
        update: {
          departmentId: department.id,
          courseId: assignedCourse.id,
          employeeCode: `EMP_${deptConfig.deptCode}_${String(facultyNum).padStart(3, '0')}`,
        },
        create: {
          userId: facultyUser.id,
          departmentId: department.id,
          courseId: assignedCourse.id,
          employeeCode: `EMP_${deptConfig.deptCode}_${String(facultyNum).padStart(3, '0')}`,
        },
      });

      totalStaffCreated++;

      // Keep Prof. Dhara Solanki alias mapped to CSPIT CSE Faculty 1 (Data Structures)
      if (fIdx === 0 && deptConfig.deptCode === 'CSE' && deptConfig.instituteCode === 'CSPIT') {
        const dharaUser = await prisma.user.upsert({
          where: { email: 'dharasolanki.cse@charusat.ac.in' },
          update: { passwordHash: staffPasswordHash, status: UserStatus.ACTIVE, role: UserRole.FACULTY },
          create: {
            email: 'dharasolanki.cse@charusat.ac.in',
            passwordHash: staffPasswordHash,
            role: UserRole.FACULTY,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          },
        });
        await prisma.facultyProfile.upsert({
          where: { userId: dharaUser.id },
          update: { departmentId: department.id, courseId: assignedCourse.id, employeeCode: 'EMP_CSE_042' },
          create: { userId: dharaUser.id, departmentId: department.id, courseId: assignedCourse.id, employeeCode: 'EMP_CSE_042' },
        });
      }
    }

    // 6. Students across 4 years (24: 50 students, 23: 30 students, 25: 30 students, 26: 30 students)
    console.log(`👨‍🎓 Seeding students for ${deptConfig.instituteCode} - ${deptConfig.deptCode}...`);

    for (const batch of BATCHES) {
      for (let sNum = 1; sNum <= batch.count; sNum++) {
        const pad = String(sNum).padStart(3, '0');
        const rollNum = `${batch.yearPrefix}${deptConfig.rollPrefix}${pad}`;
        const email = `${batch.yearPrefix}${deptConfig.emailPrefix}${pad}@charusat.edu.in`;

        nameCounter++;
        const { fullName, firstName } = generateStudentName(nameCounter);
        const passPlain = `${firstName.toLowerCase()}@2006`;
        const studentPassHash = await bcrypt.hash(passPlain, 10);

        // AuthorizedStudent
        const authStudent = await prisma.authorizedStudent.upsert({
          where: { enrollmentNumber: rollNum },
          update: {
            name: fullName,
            email,
            institute: deptConfig.instituteCode,
            department: deptConfig.deptName,
            programName: `B.Tech ${deptConfig.deptName}`,
            semester: batch.sem,
            division: sNum <= 25 ? `${deptConfig.rollPrefix} Div 1` : `${deptConfig.rollPrefix} Div 2`,
            graduationYear: batch.gradYear,
            activated: true,
          },
          create: {
            enrollmentNumber: rollNum,
            name: fullName,
            email,
            institute: deptConfig.instituteCode,
            department: deptConfig.deptName,
            programName: `B.Tech ${deptConfig.deptName}`,
            semester: batch.sem,
            division: sNum <= 25 ? `${deptConfig.rollPrefix} Div 1` : `${deptConfig.rollPrefix} Div 2`,
            graduationYear: batch.gradYear,
            activated: true,
          },
        });

        // Student User
        const sUser = await prisma.user.upsert({
          where: { email },
          update: { passwordHash: studentPassHash, status: UserStatus.ACTIVE },
          create: {
            email,
            passwordHash: studentPassHash,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          },
        });

        // Student Profile
        let profile = await prisma.studentProfile.findFirst({
          where: {
            OR: [
              { userId: sUser.id },
              { authorizedStudentId: authStudent.id },
            ],
          },
        });

        if (profile) {
          await prisma.studentProfile.update({
            where: { id: profile.id },
            data: { userId: sUser.id, authorizedStudentId: authStudent.id },
          });
        } else {
          await prisma.studentProfile.create({
            data: {
              userId: sUser.id,
              authorizedStudentId: authStudent.id,
            },
          });
        }

        // Link userId on authorizedStudent
        if (authStudent.userId !== sUser.id) {
          await prisma.authorizedStudent.update({
            where: { id: authStudent.id },
            data: { userId: sUser.id },
          });
        }

        totalStudentsCreated++;
      }
    }
  }

  // Preserve primary demo student account student@charusat.edu.in mapped to 24CS001
  const demoAuth = await prisma.authorizedStudent.findUnique({ where: { enrollmentNumber: '24CS001' } });
  if (demoAuth) {
    const demoPassHash = await bcrypt.hash('rahul@2006', 10);
    const demoUser = await prisma.user.upsert({
      where: { email: 'student@charusat.edu.in' },
      update: { passwordHash: demoPassHash, status: UserStatus.ACTIVE, role: UserRole.STUDENT },
      create: {
        email: 'student@charusat.edu.in',
        passwordHash: demoPassHash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const existingDemoProfile = await prisma.studentProfile.findFirst({
      where: { OR: [{ userId: demoUser.id }, { authorizedStudentId: demoAuth.id }] },
    });
    if (existingDemoProfile) {
      await prisma.studentProfile.update({
        where: { id: existingDemoProfile.id },
        data: { userId: demoUser.id, authorizedStudentId: demoAuth.id },
      });
    } else {
      await prisma.studentProfile.create({
        data: { userId: demoUser.id, authorizedStudentId: demoAuth.id },
      });
    }
  }

  console.log('\n============================================================');
  console.log('🎉 SEEDING COMPLETE WITH PROPER RBAC & MULTI-INSTITUTE DATA!');
  console.log('============================================================');
  console.log(`Institutes: 2 (CSPIT, DEPSTAR)`);
  console.log(`Departments: 7 (CSPIT: CSE, CE, IT, AIML | DEPSTAR: CSE, CE, IT)`);
  console.log(`Total Courses / Distinct Subjects: ${totalCoursesCreated}`);
  console.log(`Total Staff Seeded: ${totalStaffCreated} (7 HODs, 21 Counsellors, 42 Faculties)`);
  console.log(`Total Students Seeded: ${totalStudentsCreated}`);
  console.log('   - 50 students for batch 24 in every department');
  console.log('   - 30 students each for batches 23, 25, 26 in every department');
  console.log('   - 140 students per department = 980 total students');
  console.log('   - Password for all students: <student_name>@2006');
  console.log('   - Password for all staff: clias123');
  console.log('   - Counsellor assignments: 0 (Fresh & ready for Excel/PDF upload!)');
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during full hierarchy seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
