import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface SubjectData {
  name: string;
  description?: string;
  topicName: string;
}

interface SubjectsJsonData {
  data: SubjectData[];
}

export async function subjectsSeed() {
  const subjectsPath = path.resolve(__dirname, 'data', 'subjects.json');
  const subjectsRaw = fs.readFileSync(subjectsPath, 'utf-8');
  const subjectsJson = JSON.parse(subjectsRaw) as SubjectsJsonData;
  const subjects = subjectsJson.data;

  // check if subjects already exist
  const existingSubjects = await prisma.subject.findMany({
    where: {
      name: {
        in: subjects.map((s) => s.name),
      },
    },
  });

  const existingSubjectNames = existingSubjects.map((s) => s.name);
  const newSubjects = subjects.filter(
    (s) => !existingSubjectNames.includes(s.name),
  );

  if (newSubjects.length === 0) {
    console.log('⚠️  All subjects already exist. Skipping.');
    return;
  }

  // get all topics for mapping topicName -> topic_id
  const topicNames = [...new Set(newSubjects.map((s) => s.topicName))];
  const topics = await prisma.topic.findMany({
    where: {
      name: {
        in: topicNames,
      },
    },
  });

  const topicMap = new Map(topics.map((t) => [t.name, t.id]));

  const data = newSubjects
    .filter((s) => topicMap.has(s.topicName))
    .map((s) => ({
      name: s.name,
      description: s.description ?? null,
      topicId: topicMap.get(s.topicName)!,
    }));

  await prisma.subject.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`✅ ${data.length} new subjects seeded`);
}

// For running directly
if (require.main === module) {
  subjectsSeed()
    .catch((e: unknown) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
