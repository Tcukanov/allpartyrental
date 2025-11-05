'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Spinner, Text, Center } from '@chakra-ui/react';

export default function ProviderDashboard() {
  const router = useRouter();
  
  // Redirect to payments dashboard
  useEffect(() => {
    router.replace('/provider/dashboard/payments');
  }, [router]);

  return (
    <Center h="100vh">
      <Box textAlign="center">
        <Spinner size="xl" color="blue.500" mb={4} />
        <Text>Redirecting to dashboard...</Text>
      </Box>
    </Center>
  );
} 