import { PrismaClient, UserRole, IssueType, Severity, ReportStatus, ApprovalStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const officerPassword = await bcrypt.hash("officer123", 12);
  const citizenPassword = await bcrypt.hash("citizen123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cluj.ro" },
    update: {},
    create: {
      name: "Admin Cluj",
      email: "admin@cluj.ro",
      password: adminPassword,
      role: UserRole.ADMIN,
      approvalStatus: ApprovalStatus.ACTIVE,
    },
  });

  const officer = await prisma.user.upsert({
    where: { email: "officer@cluj.ro" },
    update: {},
    create: {
      name: "Ion Popescu (Ofițer)",
      email: "officer@cluj.ro",
      password: officerPassword,
      role: UserRole.GOVERNMENT_OFFICER,
      approvalStatus: ApprovalStatus.ACTIVE,
    },
  });

  const citizen1 = await prisma.user.upsert({
    where: { email: "ion@gmail.com" },
    update: {},
    create: {
      name: "Ion Mureșan",
      email: "ion@gmail.com",
      password: citizenPassword,
      role: UserRole.CITIZEN,
      approvalStatus: ApprovalStatus.ACTIVE,
    },
  });

  const citizen2 = await prisma.user.upsert({
    where: { email: "maria@gmail.com" },
    update: {},
    create: {
      name: "Maria Ionescu",
      email: "maria@gmail.com",
      password: citizenPassword,
      role: UserRole.CITIZEN,
      approvalStatus: ApprovalStatus.ACTIVE,
    },
  });

  const sampleReports = [
    {
      userId: citizen1.id,
      issueType: IssueType.POTHOLE,
      severity: Severity.HIGH,
      description: "Groapă mare în carosabil, periculoasă pentru mașini.",
      status: ReportStatus.WORK_STARTED,
      latitude: 46.7712,
      longitude: 23.6236,
      address: "Strada Napoca, Cluj-Napoca",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      aiSummary: "O groapă semnificativă de dimensiuni mari detectată în carosabil. Prezintă risc ridicat pentru vehicule și bicicliști.",
    },
    {
      userId: citizen1.id,
      issueType: IssueType.BROKEN_STREET_LIGHT,
      severity: Severity.MEDIUM,
      description: "Stâlp de iluminat defect, strada întunecată noaptea.",
      status: ReportStatus.ACCEPTED,
      latitude: 46.7745,
      longitude: 23.6198,
      address: "Bulevardul Eroilor, Cluj-Napoca",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      aiSummary: "Stâlp de iluminat public nefuncțional. Risc mediu de siguranță pentru pietoni pe timp de noapte.",
    },
    {
      userId: citizen2.id,
      issueType: IssueType.GARBAGE,
      severity: Severity.MEDIUM,
      description: "Gunoi aruncat ilegal lângă parc.",
      status: ReportStatus.IN_PROGRESS,
      latitude: 46.7689,
      longitude: 23.5891,
      address: "Parcul Central, Cluj-Napoca",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      aiSummary: "Deșeuri aruncate ilegal lângă zona verde. Necesită curățare urgentă.",
    },
    {
      userId: citizen2.id,
      issueType: IssueType.SIDEWALK_DAMAGE,
      severity: Severity.LOW,
      description: "Trotuar deteriorat, dale ridicate.",
      status: ReportStatus.COMPLETED,
      latitude: 46.7698,
      longitude: 23.5912,
      address: "Strada Memorandumului, Cluj-Napoca",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      aiSummary: "Dale de trotuar deteriorate și ridicate. Risc scăzut, dar necesită reparație pentru siguranța pietonilor.",
    },
    {
      userId: citizen1.id,
      issueType: IssueType.WATER_LEAKAGE,
      severity: Severity.CRITICAL,
      description: "Conductă spartă, apă curge pe stradă de ore întregi.",
      status: ReportStatus.DELAYED,
      latitude: 46.7723,
      longitude: 23.6267,
      address: "Strada Iuliu Maniu, Cluj-Napoca",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      aiSummary: "Avarie gravă la rețeaua de apă. Scurgere masivă pe carosabil. Necesită intervenție urgentă.",
    },
    {
      userId: citizen2.id,
      issueType: IssueType.ROAD_CRACK,
      severity: Severity.MEDIUM,
      description: "Fisuri mari în asfalt pe toată lățimea drumului.",
      status: ReportStatus.PENDING,
      latitude: 46.7656,
      longitude: 23.6145,
      address: "Calea Dorobanților, Cluj-Napoca",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      aiSummary: "Fisuri longitudinale și transversale în carosabil. Degradare progresivă a infrastructurii rutiere.",
    },
    {
      userId: citizen1.id,
      issueType: IssueType.TRAFFIC_SIGN_DAMAGE,
      severity: Severity.HIGH,
      description: "Indicator rutier distrus după accident, lipsă semn Stop.",
      status: ReportStatus.UNDER_REVIEW,
      latitude: 46.7634,
      longitude: 23.6089,
      address: "Intersecția Calea Turzii, Cluj-Napoca",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      aiSummary: "Indicator rutier de tip STOP lipsă sau grav deteriorat. Risc ridicat de accidente la intersecție.",
    },
    {
      userId: citizen2.id,
      issueType: IssueType.OVERFLOWING_BIN,
      severity: Severity.MEDIUM,
      description: "Coș de gunoi plin de 3 zile, miroase urât.",
      status: ReportStatus.PENDING,
      latitude: 46.7667,
      longitude: 23.6201,
      address: "Piața Unirii, Cluj-Napoca",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      aiSummary: "Container de deșeuri supraaglomerat în zona centrală. Necesită golire urgentă.",
    },
  ];

  const createdReports: { id: string; status: ReportStatus }[] = [];
  for (const report of sampleReports) {
    const created = await prisma.report.create({ data: report });
    createdReports.push({ id: created.id, status: created.status });
  }

  // Add government actions for reports with active statuses
  const workStartedReport = createdReports.find(r => r.status === ReportStatus.WORK_STARTED);
  if (workStartedReport) {
    await prisma.governmentAction.create({
      data: {
        reportId: workStartedReport.id,
        officerId: officer.id,
        assignedTeam: "Echipa Drumuri Sector 1",
        actionTaken: "Echipa a fost mobilizată. Se lucrează la repararea gropii.",
        progress: 40,
        estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        isPublic: true,
      },
    });
  }

  const delayedReport = createdReports.find(r => r.status === ReportStatus.DELAYED);
  if (delayedReport) {
    await prisma.governmentAction.create({
      data: {
        reportId: delayedReport.id,
        officerId: officer.id,
        assignedTeam: "Echipa Rețea Apă",
        actionTaken: "Lucrarea a fost întârziată din cauza condițiilor meteo.",
        progress: 20,
        delayReason: "Condiții meteo nefavorabile. Temperaturi sub 0°C împiedică intervenția.",
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isPublic: true,
      },
    });
  }

  const completedReport = createdReports.find(r => r.status === ReportStatus.COMPLETED);
  if (completedReport) {
    await prisma.governmentAction.create({
      data: {
        reportId: completedReport.id,
        officerId: officer.id,
        assignedTeam: "Echipa Trotuare",
        actionTaken: "Dalele deteriorate au fost înlocuite. Lucrarea a fost finalizată.",
        progress: 100,
        isPublic: true,
      },
    });
  }

  // Add public announcement
  await prisma.announcement.create({
    data: {
      title: "Program de reparații infrastructură 2025",
      content: "Primăria Cluj-Napoca anunță demararea programului de reparații infrastructură pentru trimestrul II 2025. Vor fi reparate peste 50 de străzi și trotuare din municipiu.",
      officerId: officer.id,
    },
  });

  console.log(`Seeded: ${admin.email}, ${officer.email}, ${citizen1.email}, ${citizen2.email}`);
  console.log(`Created ${sampleReports.length} sample reports with government actions`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
