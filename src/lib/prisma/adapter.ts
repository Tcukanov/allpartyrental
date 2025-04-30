import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient, UserRole } from '@prisma/client';

export function CustomPrismaAdapter(prisma: PrismaClient) {
  const adapter = PrismaAdapter(prisma);
  
  // Override the createUser function to add a default role
  return {
    ...adapter,
    createUser: async (data: any) => {
      // Extract fields not in our schema
      const { image, emailVerified, ...restData } = data;
      
      // Store image directly in the user model
      const userData = {
        ...restData,
        role: UserRole.CLIENT,
        ...(image ? { image } : {}),
        ...(emailVerified ? { emailVerified } : {})
      };
      
      // Create user with new schema format
      return prisma.user.create({
        data: userData
      });
    },
  };
} 