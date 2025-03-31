"use client";

import { useState } from 'react';
import { 
  Box, 
  Button, 
  Card,
  CardBody,
  VStack, 
  FormControl, 
  FormLabel, 
  Input, 
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
} from '@chakra-ui/react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };
  
export default function PaymentComponent({ offer, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      city: '',
      postal_code: '',
      country: 'US',
    },
  });
  
  // Handle card input changes
  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : '');
  };
  
  // Handle billing details changes
  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBillingDetails((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setBillingDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create payment intent
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: offer.amount,
          offerId: offer.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.message || 'Failed to create payment intent');
      }

      // Confirm card payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
        payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Update offer status
        const updateResponse = await fetch(`/api/offers/${offer.id}/payment-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId: paymentIntent.id,
          }),
        });

        const updateData = await updateResponse.json();

        if (!updateData.success) {
          throw new Error(updateData.error.message || 'Failed to update offer status');
        }
        
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment',
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
          {isComplete ? (
            <Alert
              status="success"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="200px"
              borderRadius="md"
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Payment Successful!
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                Your payment has been processed successfully. Your advertisement will be activated shortly.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Payment Details</Heading>
                
                <Box bg="gray.50" p={4} borderRadius="md">
                  <HStack justify="space-between" mb={1}>
                    <Text>Service:</Text>
                    <Text fontWeight="bold">{offer.service.name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Provider:</Text>
                    <Text fontWeight="bold">{offer.serviceProvider.name}</Text>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontSize="lg">Total Amount:</Text>
                    <Text fontSize="xl" fontWeight="bold" color="brand.500">
                      ${Number(offer.amount).toFixed(2)}
                    </Text>
                  </HStack>
                </Box>
                
                <FormControl isRequired>
                  <FormLabel>Card Information</FormLabel>
                  <Box 
                    borderWidth="1px" 
                    borderRadius="md" 
                    p={3}
                    borderColor={cardError ? "red.300" : "gray.200"}
                  >
                    <CardElement 
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                          invalid: {
                            color: '#9e2146',
                          },
                        },
                      }} 
                      onChange={handleCardChange}
                    />
                  </Box>
                  {cardError && (
                    <Text color="red.500" fontSize="sm" mt={1}>{cardError}</Text>
                  )}
                </FormControl>
                
                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  isLoading={isProcessing}
                  loadingText="Processing..."
                  isDisabled={!stripe || isProcessing}
                >
                  Pay ${Number(offer.amount).toFixed(2)}
                </Button>
                
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Your payment information is processed securely via Stripe. We do not store your card details.
                </Text>
              </VStack>
            </form>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
} 