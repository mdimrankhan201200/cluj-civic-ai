import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const FLOWER_IMAGE = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

// Delete government actions first (FK constraint), then reports
const targets = await prisma.report.findMany({
  where: { imageUrl: FLOWER_IMAGE },
  select: { id: true, issueType: true },
});

console.log(`\nFound ${targets.length} flower-image reports to delete:`);
targets.forEach(r => console.log(`  - ${r.id} (${r.issueType})`));

if (targets.length === 0) {
  console.log("Nothing to delete.");
  await prisma.$disconnect();
  process.exit(0);
}

const ids = targets.map(r => r.id);

// Remove child records first
const deletedActions = await prisma.governmentAction.deleteMany({
  where: { reportId: { in: ids } },
});
console.log(`\nDeleted ${deletedActions.count} government action(s).`);

const deletedReports = await prisma.report.deleteMany({
  where: { id: { in: ids } },
});
console.log(`Deleted ${deletedReports.count} report(s).`);
console.log("\n✅ Done. Flower reports removed.");

await prisma.$disconnect();
