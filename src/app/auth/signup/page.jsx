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
  Flex,
  Radio,
  RadioGroup,
  Stack
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, EmailIcon } from '@chakra-ui/icons';
import { FcGoogle } from 'react-icons/fc';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CLIENT');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send registration request to API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error.message || 'Registration failed');
      }
      
      toast({
        title: 'Success',
        description: 'Your account has been created! Signing you in...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Sign in with the new credentials
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Redirect based on role
      if (role === 'CLIENT') {
        router.push('/client/dashboard');
      } else {
        router.push('/provider/cabinet');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    
    try {
      await signIn('google', {
        callbackUrl: role === 'CLIENT' ? '/client/dashboard' : '/provider/cabinet',
      });
    } catch (error) {
      console.error('Google sign up error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign up with Google. Please try again.',
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
            <Heading as="h1" size="xl" mb={2}>Create an Account</Heading>
            <Text color="gray.600">Join our platform to organize or provide services for parties.</Text>
          </Box>
          
          <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} as="form" onSubmit={handleSignUp}>
              <FormControl id="name" isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </FormControl>
              
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
              
              <FormControl id="confirmPassword" isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                />
              </FormControl>
              
              <FormControl id="role" isRequired>
                <FormLabel>I want to:</FormLabel>
                <RadioGroup 
                  onChange={setRole} 
                  value={role}
                  colorScheme="brand"
                >
                  <Stack direction="row">
                    <Radio value="CLIENT">Organize Parties</Radio>
                    <Radio value="PROVIDER">Provide Services</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              
              <Button 
                leftIcon={<EmailIcon />}
                type="submit" 
                colorScheme="brand" 
                size="lg" 
                width="full"
                isLoading={isLoading}
                loadingText="Creating account"
                mt={2}
              >
                Sign Up with Email
              </Button>
            </VStack>
            
            <Flex align="center" my={4}>
              <Divider flex="1" />
              <Text px={3} color="gray.500">or</Text>
              <Divider flex="1" />
            </Flex>
            
            <Button 
              leftIcon={<FcGoogle />}
              onClick={handleGoogleSignUp} 
              variant="outline" 
              size="lg" 
              width="full"
              isLoading={isLoading}
              loadingText="Signing up"
            >
              Sign Up with Google
            </Button>
          </Box>
          
          <Box textAlign="center">
            <Text>
              Already have an account?{' '}
              <ChakraLink as={Link} href="/auth/signin" color="brand.500" fontWeight="bold">
                Sign In
              </ChakraLink>
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}