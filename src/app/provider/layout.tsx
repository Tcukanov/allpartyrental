'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Center, Spinner, Text } from '@chakra-ui/react';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Only run authentication check for provider routes, excluding auth routes
  useEffect(() => {
    // Skip the check if session is still loading
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${pathname}`);
      return;
    }
    
    if (session?.user?.role !== 'PROVIDER') {
      router.push('/');
      return;
    }
  }, [session, status, router, pathname]);
  
  // Show loading spinner while checking authentication
  if (status === 'loading') {
    return (
      <Center minH="100vh" p={8}>
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" mb={4} />
          <Text>Loading...</Text>
        </Box>
      </Center>
    );
  }

  return <>{children}</>;
} 