'use client';

import { Button, Container, Heading, Text, VStack, Box } from '@chakra-ui/react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <Container maxW="container.lg" py={20}>
      <VStack spacing={8} align="center" textAlign="center">
        <Heading as="h1" size="2xl">Something went wrong!</Heading>
        
        <Box maxW="600px">
          <Text fontSize="xl" mb={4}>
            We apologize for the inconvenience. An unexpected error has occurred.
          </Text>
          
          {error.message && (
            <Text fontSize="md" color="red.500" mb={6}>
              Error details: {error.message}
            </Text>
          )}
          
          <Text mb={8}>
            Please try again later or contact support if the problem persists.
          </Text>
        </Box>
        
        <VStack spacing={4}>
          <Button
            colorScheme="brand"
            size="lg"
            onClick={() => reset()}
          >
            Try Again
          </Button>
          
          <Button
            as={Link}
            href="/"
            variant="outline"
          >
            Return to Home
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
} 