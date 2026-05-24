import type {
  User,
  Report,
  GovernmentAction,
  UserRole,
  IssueType,
  Severity,
  ReportStatus,
  ApprovalStatus,
} from "@prisma/client";

export type { UserRole, IssueType, Severity, ReportStatus, ApprovalStatus };

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      approvalStatus: ApprovalStatus;
    };
  }
}

export type ReportWithUser = Report & {
  user: Pick<User, "id" | "name" | "email">;
  governmentActions: (GovernmentAction & {
    officer: Pick<User, "id" | "name">;
  })[];
};

export type AiAnalysisResult = {
  issueType: string;
  severity: string;
  summary: string;
  confidence: number;
  additionalNotes: string;
  isDemoMode?: boolean;
};
