import { PrismaClient, UserRole, IssueType, Severity, ReportStatus, ApprovalStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear demo reports before re-seeding so we don't duplicate
  await prisma.governmentAction.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.announcement.deleteMany({});

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

  // Demo photo URLs — distinct per issue type, consistent across runs
  const DEMO_PHOTOS: Record<string, string> = {
    POTHOLE:              "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80",
    BROKEN_ROAD:          "https://images.unsplash.com/photo-1584463699057-a0c47dc192f7?w=800&q=80",
    SIDEWALK_DAMAGE:      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    OVERFLOWING_BIN:      "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80",
    GARBAGE:              "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80",
    BROKEN_STREET_LIGHT:  "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&q=80",
    TRAFFIC_LIGHT_DAMAGE: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80",
    WATER_LEAKAGE:        "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=800&q=80",
    TRAFFIC_SIGN_DAMAGE:  "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=800&q=80",
    CONSTRUCTION_HAZARD:  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    ROAD_CRACK:           "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=800&q=80",
    OTHER:                "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
  };

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
      imageUrl: DEMO_PHOTOS.POTHOLE,
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
      imageUrl: DEMO_PHOTOS.BROKEN_STREET_LIGHT,
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
      imageUrl: DEMO_PHOTOS.GARBAGE,
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
      imageUrl: DEMO_PHOTOS.SIDEWALK_DAMAGE,
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
      imageUrl: DEMO_PHOTOS.WATER_LEAKAGE,
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
      imageUrl: DEMO_PHOTOS.ROAD_CRACK,
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
      imageUrl: DEMO_PHOTOS.TRAFFIC_SIGN_DAMAGE,
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
      imageUrl: DEMO_PHOTOS.OVERFLOWING_BIN,
      aiSummary: "Container de deșeuri supraaglomerat în zona centrală. Necesită golire urgentă.",
    },
    {
      userId: citizen1.id,
      issueType: IssueType.CONSTRUCTION_HAZARD,
      severity: Severity.HIGH,
      description: "Șantier fără semnalizare corespunzătoare, pericol pentru pietoni.",
      status: ReportStatus.ACCEPTED,
      latitude: 46.7758,
      longitude: 23.6312,
      address: "Strada Clinicilor, Cluj-Napoca",
      imageUrl: DEMO_PHOTOS.CONSTRUCTION_HAZARD,
      aiSummary: "Șantier de construcție fără bariere de protecție adecvate. Risc ridicat pentru pietoni.",
    },
    {
      userId: citizen2.id,
      issueType: IssueType.BROKEN_ROAD,
      severity: Severity.HIGH,
      description: "Drum distrus complet după iarnă, cratere mari pe toată lățimea.",
      status: ReportStatus.PENDING,
      latitude: 46.7601,
      longitude: 23.6334,
      address: "Strada Fabricii, Cluj-Napoca",
      imageUrl: DEMO_PHOTOS.BROKEN_ROAD,
      aiSummary: "Degradare severă a carosabilului pe o distanță de aproximativ 50m. Necesită reașternere completă.",
    },
    {
      userId: citizen1.id,
      issueType: IssueType.TRAFFIC_LIGHT_DAMAGE,
      severity: Severity.CRITICAL,
      description: "Semafor nefuncțional la intersecție aglomerată.",
      status: ReportStatus.IN_PROGRESS,
      latitude: 46.7680,
      longitude: 23.6178,
      address: "Intersecția Piața Avram Iancu, Cluj-Napoca",
      imageUrl: DEMO_PHOTOS.TRAFFIC_LIGHT_DAMAGE,
      aiSummary: "Semafor complet nefuncțional la intersecție cu trafic intens. Pericol iminent de accidente.",
    },
    {
      userId: citizen2.id,
      issueType: IssueType.POTHOLE,
      severity: Severity.MEDIUM,
      description: "Groapă pe trecerea de pietoni, periculoasă.",
      status: ReportStatus.PENDING,
      latitude: 46.7720,
      longitude: 23.6050,
      address: "Bulevardul 21 Decembrie 1989, Cluj-Napoca",
      imageUrl: DEMO_PHOTOS.POTHOLE,
      aiSummary: "Groapă de dimensiuni medii situată pe trecerea de pietoni. Risc de accidentare pentru pietoni.",
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
