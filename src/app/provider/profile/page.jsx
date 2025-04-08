'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Center, Spinner, Text } from '@chakra-ui/react';

export default function ProviderProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to cabinet page
    router.push('/provider/cabinet');
  }, [router]);

  return (
    <Center h="100vh" flexDirection="column">
      <Spinner size="xl" mb={4} color="blue.500" />
      <Text fontSize="lg">Redirecting to provider cabinet...</Text>
    </Center>
  );
} 