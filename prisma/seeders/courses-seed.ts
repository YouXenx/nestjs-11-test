import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ReviewData {
  rating: number;
  comment?: string;
  reviewText?: string;
  studentEmail: string;
}

interface CourseData {
  title: string;
  description?: string;
  about?: string;
  price?: number;
  subjectName: string;
  mentorEmail: string;
  keyPoints?: string[];
  personas?: string[];
  images?: string[];
  reviews?: ReviewData[];
}

interface CoursesJsonData {
  data: CourseData[];
}

export async function coursesSeed() {
  const coursesPath = path.resolve(__dirname, 'data', 'courses.json');
  const coursesRaw = fs.readFileSync(coursesPath, 'utf-8');
  const { data: courses } = JSON.parse(coursesRaw) as CoursesJsonData;

  const [subjects, users] = await Promise.all([
    prisma.subject.findMany(),
    prisma.user.findMany(),
  ]);

  for (const course of courses) {
    const subject = subjects.find((s) => s.name === course.subjectName);
    if (!subject) {
      continue;
    }

    const mentor = users.find((u) => u.email === course.mentorEmail);
    if (!mentor) {
      continue;
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        title: course.title,
        subjectId: subject.id,
        mentorId: mentor.id,
      },
    });

    if (existingCourse) continue;

    const createdCourse = await prisma.course.create({
      data: {
        title: course.title,
        description: course.description ?? null,
        about: course.about ?? null,
        price: course.price ?? 0,
        subjectId: subject.id,
        mentorId: mentor.id,
      },
    });

    if (course.keyPoints && course.keyPoints.length > 0) {
      await prisma.courseKeyPoint.createMany({
        data: course.keyPoints.map((point) => ({
          courseId: createdCourse.id,
          keyPoint: point,
        })),
        skipDuplicates: true,
      });
    }

    if (course.personas && course.personas.length > 0) {
      await prisma.coursePersona.createMany({
        data: course.personas.map((persona) => ({
          courseId: createdCourse.id,
          persona,
        })),
        skipDuplicates: true,
      });
    }

    if (course.images && course.images.length > 0) {
      await prisma.courseImage.createMany({
        data: course.images.map((imageUrl) => ({
          courseId: createdCourse.id,
          imagePath: imageUrl,
          orderIndex: 0,
        })),
        skipDuplicates: true,
      });
    }

    if (course.reviews && course.reviews.length > 0) {
      const reviewData = course.reviews
        .map((review) => {
          const student = users.find((u) => u.email === review.studentEmail);
          if (!student) return null;

          return {
            courseId: createdCourse.id,
            studentId: student.id,
            rating: review.rating,
            reviewText: review.reviewText ?? null,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (reviewData.length > 0) {
        await prisma.courseReview.createMany({
          data: reviewData,
          skipDuplicates: true,
        });
      }
    }

    console.log(`✅ Course "${createdCourse.title}" created.`);
  }
}

if (require.main === module) {
  coursesSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
