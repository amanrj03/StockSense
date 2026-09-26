import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        loginId: { label: "Login ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { loginId, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { loginId },
          select: {
            id: true,
            loginId: true,
            email: true,
            passwordHash: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const passwordMatch = await compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return { id: user.id, email: user.email, name: user.loginId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});
