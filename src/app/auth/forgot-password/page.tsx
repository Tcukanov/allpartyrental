'use client';

import { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  FormControl, 
  FormLabel, 
  Heading, 
  Input, 
  Text, 
  VStack,
  useToast,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Something went wrong',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Forgot Password
        </Heading>
        
        {success ? (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            If an account exists with this email, we've sent a password reset link. Please check your inbox.
          </Alert>
        ) : (
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Text>
                Enter your email address and we'll send you a link to reset your password.
              </Text>
              
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                />
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isSubmitting}
                loadingText="Sending..."
                width="full"
                mt={4}
              >
                Send Reset Link
              </Button>
            </VStack>
          </Box>
        )}
        
        <Box textAlign="center">
          <Link href="/auth/signin">
            <Text as="span" color="blue.500">
              Return to sign in
            </Text>
          </Link>
        </Box>
      </VStack>
    </Container>
  );
} 