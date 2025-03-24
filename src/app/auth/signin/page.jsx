"use client";

import { useState } from 'react';
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
    
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        throw new Error(result.error);
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
                />
              </FormControl>
              
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
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
              variant="outline" 
              size="lg" 
              width="full"
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
        </VStack>
      </Container>
    </Box>
  );
}