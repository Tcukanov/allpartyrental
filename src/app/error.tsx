'use client';

import { Box, Container, Heading, Text, Button, VStack, Flex, Icon } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);

    // Simplify error message for display
    if (error.message) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage('An unexpected error occurred');
    }
  }, [error]);

  return (
    <Container maxW="container.xl" py={20}>
      <Flex 
        direction="column"
        align="center"
        justify="center"
        textAlign="center"
      >
        <Icon as={FaExclamationTriangle} boxSize={16} color="red.500" mb={6} />
        
        <VStack spacing={6} align="center" maxW="600px">
          <Heading as="h1" size="xl">Something Went Wrong</Heading>
          
          <Text fontSize="lg" color="gray.600">
            We're sorry, but we encountered an unexpected error. Our team has been notified
            and we're working to fix the issue.
          </Text>
          
          {errorMessage && (
            <Box 
              p={4} 
              bg="red.50" 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor="red.200"
              w="100%"
            >
              <Text color="red.600">{errorMessage}</Text>
            </Box>
          )}
          
          <VStack spacing={4} align="stretch" w="100%" mt={4}>
            <Button colorScheme="brand" size="lg" onClick={() => reset()}>
              Try Again
            </Button>
            
            <Button variant="outline" onClick={() => router.push('/')}>
              Return to Home
            </Button>
            
            <Button variant="ghost" onClick={() => router.back()}>
              Go Back
            </Button>
          </VStack>
        </VStack>
      </Flex>
    </Container>
  );
} 