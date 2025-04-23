"use client";

import { useRouter } from 'next/navigation';
import { Box, Container, Heading, Text, Button, Flex } from '@chakra-ui/react';

/**
 * Component that renders when a user tries to access admin pages without admin permissions
 */
export default function AdminProtected() {
  const router = useRouter();
  
  return (
    <Container maxW="container.md" py={20}>
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        textAlign="center"
        py={10} 
        px={6}
      >
        <Heading mb={6} size="xl">Access Restricted</Heading>
        <Text fontSize="lg" mb={8}>
          This page is only accessible to administrators. 
          Please log in with an admin account or contact support if you believe this is an error.
        </Text>
        <Button 
          colorScheme="blue" 
          size="lg"
          onClick={() => router.push('/api/auth/signin')}
        >
          Sign In
        </Button>
      </Flex>
    </Container>
  );
} 