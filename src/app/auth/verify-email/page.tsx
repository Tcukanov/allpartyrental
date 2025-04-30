'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Text, 
  Button, 
  Alert, 
  AlertIcon, 
  Spinner, 
  Center,
  Link as ChakraLink,
  Code
} from '@chakra-ui/react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationResponse, setVerificationResponse] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setVerificationResponse(data);
          
          // In development, auto redirect to sign in after 3 seconds
          if (process.env.NODE_ENV === 'development') {
            setTimeout(() => {
              router.push('/auth/signin');
            }, 3000);
          }
        } else {
          setStatus('error');
          setErrorMessage(data.error?.message || 'Failed to verify email');
          setVerificationResponse(data);
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
        console.error('Error verifying email:', error);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Email Verification
        </Heading>

        {status === 'loading' && (
          <Center p={8}>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>Verifying your email...</Text>
            </VStack>
          </Center>
        )}

        {status === 'success' && (
          <Alert status="success" borderRadius="md" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={6}>
            <AlertIcon boxSize="40px" mr={0} mb={4} />
            <Heading as="h3" size="md" mb={2}>
              Your Email Has Been Verified!
            </Heading>
            <Text mb={4}>
              Thank you for verifying your email address. Your account is now fully active.
            </Text>
            {process.env.NODE_ENV === 'development' && (
              <Text fontSize="sm" mb={2}>
                Redirecting to sign in page in 3 seconds...
              </Text>
            )}
            <Button 
              as={Link} 
              href="/auth/signin" 
              colorScheme="blue"
              size="lg"
              mt={2}
            >
              Sign In Now
            </Button>
          </Alert>
        )}

        {status === 'error' && (
          <Alert status="error" borderRadius="md" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={6}>
            <AlertIcon boxSize="40px" mr={0} mb={4} />
            <Heading as="h3" size="md" mb={2}>
              Verification Failed
            </Heading>
            <Text mb={4}>
              {errorMessage || 'The verification link is invalid or has expired. Please request a new verification email.'}
            </Text>

            {process.env.NODE_ENV === 'development' && verificationResponse && (
              <Box my={4} p={4} bg="gray.50" borderRadius="md" alignSelf="stretch">
                <Text fontWeight="bold" mb={2}>Debug Information:</Text>
                <Code p={2} display="block" whiteSpace="pre-wrap" mb={2} fontSize="xs">
                  {JSON.stringify(verificationResponse, null, 2)}
                </Code>
              </Box>
            )}

            <Button 
              as={Link} 
              href="/auth/signin" 
              colorScheme="blue"
              size="lg"
              mt={2}
            >
              Return to Sign In
            </Button>
          </Alert>
        )}
      </VStack>
    </Container>
  );
} 