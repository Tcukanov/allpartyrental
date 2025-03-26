'use client'
import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Box,
  Divider,
  HStack,
  useToast,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { CheckIcon, InfoIcon } from '@chakra-ui/icons';
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

export default function PaymentComponent({ amount, description, onSuccess }) {
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
      // Stripe.js has not yet loaded.
      return;
    }
    
    if (!billingDetails.name || !billingDetails.email || !billingDetails.address.line1) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const cardElement = elements.getElement(CardElement);
      
      // Use Stripe.js to confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment('client_secret_placeholder', {
        payment_method: {
          card: cardElement,
          billing_details: billingDetails,
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Process successful result
      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        // In a real app, we would make an API call to our backend to confirm payment was processed
        setIsComplete(true);
        
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Call the success callback (may redirect or update UI in parent)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(paymentIntent);
          }, 2000);
        }
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      toast({
        title: 'Payment Failed',
        description: error.message || 'There was an issue processing your payment',
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
                    <Text>Amount:</Text>
                    <Text fontWeight="bold">${amount.toFixed(2)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Description:</Text>
                    <Text>{description}</Text>
                  </HStack>
                </Box>
                
                <FormControl isRequired>
                  <FormLabel>Name on Card</FormLabel>
                  <Input 
                    name="name"
                    value={billingDetails.name}
                    onChange={handleBillingChange}
                    placeholder="John Smith"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input 
                    name="email"
                    type="email"
                    value={billingDetails.email}
                    onChange={handleBillingChange}
                    placeholder="john@example.com"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Address</FormLabel>
                  <Input 
                    name="address.line1"
                    value={billingDetails.address.line1}
                    onChange={handleBillingChange}
                    placeholder="123 Main St"
                    mb={2}
                  />
                  
                  <HStack spacing={2}>
                    <Input 
                      name="address.city"
                      value={billingDetails.address.city}
                      onChange={handleBillingChange}
                      placeholder="City"
                    />
                    <Input 
                      name="address.postal_code"
                      value={billingDetails.address.postal_code}
                      onChange={handleBillingChange}
                      placeholder="Zip Code"
                    />
                  </HStack>
                </FormControl>
                
                <Divider />
                
                <FormControl isRequired>
                  <FormLabel>Card Information</FormLabel>
                  <Box 
                    borderWidth="1px" 
                    borderRadius="md" 
                    p={3}
                    borderColor={cardError ? "red.300" : "gray.200"}
                  >
                    <CardElement 
                      options={CARD_ELEMENT_OPTIONS} 
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
                  loadingText="Processing"
                  isDisabled={!stripe}
                >
                  Pay ${amount.toFixed(2)}
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