import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "邮箱/用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const { login, password } = credentials as {
          login: string;
          password: string;
        };

        if (!login || !password) return null;

        // Try email first, then username
        let user = await db.user.findFirst({
          where: { OR: [{ email: login }, { name: login }] },
        });

        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth",
  },
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).role = (user as any).role;
        token.picture = user.image;
      }
      // Re-fetch latest image from DB on each JWT check (for avatar update)
      if (trigger === "update" || !token.picture) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { image: true, name: true },
          });
          if (dbUser) {
            token.picture = dbUser.image;
            token.name = dbUser.name;
          }
        } catch { /* ignore */ }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = (token as any).role;
        session.user.image = token.picture;
      }
      return session;
    },
  },
});
