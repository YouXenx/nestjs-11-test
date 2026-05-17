import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TopicData {
  name: string;
  key: string;
}

interface TopicsJsonData {
  data: TopicData[];
}

export async function topicsSeed() {
  const topicsPath = path.resolve(__dirname, 'data', 'topics.json');
  const topicsRaw = fs.readFileSync(topicsPath, 'utf-8');
  const topicsJson = JSON.parse(topicsRaw) as TopicsJsonData;
  const topics = topicsJson.data;
// check if topics already exist

    const existingTopics = await prisma.topic.findMany({
        where: {
            name: {
                in: topics.map((t) => t.name),
            },
        },
    });
    const existingTopicNames = existingTopics.map((t) => t.name);
    const newTopics = topics
        .filter((t) => !existingTopicNames.includes(t.name))
        .map((t) => ({
            name: t.name,
            key: t.key,
        }));
        if (newTopics.length > 0) {
            await prisma.topic.createMany({
                data: newTopics,
                skipDuplicates: true,
            });
            console.log(`✅ ${newTopics.length} new topics seeded`);
        }
        else {
            console.log('⚠️  All topics already exist. Skipping.');
        }
}

// For running directly
if (require.main === module) {
  topicsSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
