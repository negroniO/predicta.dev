import { operationalLog } from "./operational-log";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { isAdminGitHubId } from "./admin-policy";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  logger: {
    error() { operationalLog("error", "auth_failure", { operation: "authentication" }); },
    warn() { /* Do not forward provider metadata or credentials into logs. */ },
    debug() { /* Authentication debug payloads may contain credentials. */ },
  },
  providers: [GitHubProvider({
    clientId: process.env.GITHUB_ID!,
    clientSecret: process.env.GITHUB_SECRET!,
  })],
  session: { strategy: "database" },
  callbacks: {
    async signIn({ account }) {
      return account?.provider === "github" && isAdminGitHubId(account.providerAccountId);
    },
    async session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
};
