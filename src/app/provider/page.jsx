"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Spinner, Center, Text } from '@chakra-ui/react';

export default function ProviderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/provider/dashboard');
      return;
    }

    if (session?.user?.role !== 'PROVIDER') {
      router.push('/provider/join');
      return;
    }

    // If authenticated as provider, redirect to dashboard
    router.push('/provider/dashboard');
  }, [session, status, router]);

  return (
    <Center minH="100vh">
      <Box textAlign="center">
        <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" mb={4} />
        <Text>Redirecting to dashboard...</Text>
      </Box>
    </Center>
  );
}