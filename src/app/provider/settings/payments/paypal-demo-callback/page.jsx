'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heading, Text, Box, Alert, AlertIcon, Button, Flex, Spinner, VStack, Tag, HStack } from '@chakra-ui/react';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

export default function PayPalDemoCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('processing');
  const [merchantId, setMerchantId] = useState('');

  useEffect(() => {
    const merchantIdParam = searchParams.get('merchantId');
    const statusParam = searchParams.get('status');
    
    if (merchantIdParam) {
      setMerchantId(merchantIdParam);
    }
    
    // Simulate processing
    const timer = setTimeout(() => {
      if (statusParam === 'connected') {
        // Update the provider's PayPal status in the database
        updateProviderPayPalStatus(merchantIdParam)
          .then(() => {
            setStatus('success');
          })
          .catch(err => {
            console.error('Error saving merchant ID:', err);
            setStatus('error');
          });
      } else {
        setStatus('error');
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [searchParams]);
  
  // Function to update the provider's PayPal status
  const updateProviderPayPalStatus = async (merchantId) => {
    try {
      const response = await fetch('/api/provider/paypal/account-check?sandbox=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: merchantId,
          sandbox: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update PayPal status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating PayPal status:', error);
      throw error;
    }
  };
  
  return (
    <Box maxW="800px" mx="auto" mt={10} p={6} boxShadow="md" borderRadius="lg" bg="white">
      <VStack spacing={6} align="center">
        {status === 'processing' && (
          <>
            <HStack>
              <Heading size="lg">Processing Your PayPal Connection</Heading>
              <Tag colorScheme="purple">Sandbox</Tag>
            </HStack>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text>Connecting your PayPal Sandbox account to All Party Rent...</Text>
          </>
        )}
        
        {status === 'success' && (
          <>
            <HStack>
              <Heading size="lg" color="green.500">PayPal Connected Successfully!</Heading>
              <Tag colorScheme="purple">Sandbox</Tag>
            </HStack>
            <Box fontSize="5xl" color="green.500">
              <FaCheckCircle />
            </Box>
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              Your PayPal Sandbox account has been successfully connected to All Party Rent.
            </Alert>
            <Box mt={3}>
              <Text fontWeight="bold">Sandbox Merchant ID:</Text>
              <Text>{merchantId}</Text>
            </Box>
            <Text>You can now receive sandbox payments for your services through PayPal.</Text>
          </>
        )}
        
        {status === 'error' && (
          <>
            <HStack>
              <Heading size="lg" color="red.500">Connection Failed</Heading>
              <Tag colorScheme="purple">Sandbox</Tag>
            </HStack>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              We couldn't connect your PayPal Sandbox account. Please try again.
            </Alert>
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