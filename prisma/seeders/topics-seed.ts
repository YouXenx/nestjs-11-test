import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TopicData {
  name: string;
  description?: string;
  image?: string;
}

interface TopicsJsonData {
  data: TopicData[];
}

export async function topicsSeed() {
  const topicsPath = path.resolve(__dirname, 'data', 'topics.json');
  const topicsRaw = fs.readFileSync(topicsPath, 'utf-8');
  const topicsJson = JSON.parse(topicsRaw) as TopicsJsonData;
  const topics = topicsJson.data;

  for (const topicData of topics) {
    let topic = await prisma.topic.findFirst({
      where: {
        name: topicData.name,
      },
    });

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: topicData.name,
          description: topicData.description ?? null,
          image: topicData.image ?? null,
        },
      });

      console.log(`✅ Topic "${topic.name}" created.`);
    } else {
      console.log(`⚠️  Topic "${topic.name}" already exists. Skipping.`);
    }

    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: topicData.name,
        topicId: topic.id,
      },
    });

    if (!existingSubject) {
      await prisma.subject.create({
        data: {
          name: topicData.name,
          description: topicData.description ?? null,
          image: topicData.image ?? null,
          topicId: topic.id,
        },
      });

      console.log(`✅ Subject "${topicData.name}" created.`);
    } else {
      console.log(`⚠️  Subject "${topicData.name}" already exists. Skipping.`);
    }
  }
}

// For running directly
if (require.main === module) {
  topicsSeed()
    .catch((e: unknown) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
