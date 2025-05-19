"use client";

import React, { useState } from 'react';
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
  Flex,
  Badge,
  Checkbox,
  Link as ChakraLink,
  Image,
  Center,
} from '@chakra-ui/react';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';

export default function ServiceRequestPayment({ service, offer, onPaymentComplete, onCancel, bookingDetails }) {
  const toast = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [reviewDeadline, setReviewDeadline] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Calculate total amount (including platform fee)
  const servicePrice = offer?.price || service?.price || 0;
  // Fixed price regardless of duration
  const baseAmount = Number(servicePrice);
  
  // Calculate addon prices if present
  const selectedAddons = bookingDetails?.addons || [];
  const addonsTotal = selectedAddons.reduce((total, addon) => 
    total + Number(addon.price), 0
  );
  
  const serviceFeePercent = 5.0; // 5% platform fee for clients
  const subtotal = baseAmount + addonsTotal;
  const serviceFee = subtotal * (serviceFeePercent / 100);
  const totalAmount = subtotal + Number(serviceFee);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        title: "Terms and Conditions",
        description: "You must accept the Terms and Conditions to proceed.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // First, validate that we have either an offer or a service
      if (!offer && !service) {
        throw new Error('No service or offer provided');
      }

      // Validate required fields for service
      if (!offer && service) {
        if (!service.providerId) {
          console.error("Service missing providerId:", service);
          throw new Error('Service is missing provider information. Please try again later.');
        }
      }

      // Create transaction
      console.log("Creating transaction with:", {
        serviceId: !offer ? service.id : null,
        offerId: offer?.id,
        amount: baseAmount,
        providerId: offer?.providerId || service?.providerId,
        bookingDate: bookingDetails?.isoDateTime || undefined,
        duration: bookingDetails?.duration || undefined
      });
      
      // Flag to track if we already attempted to create a transaction
      let transactionCreated = false;
      
      if (!offer && service) {
        console.log("Direct Service Transaction Mode - Service details:", {
          id: service.id,
          name: service.name, 
          providerId: service.providerId,
          price: service.price,
          bookingDetails: bookingDetails
        });
        
        // Create transaction
        try {
          console.log("Creating transaction...");
          const transactionResponse = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId: service.id,
              bookingDate: bookingDetails?.isoDateTime,
              duration: bookingDetails?.duration,
              comments: bookingDetails?.comments
            }),
          });
          
          const transactionData = await transactionResponse.json();
          console.log("Transaction response:", transactionData);
          
          if (transactionData.success) {
            console.log("Transaction created successfully!");
            transactionCreated = true;
            
            // Use the transaction from the response
            setTransaction(transactionData.data.transaction);
            
            // Simulate successful payment for now
            setTimeout(() => {
              setIsComplete(true);
              toast({
                title: "Payment authorized!",
                description: "Your payment has been authorized through PayPal and will be held in escrow. The provider now has 24 hours to review and approve your request.",
                status: "success",
                duration: 8000,
                isClosable: true,
              });
              
              // Call onPaymentComplete callback
              if (onPaymentComplete) {
                onPaymentComplete(transactionData.data.transaction);
              }
            }, 2000);
          } else {
            throw new Error(transactionData.error?.message || 'Failed to create transaction');
          }
        } catch (error) {
          console.error("Error creating transaction:", error);
          throw error;
        }
      } else if (offer) {
        console.log("Offer-based payment - Offer details:", offer);
        
        try {
          // Create transaction from offer
          const transactionResponse = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              offerId: offer.id
            }),
          });
          
          const transactionData = await transactionResponse.json();
          console.log("Transaction response from offer:", transactionData);
          
          if (transactionData.success) {
            console.log("Transaction created successfully from offer!");
            transactionCreated = true;
            
            // Use the transaction from the response
            setTransaction(transactionData.data.transaction);
            
            // Simulate successful payment for now
            setTimeout(() => {
              setIsComplete(true);
              toast({
                title: "Payment authorized!",
                description: "Your payment has been authorized through PayPal and will be held in escrow. The provider now has 24 hours to review and approve your request.",
                status: "success",
                duration: 8000,
                isClosable: true,
              });
              
              // Call onPaymentComplete callback
              if (onPaymentComplete) {
                onPaymentComplete(transactionData.data.transaction);
              }
            }, 2000);
          } else {
            throw new Error(transactionData.error?.message || 'Failed to create transaction from offer');
          }
        } catch (error) {
          console.error("Error creating transaction from offer:", error);
          throw error;
        }
      }
      
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(error.message);
      toast({
        title: "Payment failed",
        description: error.message || "There was an error processing your payment. Please try again or contact support.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    return new Date(date).toLocaleString('en-US', options);
  };

  const BookingSummary = ({ bookingInfo }) => (
    <Box mb={4} p={4} bg="gray.50" borderRadius="md">
      <Heading size="sm" mb={2}>Booking Details</Heading>
      <VStack align="stretch" spacing={1}>
        {bookingInfo?.isoDateTime && (
          <HStack justify="space-between">
            <Text fontSize="sm">Date/Time:</Text>
            <Text fontSize="sm" fontWeight="medium">
              {new Date(bookingInfo.isoDateTime).toLocaleString()}
            </Text>
          </HStack>
        )}
        {bookingInfo?.duration && (
          <HStack justify="space-between">
            <Text fontSize="sm">Duration:</Text>
            <Text fontSize="sm" fontWeight="medium">{bookingInfo.duration} hours</Text>
          </HStack>
        )}
        {bookingInfo?.comments && (
          <Box mt={2}>
            <Text fontSize="sm" fontWeight="medium">Additional Comments:</Text>
            <Text fontSize="sm">{bookingInfo.comments}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );

  const updateTermsAcceptance = async (transactionId) => {
    // Future endpoint to record terms acceptance
    try {
      const response = await fetch(`/api/transactions/${transactionId}/terms-acceptance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accepted: termsAccepted,
          acceptedAt: new Date().toISOString()
        }),
      });
      
      // We don't need to handle the response here, this is just to record it
      console.log("Terms acceptance recorded:", await response.json());
    } catch (error) {
      // Just log the error, don't disrupt the flow
      console.error("Error recording terms acceptance:", error);
    }
  };

  return (
    <Card>
      <CardBody>
        {isComplete ? (
          <VStack spacing={6} align="stretch">
            <Box textAlign="center" py={6}>
              <Heading size="md" mb={2} color="green.500">Payment Successful!</Heading>
              <Text>
                Your payment has been authorized and will be held securely until the service is completed.
              </Text>
              
              {reviewDeadline && (
                <Alert status="info" mt={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Provider Review Period</AlertTitle>
                    <AlertDescription>
                      The provider has until {formatTime(reviewDeadline)} to review your booking request.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
              
              <Button 
                colorScheme="brand" 
                mt={6} 
                onClick={() => {
                  if (onPaymentComplete && transaction) {
                    onPaymentComplete(transaction);
                  }
                }}
              >
                Continue
              </Button>
            </Box>
          </VStack>
        ) : (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Payment Details</Heading>
            
            {service && <BookingSummary bookingInfo={bookingDetails} />}
            
            <Box bg="gray.50" p={4} borderRadius="md">
              <Heading size="sm" mb={3}>Service Summary</Heading>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm">Service:</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {offer?.service?.name || service?.name || 'Service'}
                </Text>
              </HStack>
              <Divider my={2} />
              <HStack justify="space-between">
                <Text>Subtotal:</Text>
                <Text fontWeight="medium">{formatCurrency(subtotal)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Service Fee ({serviceFeePercent}%):</Text>
                <Text fontWeight="medium">{formatCurrency(serviceFee)}</Text>
              </HStack>
              <Divider my={2} />
              <HStack justify="space-between">
                <Text fontSize="lg">Total:</Text>
                <Text fontSize="xl" fontWeight="bold" color="brand.500">
                  {formatCurrency(totalAmount)}
                </Text>
              </HStack>
            </Box>
            
            <Alert
              status="info"
              variant="subtle"
              borderRadius="md"
            >
              <AlertIcon />
              <Box>
                <AlertTitle>Payment Protection</AlertTitle>
                <AlertDescription>
                  Your payment will be held securely until the service is completed. 
                  If there are any issues, you can request a refund.
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
            
            <FormControl isRequired>
              <Checkbox 
                isChecked={termsAccepted} 
                onChange={(e) => setTermsAccepted(e.target.checked)}
                colorScheme="brand"
              >
                I accept the <ChakraLink as={Link} href="/terms" color="brand.500" isExternal>Terms of Service</ChakraLink> and <ChakraLink as={Link} href="/privacy" color="brand.500" isExternal>Privacy Policy</ChakraLink>
              </Checkbox>
            </FormControl>
            
            {paymentError && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Payment Failed</AlertTitle>
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}
            
            <HStack spacing={4} justify="space-between">
              <Button variant="ghost" onClick={onCancel} isDisabled={isProcessing}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleSubmit}
                isLoading={isProcessing}
                loadingText="Processing"
                disabled={!termsAccepted}
              >
                Pay with PayPal
              </Button>
            </HStack>
          </VStack>
        )}
      </CardBody>
    </Card>
  );
} 