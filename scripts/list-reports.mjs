import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const reports = await prisma.report.findMany({
  orderBy: { createdAt: "desc" },
  select: { id: true, issueType: true, imageUrl: true, createdAt: true, status: true },
});

console.log(`\nTotal reports: ${reports.length}\n`);
reports.forEach((r, i) => {
  console.log(`[${i + 1}] id=${r.id}`);
  console.log(`     type=${r.issueType}  status=${r.status}`);
  console.log(`     img=${r.imageUrl}`);
  console.log();
});

await prisma.$disconnect();
