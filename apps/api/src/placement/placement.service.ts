import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CareerRoleType, SubmissionStatus } from '@prisma/client';

export interface SkillGapItem {
  skill: string;
  topicId?: string;
  topicSlug?: string;
  courseId?: string;
  studentMastery: number;
  requiredMastery: number;
  gap: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SkillGapAnalysisResult {
  roleType: CareerRoleType;
  roleTitle: string;
  readinessScore: number;
  hiringBarStatus: 'MEETS_BAR' | 'NEAR_BAR' | 'DEVELOPING';
  verifiedSkills: Array<{ skill: string; mastery: number; required: number }>;
  skillGaps: SkillGapItem[];
  mockTestsTaken: number;
  avgMockScore: number;
  personalizedRoadmap: string[];
}

@Injectable()
export class PlacementService {
  private readonly logger = new Logger('PlacementService');

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Retrieves all active industry career benchmarks.
   */
  async getBenchmarks() {
    return this.prisma.careerRoleBenchmark.findMany({
      where: { active: true },
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Retrieves a specific benchmark by role type.
   */
  async getBenchmarkByRole(roleType: CareerRoleType) {
    const benchmark = await this.prisma.careerRoleBenchmark.findUnique({
      where: { roleType },
    });

    if (!benchmark) {
      throw new NotFoundException(`Career role benchmark for ${roleType} not found.`);
    }

    return benchmark;
  }

  /**
   * Resolves StudentProfile id from a studentId or userId.
   */
  private async resolveStudentProfileId(identifier: string): Promise<string> {
    const studentProfile = await this.prisma.studentProfile.findFirst({
      where: {
        OR: [{ id: identifier }, { userId: identifier }],
      },
    });

    if (studentProfile) {
      return studentProfile.id;
    }

    // If identifier is directly a valid profile
    return identifier;
  }

  /**
   * Fetches or initializes a student's placement profile.
   */
  async getStudentProfile(rawStudentId: string) {
    const studentProfileId = await this.resolveStudentProfileId(rawStudentId);

    let profile = await this.prisma.studentPlacementProfile.findUnique({
      where: { studentId: studentProfileId },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
            authorizedStudent: { select: { name: true, enrollmentNumber: true } },
          },
        },
      },
    });

    if (!profile) {
      profile = await this.prisma.studentPlacementProfile.create({
        data: {
          studentId: studentProfileId,
          targetRole: CareerRoleType.SDE,
          overallReadinessScore: 0.0,
          verifiedSkillsCount: 0,
          skillGapsCount: 0,
        },
        include: {
          student: {
            include: {
              user: { select: { email: true } },
              authorizedStudent: { select: { name: true, enrollmentNumber: true } },
            },
          },
        },
      });
    }

    return profile;
  }

  /**
   * Updates student's target career role and recalculates readiness.
   */
  async setTargetRole(rawStudentId: string, targetRole: CareerRoleType) {
    const studentProfileId = await this.resolveStudentProfileId(rawStudentId);
    const benchmark = await this.getBenchmarkByRole(targetRole);

    const analysis = await this.evaluateStudentReadiness(studentProfileId, targetRole);

    const updatedProfile = await this.prisma.studentPlacementProfile.upsert({
      where: { studentId: studentProfileId },
      create: {
        studentId: studentProfileId,
        targetRole,
        overallReadinessScore: analysis.readinessScore,
        verifiedSkillsCount: analysis.verifiedSkills.length,
        skillGapsCount: analysis.skillGaps.length,
      },
      update: {
        targetRole,
        overallReadinessScore: analysis.readinessScore,
        verifiedSkillsCount: analysis.verifiedSkills.length,
        skillGapsCount: analysis.skillGaps.length,
        lastAssessedAt: new Date(),
      },
    });

    return {
      profile: updatedProfile,
      benchmark,
      analysis,
    };
  }

