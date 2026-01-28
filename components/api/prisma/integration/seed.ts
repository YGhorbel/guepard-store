import { PrismaClient } from "@prisma/client";
import { createTestData } from "./fixtures";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test data with new format...");
  await createTestData(prisma);
  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
