import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';

export default {
  providers: [
    Credentials({
      authorize: async (credentials: any) => {
        const { email, password } = credentials;
        const prisma = (await import('@@/prisma/prismaClient')).default;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error('No user found');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        const { password: _, ...userWithoutPassword } = user;

        return userWithoutPassword;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          role: token.role,
          userId: token.userId,
        },
      };
    },
    async jwt({ user, token }) {
      const customToken = {
        ...token,
      };

      if (user?.email && token.sub) {
        const prisma = (await import('@@/prisma/prismaClient')).default;
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            role: true,
          },
        });

        if (dbUser) {
          customToken.role = dbUser.role;
          customToken.userId = dbUser.id;
        }
      }

      return {
        ...customToken,
        ...user,
      };
    },
  },
} satisfies NextAuthConfig;
