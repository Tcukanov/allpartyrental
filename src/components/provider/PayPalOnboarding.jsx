'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Badge,
  useToast
} from '@chakra-ui/react';
import { FaPaypal, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const PayPalOnboarding = () => {
  const [onboardingStatus, setOnboardingStatus] = useState('NOT_STARTED');
  const [loading, setLoading] = useState(false);
  const [providerData, setProviderData] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const fetchProviderStatus = async () => {
    try {
      const response = await fetch('/api/provider/paypal-status');
      if (response.ok) {
        const data = await response.json();
        setProviderData(data);
        setOnboardingStatus(data.paypalStatus || 'NOT_STARTED');
      }
    } catch (error) {
      console.error('Error fetching provider status:', error);
    }
  };

  const startOnboarding = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/provider/paypal-onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/provider/settings/payments?onboarding=complete`
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to PayPal onboarding
        window.location.href = data.onboardingUrl;
      } else {
        const error = await response.json();
        toast({
          title: 'Onboarding Failed',
          description: error.message || 'Failed to start PayPal onboarding',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error starting onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to start PayPal onboarding',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (onboardingStatus) {
      case 'NOT_STARTED':
        return {
          color: 'gray',
          icon: FaPaypal,
          title: 'PayPal Account Not Connected',
          description: 'Connect your PayPal account to receive payments directly'
        };
      case 'IN_PROGRESS':
        return {
          color: 'yellow',
          icon: FaExclamationTriangle,
          title: 'PayPal Onboarding In Progress',
          description: 'Complete your PayPal setup to start receiving payments'
        };
      case 'COMPLETED':
        return {
          color: 'green',
          icon: FaCheckCircle,
          title: 'PayPal Account Connected',
          description: 'You will receive payments directly to your PayPal account'
        };
      default:
        return {
          color: 'gray',
          icon: FaPaypal,
          title: 'PayPal Status Unknown',
          description: 'Check your PayPal connection status'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <Heading size="md">
          <HStack>
            <Icon as={FaPaypal} color="blue.500" />
            <Text>PayPal Marketplace Integration</Text>
          </HStack>
        </Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          
          {/* Status Display */}
          <Box>
            <HStack mb={4}>
              <Icon as={statusInfo.icon} color={`${statusInfo.color}.500`} size="lg" />
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" color={`${statusInfo.color}.600`}>
                  {statusInfo.title}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {statusInfo.description}
                </Text>
              </VStack>
              <Badge colorScheme={statusInfo.color} ml="auto">
                {onboardingStatus.replace('_', ' ')}
              </Badge>
            </HStack>
          </Box>

          {/* Benefits */}
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="lg" mb={2}>
                🚀 Marketplace Benefits
              </AlertTitle>
              <AlertDescription>
                <VStack align="start" spacing={2}>
                  <Text>✅ <strong>Instant Payments:</strong> Receive money directly when bookings are confirmed</Text>
                  <Text>✅ <strong>Automatic Commission:</strong> Platform fee is deducted automatically</Text>
                  <Text>✅ <strong>No Manual Payouts:</strong> No waiting for manual transfers</Text>
                  <Text>✅ <strong>Lower Fees:</strong> Reduced transaction costs</Text>
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>

          {/* Commission Info */}
          <Box bg="blue.50" p={4} borderRadius="md">
            <Text fontWeight="bold" mb={2}>Payment Structure:</Text>
            <VStack align="start" spacing={1} fontSize="sm">
              <Text>• Client pays: Service Price + 5% client fee</Text>
              <Text>• You receive: Service Price - 12% platform commission</Text>
              <Text>• Platform keeps: 12% commission + 5% client fee</Text>
            </VStack>
          </Box>

          {/* Provider Info */}
          {providerData && (
            <Box>
              <Text fontWeight="bold" mb={2}>Your Information:</Text>
              <VStack align="start" spacing={1} fontSize="sm">
                <Text>Business: {providerData.businessName}</Text>
                {providerData.paypalMerchantId && (
                  <Text>PayPal Merchant ID: {providerData.paypalMerchantId}</Text>
                )}
              </VStack>
            </Box>
          )}

          {/* Action Button */}
          <Box>
            {onboardingStatus === 'NOT_STARTED' && (
              <Button
                colorScheme="blue"
                size="lg"
                onClick={startOnboarding}
                isLoading={loading}
                loadingText="Starting onboarding..."
                leftIcon={<Icon as={FaPaypal} />}
                width="full"
              >
                Connect PayPal Account
              </Button>
            )}

            {onboardingStatus === 'IN_PROGRESS' && (
              <Button
                colorScheme="yellow"
                size="lg"
                onClick={startOnboarding}
                isLoading={loading}
                loadingText="Checking status..."
                leftIcon={<Icon as={FaExclamationTriangle} />}
                width="full"
              >
                Complete PayPal Setup
              </Button>
            )}

            {onboardingStatus === 'COMPLETED' && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>All Set! 🎉</AlertTitle>
                  <AlertDescription>
                    Your PayPal account is connected and ready to receive payments.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </Box>

          {/* Help Text */}
          <Box fontSize="sm" color="gray.600">
            <Text fontWeight="bold" mb={1}>Need Help?</Text>
            <Text>
              If you encounter any issues during onboarding, please contact our support team.
              Your PayPal account must be a business account to receive marketplace payments.
            </Text>
          </Box>

        </VStack>
      </CardBody>
    </Card>
  );
};

export default PayPalOnboarding; 