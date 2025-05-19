"use client";

import { useState } from 'react';
import { 
  Box, 
  Button, 
  Card,
  CardBody,
  VStack, 
  Text,
  useToast,
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  HStack,
  Divider,
  Heading,
  Spinner,
  Center,
  Image,
} from '@chakra-ui/react';

/**
 * PayPal Payment Component Placeholder
 * This component has been simplified after removing Stripe integration
 */
export default function PaymentComponent({ offer, onClose }) {
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Simulated payment handling
  const handlePayPalPayment = async () => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would redirect to PayPal
      // or integrate with the PayPal JS SDK
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully via PayPal.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Heading size="md">Payment Details</Heading>
          
          {offer && (
            <Box bg="gray.50" p={4} borderRadius="md">
              <HStack justify="space-between" mb={1}>
                <Text>Service:</Text>
                <Text fontWeight="bold">{offer.service?.name || 'Service'}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Provider:</Text>
                <Text fontWeight="bold">{offer.serviceProvider?.name || 'Provider'}</Text>
              </HStack>
              <Divider my={2} />
              <HStack justify="space-between">
                <Text fontSize="lg">Total Amount:</Text>
                <Text fontSize="xl" fontWeight="bold" color="brand.500">
                  ${Number(offer.amount || 0).toFixed(2)}
                </Text>
              </HStack>
            </Box>
          )}
          
          <Alert
            status="info"
            variant="subtle"
            borderRadius="md"
          >
            <AlertIcon />
            <Box>
              <AlertTitle>PayPal Integration</AlertTitle>
              <AlertDescription>
                Payment processing is handled through PayPal. You will be redirected to
                complete your payment securely.
              </AlertDescription>
            </Box>
          </Alert>
          
          <Center p={4}>
            <Image 
              src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/checkout-logo-large.png" 
              alt="PayPal Checkout" 
              htmlWidth="200px"
            />
          </Center>
          
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handlePayPalPayment}
            isLoading={isProcessing}
            loadingText="Processing"
          >
            Pay with PayPal
          </Button>
          
          <Button variant="ghost" onClick={onClose} isDisabled={isProcessing}>
            Cancel
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
} 