import type { NextAuthOptions } from "next-auth";
import NextAuth, { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email.toLowerCase()))
          .limit(1);

        const found = user[0];

        if (!found || !found.passwordHash) {
          return null;
        }

        const valid = await compare(credentials.password, found.passwordHash);

        if (!valid) {
          return null;
        }

        return {
          id: found.userId,
          email: found.email,
          name: found.name,
          image: found.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export function auth() {
  return getServerSession(authOptions);
}