'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  useToast,
  Divider,
  Link,
  HStack,
  Flex,
} from '@chakra-ui/react';
import { FaPaypal, FaInfoCircle, FaArrowLeft, FaExternalLinkAlt } from 'react-icons/fa';

export default function ManualPayPalSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  // Get query parameters
  const trackingId = searchParams.get('trackingId') || '';
  const email = searchParams.get('email') || '';
  const businessName = searchParams.get('businessName') || '';
  
  const [formData, setFormData] = useState({
    paypalEmail: email,
    merchantId: '',
    businessName: businessName,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Submitting PayPal credentials:', {
        merchantId: formData.merchantId,
        email: formData.paypalEmail
      });
      
      // Try the direct SQL endpoint first
      console.log('Using direct SQL update endpoint...');
      const response = await fetch('/api/provider/paypal/direct-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: formData.merchantId || null,
          sandboxEmail: formData.paypalEmail,
        }),
      });
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect PayPal account');
      }
      
      toast({
        title: 'PayPal Connected',
        description: 'Your PayPal sandbox account has been connected successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Verify the connection immediately before redirecting
      try {
        const verifyResponse = await fetch('/api/provider/paypal/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const verifyData = await verifyResponse.json();
        console.log('Verification response:', verifyData);
        
        if (!verifyData.connected) {
          console.warn('Warning: PayPal credentials were saved but verification shows not connected.');
          toast({
            title: 'Warning',
            description: 'Credentials saved but verification shows they may not be active yet.',
            status: 'warning',
            duration: 7000,
            isClosable: true,
          });
        }
      } catch (verifyError) {
        console.error('Error verifying connection:', verifyError);
      }
      
      // Redirect to the payment settings page after a short delay
      setTimeout(() => {
        router.push('/provider/settings/payments');
      }, 1500);
    } catch (error) {
      console.error('Error connecting PayPal account:', error);
      
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect PayPal account',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box maxW="800px" mx="auto" mt={10} p={6} boxShadow="md" borderRadius="lg" bg="white">
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="blue.600">Connect Your PayPal Sandbox Account</Heading>
        
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Sandbox Testing Mode</Text>
            <Text>
              Please enter your <strong>real PayPal sandbox account credentials</strong> from your 
              PayPal Developer Dashboard. Mock accounts will not be able to process payments.
            </Text>
          </Box>
        </Alert>
        
        <Divider />
        
        <Box>
          <Heading size="md" mb={4}>Connect Your PayPal Sandbox Account</Heading>
          <Text mb={4}>
            Enter your <strong>real PayPal sandbox merchant account</strong> details below.
            You need to create these accounts in the PayPal Developer Dashboard first.
          </Text>
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Sandbox Business Email</FormLabel>
                <Input
                  name="paypalEmail"
                  value={formData.paypalEmail}
                  onChange={handleInputChange}
                  placeholder="your-sandbox-business@example.com"
                  required
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>
                  <HStack spacing={1}>
                    <Text>Sandbox Merchant ID</Text>
                    <FaInfoCircle size="12" />
                  </HStack>
                </FormLabel>
                <Input
                  name="merchantId"
                  value={formData.merchantId}
                  onChange={handleInputChange}
                  placeholder="Your sandbox merchant ID from PayPal Dashboard"
                  required
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Business Name</FormLabel>
                <Input
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your Sandbox Business Name"
                />
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="blue"
                leftIcon={<FaPaypal />}
                isLoading={isSubmitting}
                loadingText="Connecting..."
                size="lg"
                mt={4}
              >
                Connect Real Sandbox Account
              </Button>
            </VStack>
          </form>
        </Box>
        
        <Divider />
        
        <Box>
          <Heading size="md" mb={4}>Option 2: Create a New Sandbox Account</Heading>
          <Text mb={4}>
            Don't have a PayPal sandbox account? Create one through the PayPal Developer Dashboard
            and then enter the details above.
          </Text>
          
          <Link
            href="https://developer.paypal.com/dashboard/accounts"
            isExternal
            _hover={{ textDecoration: 'none' }}
          >
            <Button
              colorScheme="gray"
              leftIcon={<FaExternalLinkAlt />}
              variant="outline"
              size="md"
            >
              Open PayPal Developer Dashboard
            </Button>
          </Link>
        </Box>
        
        <Flex mt={6}>
          <Button
            leftIcon={<FaArrowLeft />}
            onClick={() => router.push('/provider/settings/payments')}
            variant="outline"
          >
            Back to Payment Settings
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
} 