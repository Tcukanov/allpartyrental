'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heading, Text, Box, Alert, AlertIcon, Button, Flex, Spinner, VStack, Code } from '@chakra-ui/react';
import { FaCheckCircle, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

export default function PayPalCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('processing');
  const [merchantId, setMerchantId] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    // Check for merchant ID or error in the URL
    // PayPal may return either a successful connection with merchantId,
    // or an error message if the user cancelled or there was an issue
    const merchantIdParam = searchParams.get('merchantIdInPayPal') || searchParams.get('merchantId');
    const sandboxEmail = searchParams.get('email');
    const errorParam = searchParams.get('error') || searchParams.get('message');
    
    // Log all params for debugging
    console.log('PayPal callback params:', Object.fromEntries([...searchParams.entries()]));
    
    if (errorParam) {
      console.error('PayPal connection error:', errorParam);
      setErrorDetails(errorParam);
      setStatus('error');
      return;
    }
    
    // If we have merchantId or sandbox email, update the provider's PayPal status
    if (merchantIdParam || sandboxEmail) {
      if (merchantIdParam) {
        setMerchantId(merchantIdParam);
      }
      
      // Call our API to update the provider's PayPal status
      updateProviderPayPalStatus(merchantIdParam, sandboxEmail)
        .then((result) => {
          console.log('PayPal account check result:', result);
          setMerchantId(result.merchantId);
          setStatus('success');
        })
        .catch(err => {
          console.error('Error saving merchant ID:', err);
          setErrorDetails(err.message || 'Failed to save merchant ID');
          setStatus('error');
        });
    } else {
      // If no merchant ID and no error, the connection might be pending or there's an issue
      fetchProviderPayPalStatus()
        .then((result) => {
          if (result.paypalMerchantId) {
            setMerchantId(result.paypalMerchantId);
            setStatus('success');
          } else {
            setErrorDetails('No merchant ID found in the callback URL or in your profile');
            setStatus('error');
          }
        })
        .catch(err => {
          console.error('Error checking provider status:', err);
          setErrorDetails(err.message || 'Failed to check provider status');
          setStatus('error');
        });
    }
  }, [searchParams]);
  
  // Function to update the provider's PayPal status
  const updateProviderPayPalStatus = async (merchantId, sandboxEmail) => {
    try {
      const response = await fetch('/api/provider/paypal/account-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId,
          sandboxEmail
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update PayPal status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating PayPal status:', error);
      throw error;
    }
  };
  
  // Function to check if the provider already has a PayPal account
  const fetchProviderPayPalStatus = async () => {
    try {
      const response = await fetch('/api/provider/paypal/status', {
        method: 'GET'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check PayPal status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking PayPal status:', error);
      throw error;
    }
  };
  
  return (
    <Box maxW="800px" mx="auto" mt={10} p={6} boxShadow="md" borderRadius="lg" bg="white">
      <VStack spacing={6} align="center">
        {status === 'processing' && (
          <>
            <Heading size="lg">Processing Your PayPal Connection</Heading>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text>Connecting your PayPal account to All Party Rent...</Text>
          </>
        )}
        
        {status === 'success' && (
          <>
            <Heading size="lg" color="green.500">PayPal Connected Successfully!</Heading>
            <Box fontSize="5xl" color="green.500">
              <FaCheckCircle />
            </Box>
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              Your PayPal account has been successfully connected to All Party Rent.
            </Alert>
            <Box mt={3}>
              <Text fontWeight="bold">Merchant ID:</Text>
              <Text>{merchantId}</Text>
            </Box>
            <Text>You can now receive payments for your services through PayPal.</Text>
          </>
        )}
        
        {status === 'error' && (
          <>
            <Heading size="lg" color="red.500">Connection Failed</Heading>
            <Box fontSize="5xl" color="red.500">
              <FaExclamationTriangle />
            </Box>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              We couldn't connect your PayPal account. Please try again.
            </Alert>
            {errorDetails && (
              <Box mt={3} p={3} bg="gray.50" borderRadius="md" width="100%">
                <Text fontWeight="bold">Error Details:</Text>
                <Code p={2} mt={1} width="100%">{errorDetails}</Code>
              </Box>
            )}
          </>
        )}
        
        <Flex mt={6}>
          <Button 
            leftIcon={<FaArrowLeft />} 
            colorScheme="blue" 
            onClick={() => router.push('/provider/settings/payments')}
          >
            Return to Payments Settings
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
} 