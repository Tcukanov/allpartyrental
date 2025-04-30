'use client';

import { useState } from 'react';
import { 
  Container, 
  VStack, 
  Heading, 
  Text, 
  Input, 
  Button, 
  FormControl,
  FormLabel,
  Box,
  Alert,
  AlertIcon,
  Code,
  useToast
} from '@chakra-ui/react';

export default function VerificationDebugPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const toast = useToast();

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setResponse(data);
      
      toast({
        title: data.success ? 'Success' : 'Error',
        description: data.message || data.error?.message || 'Request completed',
        status: data.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send request',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify token directly
  const handleVerifyToken = async () => {
    if (!token) {
      toast({
        title: 'Token required',
        description: 'Please enter a verification token',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await res.json();
      setResponse(data);
      
      toast({
        title: data.success ? 'Success' : 'Error',
        description: data.message || data.error?.message || 'Request completed',
        status: data.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify token',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Email Verification Debug Tools</Heading>
        <Text>This page is only available in development mode.</Text>

        <Box p={6} bg="white" borderRadius="md" boxShadow="md">
          <Heading as="h2" size="md" mb={4}>Resend Verification Email</Heading>
          <FormControl mb={4}>
            <FormLabel>Email Address</FormLabel>
            <Input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </FormControl>
          <Button 
            colorScheme="blue" 
            isLoading={isLoading}
            onClick={handleResendVerification}
          >
            Resend Verification Email
          </Button>
        </Box>

        <Box p={6} bg="white" borderRadius="md" boxShadow="md">
          <Heading as="h2" size="md" mb={4}>Verify Token Directly</Heading>
          <FormControl mb={4}>
            <FormLabel>Verification Token</FormLabel>
            <Input 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter verification token"
            />
          </FormControl>
          <Button 
            colorScheme="green" 
            isLoading={isLoading}
            onClick={handleVerifyToken}
          >
            Verify Token
          </Button>
        </Box>

        {response && (
          <Box p={6} bg="gray.50" borderRadius="md">
            <Heading as="h3" size="sm" mb={2}>Response:</Heading>
            <Alert status={response.success ? 'success' : 'error'} mb={4}>
              <AlertIcon />
              {response.message || response.error?.message || 'Request completed'}
            </Alert>
            <Text fontWeight="bold" mb={2}>Full Response:</Text>
            <Code p={4} borderRadius="md" whiteSpace="pre-wrap" display="block" overflowX="auto">
              {JSON.stringify(response, null, 2)}
            </Code>
          </Box>
        )}
      </VStack>
    </Container>
  );
} 