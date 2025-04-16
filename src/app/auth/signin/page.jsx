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
  Flex
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
                    placeholder="********"
                    isDisabled={isGoogleAccount}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      isDisabled={isGoogleAccount}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <Button 
                leftIcon={<EmailIcon />}
                type="submit" 
                colorScheme="brand" 
                size="lg" 
                width="full"
                isLoading={isLoading}
                loadingText="Signing in"
                isDisabled={isGoogleAccount}
              >
                Sign In with Email
              </Button>
            </VStack>
            
            <Box textAlign="right" mt={2}>
              <ChakraLink as={Link} href="/auth/forgot-password" color="brand.500" fontSize="sm">
                Forgot password?
              </ChakraLink>
            </Box>
            
            <Flex align="center" my={4}>
              <Divider flex="1" />
              <Text px={3} color="gray.500">or</Text>
              <Divider flex="1" />
            </Flex>
            
            <Button 
              leftIcon={<FcGoogle />}
              onClick={handleGoogleSignIn} 
              variant={isGoogleAccount ? "solid" : "outline"}
              colorScheme={isGoogleAccount ? "green" : undefined}
              size="lg" 
              width="full"
              isLoading={isLoading}
              loadingText="Signing in"
              boxShadow={isGoogleAccount ? "0 0 0 2px #38A169" : undefined}
            >
              Sign In with Google
              {isGoogleAccount && " (Recommended)"}
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
        </VStack>
      </Container>
    </Box>
  );
}