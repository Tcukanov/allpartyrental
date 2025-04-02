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
      
      // Store image in the profile if needed
      const profileData = image ? { create: { avatar: image } } : undefined;
      
      // Add a default role (CLIENT) to the user data
      return prisma.user.create({
        data: {
          ...restData,
          role: UserRole.CLIENT,
          profile: profileData,
        },
      });
    },
  };
} 