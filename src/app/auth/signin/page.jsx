"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  Divider, 
  HStack, 
  useToast, 
  Link as ChakraLink, 
  InputGroup, 
  InputRightElement,
  IconButton,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, EmailIcon } from '@chakra-ui/icons';
import { FcGoogle } from 'react-icons/fc';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const toast = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [devVerificationLink, setDevVerificationLink] = useState('');
  const error = searchParams.get('error');
  
  // Check if the email is associated with Google when it changes
  useEffect(() => {
    // Debounce the API call to avoid making too many requests
    const handler = setTimeout(async () => {
      if (email && email.includes('@')) {
        try {
          const response = await fetch('/api/auth/check-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          
          const data = await response.json();
          
          if (data.isGoogleAccount) {
            setIsGoogleAccount(true);
          } else {
            setIsGoogleAccount(false);
          }
        } catch (error) {
          console.error('Error checking email:', error);
        }
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(handler);
  }, [email]);
  
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // If it's a Google account, show a toast and don't attempt sign in
    if (isGoogleAccount) {
      toast({
        title: 'Google Account Detected',
        description: 'This email is associated with Google Sign In. Please use the "Sign In with Google" button below.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First check if the email exists without a password (Google account)
      const checkResponse = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const checkData = await checkResponse.json();
      
      if (checkData.isGoogleAccount) {
        toast({
          title: 'Google Account Detected',
          description: 'This email is associated with Google Sign In. Please use the "Sign In with Google" button below.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }
      
      // Check if email needs verification
      if (checkData.needsVerification) {
        toast({
          title: 'Email Verification Required',
          description: 'Please verify your email before signing in. Check your inbox for the verification link.',
          status: 'warning',
          duration: 6000,
          isClosable: true,
        });
        
        // Show the resend verification button
        setNeedsEmailVerification(true);
        setIsLoading(false);
        return;
      }
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        // Provide more user-friendly error messages
        if (result.error === 'Invalid credentials') {
          throw new Error('The email or password you entered is incorrect. Please try again.');
        } else {
          throw new Error(result.error);
        }
      }
      
      toast({
        title: 'Success',
        description: 'You have been signed in successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      router.push(callbackUrl);
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      await signIn('google', {
        callbackUrl,
      });
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email to resend verification.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsResending(true);
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Verification email sent',
          description: data.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // For development, show a button to directly verify
        if (data.verificationLink) {
          setDevVerificationLink(data.verificationLink);
        }
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to send verification email',
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
      setIsResending(false);
    }
  };
  
  return (
    <Box minH="100vh" py={12} bg="gray.50">
      <Container maxW="md">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={2}>Sign In</Heading>
            <Text color="gray.600">Access your account to manage your parties and services.</Text>
          </Box>
          
          <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} as="form" onSubmit={handleEmailSignIn}>
              <FormControl id="email" isRequired>
                <FormLabel>Email address</FormLabel>
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  borderColor={isGoogleAccount ? 'orange.300' : undefined}
                />
                {isGoogleAccount && (
                  <Text color="orange.500" fontSize="sm" mt={1}>
                    This email uses Google Sign In. Please use the Google button below.
                  </Text>
                )}
              </FormControl>
              
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isGoogleAccount}
                  />
                  <InputRightElement width="3rem">
                    <IconButton
                      h="1.5rem"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={isGoogleAccount}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              {needsEmailVerification && (
                <Box mt={2} textAlign="center">
                  <Text color="orange.500" fontSize="sm" mb={2}>
                    Your email needs verification before you can sign in.
                  </Text>
                  <Button
                    variant="link"
                    colorScheme="blue"
                    size="sm"
                    onClick={handleResendVerification}
                    isLoading={isResending}
                  >
                    Resend verification email
                  </Button>
                </Box>
              )}
              
              {/* Forgot Password Link */}
              <Box alignSelf="flex-end">
                <Link href="/auth/forgot-password" passHref>
                  <ChakraLink color="blue.500" fontSize="sm">
                    Forgot Password?
                  </ChakraLink>
                </Link>
              </Box>
              
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                mt={2}
                isLoading={isLoading}
                disabled={isGoogleAccount}
              >
                Sign In
              </Button>
            </VStack>
            
            <Flex align="center" my={4}>
              <Divider flex="1" />
              <Text px={3} color="gray.500">or</Text>
              <Divider flex="1" />
            </Flex>
            
            <Divider my={4} />
            
            <Button
              onClick={handleGoogleSignIn}
              leftIcon={<FcGoogle fontSize="20px" />}
              width="full"
              colorScheme="gray"
              variant="outline"
              size="lg"
              isLoading={isLoading}
              loadingText="Signing in"
            >
              Sign In with Google
            </Button>
          </Box>
          
          <Box textAlign="center">
            <Text>
              Don't have an account?{' '}
              <ChakraLink as={Link} href="/auth/signup" color="brand.500" fontWeight="bold">
                Sign Up
              </ChakraLink>
            </Text>
          </Box>
          
          {error === 'CredentialsSignin' && (
            <Alert status="error" mb={4} rounded="md">
              <AlertIcon />
              <AlertTitle>Invalid credentials!</AlertTitle>
              <AlertDescription>
                Please check your email and password and try again.
              </AlertDescription>
            </Alert>
          )}
          
          {error === 'EmailNotVerified' && (
            <Alert status="warning" mb={4} rounded="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Email verification required!</AlertTitle>
                <AlertDescription>
                  Please verify your email before signing in. Check your inbox for the verification link.
                  
                  {!devVerificationLink ? (
                    <Button
                      ml={2}
                      size="sm"
                      colorScheme="yellow"
                      isLoading={isResending}
                      onClick={handleResendVerification}
                    >
                      Resend verification email
                    </Button>
                  ) : (
                    <Button
                      as="a"
                      href={devVerificationLink}
                      ml={2}
                      size="sm"
                      colorScheme="green"
                    >
                      Development: Verify Now
                    </Button>
                  )}
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </VStack>
      </Container>
    </Box>
  );
}