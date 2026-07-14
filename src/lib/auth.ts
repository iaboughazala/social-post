import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/en/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Refresh active team on every request so the switcher takes effect
      // immediately (also handles the initial login).
      if (user || trigger === "update" || !token.teamId) {
        const uid = (user?.id as string) || (token.id as string);
        if (uid) {
          const dbUser = await db.user.findUnique({
            where: { id: uid },
            select: { activeTeamId: true },
          });
          const memberships = await db.teamMember.findMany({
            where: { userId: uid },
            orderBy: { id: "asc" },
          });
          const activeMembership =
            memberships.find((m) => m.teamId === dbUser?.activeTeamId) ||
            memberships[0];
          if (activeMembership) {
            token.teamId = activeMembership.teamId;
            token.teamRole = activeMembership.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).teamId = token.teamId;
        (session.user as any).teamRole = token.teamRole;
      }
      return session;
    },
  },
};
