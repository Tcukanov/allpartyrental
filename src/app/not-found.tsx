'use client';

import { Box, Container, Heading, Text, Button, VStack } from '@chakra-ui/react';
import Link from 'next/link';

export default function NotFound() {
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
            <Button colorScheme="brand" size="lg">
              Return to Home
            </Button>
          </Link>
        </Box>
      </VStack>
    </Container>
  );
} 