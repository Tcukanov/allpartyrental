'use client';

import { Button, Container, Heading, Text, VStack, Box } from '@chakra-ui/react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container maxW="container.lg" py={20}>
      <VStack spacing={8} align="center" textAlign="center">
        <Heading as="h1" size="2xl">404 - Page Not Found</Heading>
        
        <Box maxW="600px">
          <Text fontSize="xl" mb={8}>
            Oops! The page you are looking for doesn't exist or has been moved.
          </Text>
          
          <Text mb={8}>
            The URL might be incorrect, or the page may have been removed or renamed.
          </Text>
        </Box>
        
        <Button
          as={Link}
          href="/"
          colorScheme="brand"
          size="lg"
        >
          Return to Home
        </Button>
      </VStack>
    </Container>
  );
} 