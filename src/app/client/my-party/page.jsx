"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Container, Spinner, Text, Center } from '@chakra-ui/react';

export default function MyPartyRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyId = searchParams.get('id');
  
  useEffect(() => {
    // On component mount, redirect to transactions page
    const redirectTimeout = setTimeout(() => {
      router.push('/client/transactions');
    }, 1500);

    return () => clearTimeout(redirectTimeout);
  }, [router]);
  
  return (
    <Container maxW="container.md" py={12}>
      <Center flexDirection="column">
        <Spinner size="xl" mb={4} />
        <Text fontSize="lg" textAlign="center">
          Party details are now integrated into the transactions page.
          Redirecting you to transactions...
          </Text>
      </Center>
    </Container>
  );
}