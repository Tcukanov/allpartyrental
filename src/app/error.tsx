'use client';

import { useEffect } from 'react';
import { Box, Container, Heading, Text, Button, VStack } from '@chakra-ui/react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App-level error:', error);
  }, [error]);

  // Handle NEXT_NOT_FOUND errors specifically
  if (error.digest === 'NEXT_NOT_FOUND') {
    return (
      <Container maxW="container.xl" py={20}>
        <VStack spacing={8} textAlign="center">
          <Heading as="h1" size="2xl">
            404 - Page Not Found
          </Heading>
          <Text fontSize="xl" color="gray.600">
            The page you are looking for might have been removed, had its name changed, 
            or is temporarily unavailable.
          </Text>
          <Box>
            <Link href="/" passHref>
              <Button colorScheme="brand" size="lg" mr={4}>
                Return to Home
              </Button>
            </Link>
          </Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={20}>
      <VStack spacing={8} textAlign="center">
        <Heading as="h1" size="2xl">
          Something went wrong
        </Heading>
        <Text fontSize="xl" color="gray.600">
          We apologize for the inconvenience. Please try again later.
        </Text>
        <Box>
          <Button 
            onClick={reset}
            colorScheme="brand" 
            size="lg"
            mr={4}
          >
            Try again
          </Button>
          <Link href="/" passHref>
            <Button colorScheme="gray" size="lg">
              Return to Home
            </Button>
          </Link>
        </Box>
      </VStack>
    </Container>
  );
} 