import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcrypt';
import { prisma } from '@/lib/prisma/client';
import { UserRole } from '@prisma/client';
import { CustomPrismaAdapter } from '@/lib/prisma/adapter';

export const authOptions: AuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
            emailVerified: true
          }
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // If password doesn't exist, user needs to use OAuth
        if (!user.password) {
          throw new Error('Please use social login for this account');
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Check if email is verified (for credential-based logins)
        if (!user.emailVerified) {
          throw new Error('EmailNotVerified');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Smart redirect: if URL is localhost, return localhost. If production, return production.
      // This allows both environments to work properly.
      
      // If it's a relative URL, use the baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        // Allow localhost URLs when on localhost
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
          return url;
        }
        
        // Allow production domain URLs
        if (urlObj.hostname === 'allpartyrental.com' || urlObj.hostname === 'www.allpartyrental.com') {
          return url;
        }
        
        // Allow same origin
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (error) {
        console.error('Redirect URL parsing error:', error);
      }
      
      // Default: return to base URL
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as UserRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow the sign in
      return true;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // This event fires after successful sign in
      // We can't redirect from here, but we can log it
      console.log(`User ${user.email} signed in with role: ${user.role}`);
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 