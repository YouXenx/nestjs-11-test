import { PrismaClient } from '@prisma/client';
import { rolesSeed } from './roles-seed';
import { usersSeed } from './users-seed';
import { permissionsSeed } from './permissions-seed';
import { lessonsSeed } from './lessons-seed';
import { coursesSeed } from './courses-seed';
import { topicsSeed } from './topics-seed';
import { courseSectionsSeed } from './course-sections-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding database...');

  // 1. Seed roles terlebih dahulu (dependency untuk users)
  await rolesSeed();

  // 2. Seed permissions (dependency untuk role-permissions)
  await permissionsSeed();

  // 3. Seed users terakhir (membutuhkan roles)
  await usersSeed();

  await topicsSeed();
  await coursesSeed();
  await courseSectionsSeed();
  await lessonsSeed();

  console.log('🎉 Seeding selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