  /**
   * Evaluates student's skill gap against target role benchmark dynamically.
   */
  async evaluateStudentReadiness(rawStudentId: string, roleType?: CareerRoleType): Promise<SkillGapAnalysisResult> {
    const studentProfileId = await this.resolveStudentProfileId(rawStudentId);
    const profile = await this.getStudentProfile(studentProfileId);
    const targetRole = roleType || profile.targetRole;
    const benchmark = await this.getBenchmarkByRole(targetRole);

    // Fetch student's authentic skill masteries
    const masteries = await this.prisma.skillMastery.findMany({
      where: { studentId: studentProfileId },
      include: {
        topic: {
          include: {
            course: true,
          },
        },
      },
    });

    // Fetch student's real assessment submissions
    const submissions =
      (await this.prisma.assessmentSubmission?.findMany({
        where: {
          studentId: studentProfileId,
          status: SubmissionStatus.EVALUATED,
        },
        select: {
          percentage: true,
          totalScore: true,
          passed: true,
        },
      })) || [];

    const mockTestsTaken = submissions.length;
    const avgMockScore =
      mockTestsTaken > 0
        ? Math.round(
          (submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / mockTestsTaken) * 10,
        ) / 10
        : 0.0;

    // Calculate baseline curriculum mastery across all completed topics
    const activeTopicScores = masteries
      .map((m) => m.masteryScore ?? 0)
      .filter((s) => typeof s === 'number' && s > 0);
    const avgMasteryAcrossAllTopics =
      activeTopicScores.length > 0
        ? activeTopicScores.reduce((acc, v) => acc + v, 0) / activeTopicScores.length
        : 0;

    interface BenchmarkSkillItem {
      topicSlug?: string;
      topicName?: string;
      skill?: string;
      minMastery?: number;
      weight?: number;
    }

    let parsedSkills: BenchmarkSkillItem[] = [];
    try {
      const parsed = JSON.parse(benchmark.requiredSkills);
      if (Array.isArray(parsed)) {
        parsedSkills = parsed;
      } else {
        parsedSkills = Object.entries(parsed).map(([k, v]) => ({
          topicName: k,
          minMastery: Number(v),
          weight: 1.0,
        }));
      }
    } catch {
      parsedSkills = [
        { topicSlug: 'arrays', topicName: 'Arrays', minMastery: 85, weight: 1.2 },
        { topicSlug: 'trees', topicName: 'Trees', minMastery: 80, weight: 1.2 },
        { topicSlug: 'dynamic-programming', topicName: 'Dynamic Programming', minMastery: 75, weight: 1.3 },
      ];
    }

    const domainTaxonomy: Record<string, string[]> = {
      arrays: ['array', 'arrays', 'matrix', 'matrices', 'vector', 'container', 'dynamic-array', 'contiguous', 'structured'],
      linkedLists: ['linked-list', 'linked', 'pointer', 'pointers', 'singly', 'doubly', 'node', 'lists'],
      trees: ['tree', 'trees', 'bst', 'binary-search', 'binary', 'heap', 'traversal', 'balanced'],
      graphs: ['graph', 'graphs', 'shortest-path', 'shortest paths', 'dijkstra', 'bfs', 'dfs', 'neural'],
      dp: ['dynamic-programming', 'dynamic', 'dp', 'memoization', 'optimization', 'paradigms', 'subproblem'],
      dbms: ['sql', 'dbms', 'database', 'relational', 'normalization', 'query', 'indexing'],
      os: ['process', 'processes', 'thread', 'threads', 'concurrency', 'os', 'deadlock', 'operating'],
    };

    const verifiedSkills: Array<{ skill: string; mastery: number; required: number }> = [];
    const skillGaps: SkillGapItem[] = [];

    let totalWeight = 0;
    let earnedWeight = 0;

    for (const item of parsedSkills) {
      const skillName = item.topicName || item.skill || 'Core Skill';
      const skillSlug = (item.topicSlug || '').toLowerCase().trim();
      const lowerSkillName = skillName.toLowerCase().trim();
      const requiredMastery = item.minMastery || 75.0;
      const weight = item.weight || 1.0;

      // 1. Direct slug or name match
      let studentMastery: number | null = null;
      let matchedTopicId: string | undefined = undefined;
      let matchedTopicSlug: string | undefined = undefined;
      let matchedCourseId: string | undefined = undefined;

      for (const m of masteries) {
        if (!m.topic) continue;
        const mSlug = (m.topic.slug || '').toLowerCase().trim();
        const mName = (m.topic.name || '').toLowerCase().trim();
        if (skillSlug && (mSlug === skillSlug || skillSlug.includes(mSlug) || mSlug.includes(skillSlug))) {
          studentMastery = Math.max(studentMastery ?? 0, m.masteryScore ?? 0);
          matchedTopicId = m.topic.id;
          matchedTopicSlug = m.topic.slug;
          matchedCourseId = m.topic.courseId;
        } else if (lowerSkillName && (mName === lowerSkillName || lowerSkillName.includes(mName) || mName.includes(lowerSkillName))) {
          studentMastery = Math.max(studentMastery ?? 0, m.masteryScore ?? 0);
          matchedTopicId = m.topic.id;
          matchedTopicSlug = m.topic.slug;
          matchedCourseId = m.topic.courseId;
        }
      }

      // 2. Taxonomy domain matching
      if (studentMastery === null || studentMastery === 0) {
        let detectedDomain: string | null = null;
        for (const [dom, keywords] of Object.entries(domainTaxonomy)) {
          if (keywords.some((kw) => skillSlug.includes(kw) || lowerSkillName.includes(kw))) {
            detectedDomain = dom;
            break;
          }
        }

        if (detectedDomain) {
          const domKeywords = domainTaxonomy[detectedDomain];
          const matched = masteries.filter((m) => {
            if (!m.topic) return false;
            const tSlug = (m.topic.slug || '').toLowerCase();
            const tName = (m.topic.name || '').toLowerCase();
            return domKeywords.some((kw) => tSlug.includes(kw) || tName.includes(kw));
          });

          if (matched.length > 0) {
            studentMastery = Math.max(...matched.map((m) => m.masteryScore ?? 0));
            if (!matchedTopicId && matched[0].topic) {
              matchedTopicId = matched[0].topic.id;
              matchedTopicSlug = matched[0].topic.slug;
              matchedCourseId = matched[0].topic.courseId;
            }
          }
        }
      }

      // 3. Curriculum baseline credit if student has demonstrated overall mastery or exam capability
      if ((studentMastery === null || studentMastery === 0) && (avgMasteryAcrossAllTopics > 0 || avgMockScore > 0)) {
        const baselineCredit = Math.max(
          avgMasteryAcrossAllTopics > 0 ? avgMasteryAcrossAllTopics * 0.65 : 0,
          avgMockScore > 0 ? avgMockScore * 0.5 : 0,
        );
        studentMastery = Math.round(baselineCredit * 10) / 10;
      }

      const finalMastery = studentMastery !== null ? Math.round(studentMastery * 10) / 10 : 0.0;
      const gap = Math.max(0, Math.round((requiredMastery - finalMastery) * 10) / 10);
      totalWeight += requiredMastery * weight;
      earnedWeight += Math.min(finalMastery, requiredMastery) * weight;

      if (gap <= 0) {
        verifiedSkills.push({
          skill: skillName,
          mastery: finalMastery,
          required: requiredMastery,
        });
      } else {
        const priority: 'HIGH' | 'MEDIUM' | 'LOW' =
          finalMastery === 0 || gap > 25 ? 'HIGH' : gap > 12 ? 'MEDIUM' : 'LOW';
        skillGaps.push({
          skill: skillName,
          topicId: matchedTopicId,
          topicSlug: matchedTopicSlug,
          courseId: matchedCourseId,
          studentMastery: finalMastery,
          requiredMastery,
          gap,
          priority,
        });
      }
    }

    const rawSkillReadiness =
      totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0.0;

    // Synthesize verified competency mastery with assessment / mock exam performance
    let calculatedReadiness = 0.0;
    if (mockTestsTaken > 0 && rawSkillReadiness > 0) {
      calculatedReadiness = Math.round((rawSkillReadiness * 0.7 + avgMockScore * 0.3) * 10) / 10;
    } else if (rawSkillReadiness > 0) {
      calculatedReadiness = Math.round(rawSkillReadiness * 10) / 10;
    } else if (mockTestsTaken > 0) {
      calculatedReadiness = Math.round((avgMockScore * 0.65) * 10) / 10;
    } else {
      calculatedReadiness = 0.0;
    }

    const readinessScore = Math.min(100.0, Math.max(0.0, calculatedReadiness));

    const hiringBarStatus =
      readinessScore >= (benchmark.targetMastery || 80.0)
        ? 'MEETS_BAR'
        : readinessScore >= 55.0
          ? 'NEAR_BAR'
          : 'DEVELOPING';

    // Build dynamic personalized roadmap
    const personalizedRoadmap: string[] = [];
    if (skillGaps.length === 0 && verifiedSkills.length > 0) {
      personalizedRoadmap.push(
        `Milestone 1: Outstanding! You have met the industry hiring bar across all competencies for ${benchmark.title}.`,
      );
      personalizedRoadmap.push(
        `Milestone 2: Take timed placement mock exams to refine your speed and accuracy under interview pressure.`,
      );
      personalizedRoadmap.push(
        `Milestone 3: Your profile is fully eligible for direct campus placement interview referrals with ${benchmark.hiringPartners || 'Tier-1 firms'}.`,
      );
    } else if (skillGaps.length > 0) {
      const topGap = skillGaps[0];
      personalizedRoadmap.push(
        `Step 1: Bridge highest priority delta in "${topGap.skill}" (Need +${topGap.gap}% to reach ${topGap.requiredMastery}% bar).`,
      );
      if (skillGaps[1]) {
        personalizedRoadmap.push(
          `Step 2: Practice adaptive question sets in "${skillGaps[1].skill}" to close the ${skillGaps[1].gap}% requirement gap.`,
        );
      } else {
        personalizedRoadmap.push(
          `Step 2: Solve adaptive problem sets in the Adaptive Practice Arena to reinforce core topics.`,
        );
      }
      if (mockTestsTaken === 0) {
        personalizedRoadmap.push(
          `Step 3: Complete your first proctored ${benchmark.title} screening mock assessment.`,
        );
      } else {
        personalizedRoadmap.push(
          `Step 3: Elevate your mock assessment average from ${avgMockScore}% to ≥${benchmark.targetMastery}%.`,
        );
      }
      personalizedRoadmap.push(
        `Step 4: Reach ≥${benchmark.targetMastery}% aggregate readiness to qualify for campus placement drives with ${benchmark.hiringPartners || 'Tier-1 firms'}.`,
      );
    } else {
      personalizedRoadmap.push(
        `Step 1: Start adaptive practice sessions across curriculum topics to establish your skill baseline.`,
      );
      personalizedRoadmap.push(`Step 2: Complete faculty assessments and timed quizzes.`);
      personalizedRoadmap.push(
        `Step 3: Attempt proctored placement mock exams for ${benchmark.title}.`,
      );
      personalizedRoadmap.push(`Step 4: Unlock prioritized campus placement interview referrals.`);
    }

    // Persist updated scores in DB
    await this.prisma.studentPlacementProfile.upsert({
      where: { studentId: studentProfileId },
      create: {
        studentId: studentProfileId,
        targetRole,
        overallReadinessScore: readinessScore,
        verifiedSkillsCount: verifiedSkills.length,
        skillGapsCount: skillGaps.length,
      },
      update: {
        targetRole,
        overallReadinessScore: readinessScore,
        verifiedSkillsCount: verifiedSkills.length,
        skillGapsCount: skillGaps.length,
        lastAssessedAt: new Date(),
      },
    });

    return {
      roleType: targetRole,
      roleTitle: benchmark.title,
      readinessScore,
      hiringBarStatus,
      verifiedSkills,
      skillGaps: skillGaps.sort((a, b) => b.gap - a.gap),
      mockTestsTaken,
      avgMockScore,
      personalizedRoadmap,
    };
  }

  /**
   * Retrieves placement mock exams with optional role filtering.
   */
  async getMockExams(roleType?: CareerRoleType) {
    return this.prisma.placementMockExam.findMany({
      where: roleType ? { roleType } : {},
      orderBy: { createdAt: 'desc' },
    });
  }
}
