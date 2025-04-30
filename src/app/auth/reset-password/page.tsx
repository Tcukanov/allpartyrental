'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  AlertIcon,
  FormErrorMessage,
} from '@chakra-ui/react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    // If no token is provided, redirect to forgot password page
    if (!token) {
      toast({
        title: 'Invalid Request',
        description: 'Password reset token is missing',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push('/auth/forgot-password');
      return;
    }

    // Verify if token is valid
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-token?token=${token}`);
        const data = await response.json();
        
        setTokenValid(data.valid);
        
        if (!data.valid) {
          toast({
            title: 'Invalid or Expired Token',
            description: 'Your password reset link is invalid or has expired. Please request a new one.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          setTimeout(() => {
            router.push('/auth/forgot-password');
          }, 3000);
        }
      } catch (error) {
        setTokenValid(false);
        toast({
          title: 'Error',
          description: 'Could not verify reset token',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    verifyToken();
  }, [token, router, toast]);

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
        toast({
          title: 'Success',
          description: 'Your password has been reset. You can now log in with your new password.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to reset password',
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

  if (tokenValid === null) {
    return (
      <Container maxW="md" py={12}>
        <VStack spacing={8}>
          <Heading as="h1" size="xl" textAlign="center">
            Reset Password
          </Heading>
          <Text>Verifying reset link...</Text>
        </VStack>
      </Container>
    );
  }

  if (tokenValid === false) {
    return (
      <Container maxW="md" py={12}>
        <VStack spacing={8}>
          <Heading as="h1" size="xl" textAlign="center">
            Reset Password
          </Heading>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            Your password reset link is invalid or has expired. Redirecting you to request a new one...
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Reset Password
        </Heading>
        
        {success ? (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            Your password has been successfully reset. Redirecting to login page...
          </Alert>
        ) : (
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Text>
                Please enter your new password below.
              </Text>
              
              <FormControl isRequired isInvalid={!!passwordError}>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </FormControl>
              
              <FormControl isRequired isInvalid={!!passwordError}>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                {passwordError && (
                  <FormErrorMessage>{passwordError}</FormErrorMessage>
                )}
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isSubmitting}
                loadingText="Resetting..."
                width="full"
                mt={4}
              >
                Reset Password
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