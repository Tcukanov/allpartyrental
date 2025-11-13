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
  useToast, 
  Link as ChakraLink, 
  InputGroup, 
  InputRightElement,
  IconButton,
  Textarea,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormHelperText,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, EmailIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProviderSignUpPage() {
  const router = useRouter();
  const toast = useToast();
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Fetch cities for service location
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch('/api/cities');
        const data = await response.json();
        if (data.success) {
          setCities(data.data);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    }
    fetchCities();
  }, []);
  
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!companyName || !contactPerson || !email || !password || !confirmPassword || !phone || !companyDescription || !serviceLocation) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
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
      const response = await fetch('/api/auth/provider-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          contactPerson,
          email,
          password,
          phone,
          website,
          companyDescription,
          serviceLocation,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Registration failed');
      }
      
      toast({
        title: 'Application Submitted!',
        description: 'Your provider application has been submitted. An admin will review and approve your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setRegistrationSuccess(true);
      
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box minH="100vh" py={12} bg="gray.50">
      <Container maxW="2xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={2}>Become a Service Provider</Heading>
            <Text color="gray.600">Join our platform and start offering your services to clients planning parties and events.</Text>
          </Box>
          
          {registrationSuccess ? (
            <Alert
              status="success"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="250px"
              bg="white"
              p={8}
              borderRadius="lg"
              boxShadow="md"
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Application Submitted Successfully!
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                <Text mb={4}>
                  Your provider application is under review. An admin will review your application and you'll receive an email once your account is approved.
                </Text>
                <Button 
                  as={Link} 
                  href="/" 
                  variant="outline" 
                  size="sm"
                  colorScheme="blue" 
                  mt={2}
                >
                  Back to Home
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
              <VStack spacing={6} as="form" onSubmit={handleSignUp}>
                
                <Box width="100%">
                  <Heading size="md" mb={4} color="blue.600">Company Information</Heading>
                  
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl id="companyName" isRequired>
                        <FormLabel>Company Name</FormLabel>
                        <Input 
                          type="text" 
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Your Company Name"
                        />
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl id="contactPerson" isRequired>
                        <FormLabel>Contact Person</FormLabel>
                        <Input 
                          type="text" 
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder="John Doe"
                        />
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl id="phone" isRequired>
                        <FormLabel>Phone</FormLabel>
                        <Input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                        />
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl id="email" isRequired>
                        <FormLabel>Email address</FormLabel>
                        <Input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@company.com"
                        />
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl id="website">
                        <FormLabel>Website (Optional)</FormLabel>
                        <Input 
                          type="url" 
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yourcompany.com"
                        />
                      </FormControl>
                    </GridItem>
                    
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl id="serviceLocation" isRequired>
                        <FormLabel>Service Location</FormLabel>
                        <Select 
                          value={serviceLocation}
                          onChange={(e) => setServiceLocation(e.target.value)}
                          placeholder="Select your service area"
                        >
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </Select>
                        <FormHelperText>Select the primary area where you provide services</FormHelperText>
                      </FormControl>
                    </GridItem>
                    
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl id="companyDescription" isRequired>
                        <FormLabel>Company Description</FormLabel>
                        <Textarea 
                          value={companyDescription}
                          onChange={(e) => setCompanyDescription(e.target.value)}
                          placeholder="Tell us about your company and the services you provide..."
                          rows={5}
                        />
                        <FormHelperText>Describe your business, services, and what makes you unique</FormHelperText>
                      </FormControl>
                    </GridItem>
                  </Grid>
                </Box>
                
                <Box width="100%">
                  <Heading size="md" mb={4} color="blue.600">Account Security</Heading>
                  
                  <VStack spacing={4}>
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
                      <FormHelperText>Must be at least 8 characters</FormHelperText>
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
                  </VStack>
                </Box>
                
                <Button 
                  leftIcon={<EmailIcon />}
                  type="submit" 
                  colorScheme="blue" 
                  size="lg" 
                  width="full"
                  isLoading={isLoading}
                  loadingText="Submitting application"
                  mt={2}
                >
                  Submit Provider Application
                </Button>
              </VStack>
            </Box>
          )}
          
          <Box textAlign="center">
            <Text>
              Already have an account?{' '}
              <ChakraLink as={Link} href="/auth/signin" color="blue.500" fontWeight="bold">
                Sign In
              </ChakraLink>
            </Text>
            <Text mt={2}>
              Want to organize parties instead?{' '}
              <ChakraLink as={Link} href="/auth/signup" color="blue.500" fontWeight="bold">
                Client Sign Up
              </ChakraLink>
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

