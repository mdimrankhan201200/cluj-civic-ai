import type { NextAuthConfig } from "next-auth";
import type { UserRole, ApprovalStatus } from "@prisma/client";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as {
        role?: UserRole;
        approvalStatus?: ApprovalStatus;
      } | undefined;

      const isLoggedIn = !!user;
      const { pathname } = nextUrl;

      const protectedPrefixes = ["/dashboard", "/reports", "/map", "/gov", "/admin", "/settings", "/pending-approval"];
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

      if (!isProtected) return true;

      if (!isLoggedIn) return false; // → redirect to /login

      // Pending approval: only allow /pending-approval itself
      if (user?.approvalStatus === "PENDING_APPROVAL" && !pathname.startsWith("/pending-approval")) {
        return Response.redirect(new URL("/pending-approval", nextUrl.origin));
      }

      // Prevent pending-approval page from being accessed by fully active users
      if (pathname.startsWith("/pending-approval") && user?.approvalStatus !== "PENDING_APPROVAL") {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      // Gov routes require GOVERNMENT_OFFICER or ADMIN
      if (pathname.startsWith("/gov") && user?.role !== "GOVERNMENT_OFFICER" && user?.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      // Admin routes require ADMIN
      if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role;
        token.approvalStatus = (user as { approvalStatus?: ApprovalStatus }).approvalStatus;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as UserRole;
      if (token.approvalStatus) session.user.approvalStatus = token.approvalStatus as ApprovalStatus;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
