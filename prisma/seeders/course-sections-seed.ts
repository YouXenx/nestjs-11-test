import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CourseSectionData {
  title: string;
  description?: string | null;
  orderIndex: number;
  courseTitle: string;
}

interface CourseSectionsJsonData {
  data: CourseSectionData[];
}

export async function courseSectionsSeed() {
  const courseSectionsPath = path.resolve(
    __dirname,
    'data',
    'course-sections.json',
  );

  const courseSectionsRaw = fs.readFileSync(courseSectionsPath, 'utf-8');
  const courseSectionsJson = JSON.parse(
    courseSectionsRaw,
  ) as CourseSectionsJsonData;

  const courseSections = courseSectionsJson.data;

  for (const section of courseSections) {
    const course = await prisma.course.findFirst({
      where: {
        title: section.courseTitle,
      },
    });

    if (!course) {
      console.warn(
        `⚠️ Course "${section.courseTitle}" not found. Skipping section "${section.title}".`,
      );
      continue;
    }

    const existingSection = await prisma.courseSection.findFirst({
      where: {
        title: section.title,
        courseId: course.id,
      },
    });

    if (!existingSection) {
      await prisma.courseSection.create({
        data: {
          title: section.title,
          description: section.description,
          orderIndex: section.orderIndex,
          courseId: course.id,
        },
      });

      console.log(
        `✅ Section "${section.title}" created under course "${course.title}".`,
      );
    } else {
      console.warn(
        `⚠️ Section "${section.title}" for course "${course.title}" already exists. Skipping.`,
      );
    }
  }
}

// For running directly
if (require.main === module) {
  courseSectionsSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
