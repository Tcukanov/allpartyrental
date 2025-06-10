'use client';

import React, { useState, useEffect, use } from 'react';
import {
  Container,
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Badge,
  Image,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Flex,
  List,
  ListItem,
  ListIcon,
  Icon,
  FormControl,
  FormLabel,
  Input
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, CalendarIcon, PhoneIcon } from '@chakra-ui/icons';
import { FiMapPin } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import PayPalAdvancedCreditCard from '@/components/payment/PayPalAdvancedCreditCard';

export default function PaymentPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  
  const [bookingData, setBookingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [cardFieldsReady, setCardFieldsReady] = useState(false);

  // Unwrap params using use() as required by Next.js 15
  const { serviceId } = use(params);

  // Load booking data from sessionStorage
  useEffect(() => {
    try {
      const storedBooking = sessionStorage.getItem('pendingBooking');
      if (storedBooking) {
        const parsed = JSON.parse(storedBooking);
        if (parsed.serviceId === serviceId) {
          setBookingData(parsed);
        } else {
          throw new Error('Booking data mismatch');
        }
      } else {
        throw new Error('No booking data found');
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
      toast({
        title: 'Booking data not found',
        description: 'Please start the booking process again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push(`/services/${serviceId}`);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, router, toast]);

  // Load PayPal SDK
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
      console.error('PayPal Client ID not found');
      return;
    }

    // Check if PayPal is already loaded
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&components=buttons,hosted-fields&disable-funding=venmo,paylater&enable-funding=card`;
    script.async = true;
    
    script.onload = () => {
      console.log('PayPal SDK loaded successfully');
      // Add a small delay to ensure PayPal is fully ready
      setTimeout(() => {
        setPaypalLoaded(true);
      }, 500);
    };
    
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      toast({
        title: 'Payment Error',
        description: 'Failed to load payment system. Please refresh the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector(`script[src*="paypal"]`);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [toast]);

  // Initialize PayPal buttons for PayPal wallet payments only
  useEffect(() => {
    if (!paypalLoaded || !bookingData || !window.paypal) return;

    let retryCount = 0;
    const maxRetries = 5;

    const tryInitialize = () => {
      const paypalButtonsContainer = document.getElementById('paypal-buttons');
      if (paypalButtonsContainer) {
        console.log('PayPal buttons container found, initializing...');
        paypalButtonsContainer.innerHTML = '';
        initializePayPalButtons();
      } else {
        retryCount++;
        console.log(`PayPal buttons container not found (attempt ${retryCount}/${maxRetries})`);
        
        if (retryCount < maxRetries) {
          setTimeout(tryInitialize, 200 * retryCount); // Exponential backoff
        } else {
          console.error('PayPal buttons container not found after all retries');
          toast({
            title: 'PayPal Loading Issue',
            description: 'PayPal wallet payment option is temporarily unavailable. You can still use credit cards.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    // Start with a small delay
    const timer = setTimeout(tryInitialize, 500);

    return () => clearTimeout(timer);
  }, [paypalLoaded, bookingData]);

  const initializePayPalButtons = () => {
    // Double-check that the container exists
    const container = document.getElementById('paypal-buttons');
    if (!container) {
      console.error('PayPal buttons container not found when trying to initialize');
      toast({
        title: 'Payment System Error',
        description: 'Unable to load PayPal buttons. Please refresh the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    console.log('Initializing PayPal buttons for wallet payments...');
    
    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
        height: 50,
        tagline: false
      },
      fundingSource: window.paypal.FUNDING.PAYPAL,
      createOrder: async () => {
        setIsProcessingPayment(true);
        
        try {
          console.log('Creating payment order...');
          
          const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId: bookingData.serviceId,
              bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
              hours: bookingData.bookingDetails.duration || 4,
              address: `${bookingData.bookingDetails.address}, ${bookingData.bookingDetails.city} ${bookingData.bookingDetails.zipCode}`,
              comments: bookingData.bookingDetails.specialRequests || '',
              contactPhone: bookingData.bookingDetails.contactPhone,
              guestCount: bookingData.bookingDetails.guestCount,
              paymentMethod: 'paypal_buttons'
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Create order failed:', response.status, errorText);
            throw new Error(`Payment order creation failed: ${response.status}`);
          }

          const data = await response.json();
          console.log('Order created:', data);
          
          if (!data.success || !data.orderId) {
            throw new Error(data.error || 'Failed to create payment order');
          }

          return data.orderId;
          
        } catch (error) {
          console.error('Create order error:', error);
          setIsProcessingPayment(false);
          toast({
            title: 'Payment Error',
            description: `Failed to create payment order: ${error.message}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          throw error;
        }
      },
      onApprove: async (data) => {
        try {
          console.log('Payment approved:', data.orderID);
          
          const response = await fetch('/api/payments/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: data.orderID
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Capture failed:', response.status, errorText);
            throw new Error(`Payment capture failed: ${response.status}`);
          }

          const result = await response.json();
          console.log('Payment captured:', result);
          
          if (!result.success) {
            throw new Error(result.error || 'Payment capture failed');
          }

          // Clear booking data from sessionStorage
          sessionStorage.removeItem('pendingBooking');
          
          // Show success message
          toast({
            title: 'Payment Successful!',
            description: 'Your booking has been submitted to the provider for confirmation.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Redirect to confirmation page
          router.push(`/book/${serviceId}/confirmed?orderId=${data.orderID}`);
          
        } catch (error) {
          console.error('Capture error:', error);
          setIsProcessingPayment(false);
          toast({
            title: 'Payment Processing Failed',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        setIsProcessingPayment(false);
        
        let errorMessage = 'Payment failed. Please try again.';
        if (err.message) {
          errorMessage = err.message;
        }
        
        toast({
          title: 'Payment Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
      onCancel: () => {
        console.log('Payment cancelled by user');
        setIsProcessingPayment(false);
        toast({
          title: 'Payment Cancelled',
          description: 'You can try again when ready.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }).render('#paypal-buttons').catch((error) => {
      console.error('Failed to initialize PayPal buttons:', error);
      
      // Show user-friendly error
      toast({
        title: 'PayPal Loading Error',
        description: 'PayPal buttons failed to load. Please refresh the page or try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Try to update the container with error message
      const paypalButtonsContainer = document.getElementById('paypal-buttons');
      if (paypalButtonsContainer) {
        paypalButtonsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #e53e3e;">PayPal buttons failed to load. Please refresh the page.</div>';
      }
    });
  };

  const initializeCreditCardButtons = () => {
    // Create PayPal buttons specifically configured for credit card payments
    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'black',
        shape: 'rect',
        label: 'pay',
        height: 50,
        tagline: false
      },
      fundingSource: window.paypal.FUNDING.CARD, // Force credit card funding
      
      createOrder: async () => {
        setIsProcessingPayment(true);
        
        try {
          console.log('Creating payment order for card...');
          
          const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId: bookingData.serviceId,
              bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
              hours: bookingData.bookingDetails.duration || 4,
              address: `${bookingData.bookingDetails.address}, ${bookingData.bookingDetails.city} ${bookingData.bookingDetails.zipCode}`,
              comments: bookingData.bookingDetails.specialRequests || '',
              contactPhone: bookingData.bookingDetails.contactPhone,
              guestCount: bookingData.bookingDetails.guestCount,
              paymentMethod: 'paypal_card'
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Create order failed:', response.status, errorText);
            throw new Error(`Payment order creation failed: ${response.status}`);
          }

          const data = await response.json();
          console.log('Order created for card:', data);
          
          if (!data.success || !data.orderId) {
            throw new Error(data.error || 'Failed to create payment order');
          }

          return data.orderId;
          
        } catch (error) {
          console.error('Create order error:', error);
          setIsProcessingPayment(false);
          toast({
            title: 'Payment Error',
            description: `Failed to create payment order: ${error.message}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          throw error;
        }
      },

      onApprove: async (data) => {
        try {
          console.log('Card payment approved:', data.orderID);
          
          const response = await fetch('/api/payments/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: data.orderID
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Capture failed:', response.status, errorText);
            throw new Error(`Payment capture failed: ${response.status}`);
          }

          const result = await response.json();
          console.log('Card payment captured:', result);
          
          if (!result.success) {
            throw new Error(result.error || 'Payment capture failed');
          }

          // Clear booking data from sessionStorage
          sessionStorage.removeItem('pendingBooking');
          
          // Show success message
          toast({
            title: 'Payment Successful!',
            description: 'Your booking has been submitted to the provider for confirmation.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Redirect to confirmation page
          router.push(`/book/${serviceId}/confirmed?orderId=${data.orderID}`);
          
        } catch (error) {
          console.error('Card payment error:', error);
          setIsProcessingPayment(false);
          toast({
            title: 'Payment Processing Failed',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      },

      onError: (err) => {
        console.error('PayPal card error:', err);
        setIsProcessingPayment(false);
        
        let errorMessage = 'Card payment failed. Please try again.';
        if (err.message) {
          errorMessage = err.message;
        }
        
        toast({
          title: 'Payment Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },

      onCancel: () => {
        console.log('Card payment cancelled by user');
        setIsProcessingPayment(false);
        toast({
          title: 'Payment Cancelled',
          description: 'You can try again when ready.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }).render('#card-buttons').catch((error) => {
      console.error('Failed to initialize credit card buttons:', error);
      // Fallback: Hide the credit card section if it fails
      const cardSection = document.getElementById('card-section');
      if (cardSection) {
        cardSection.style.display = 'none';
      }
      toast({
        title: 'Credit Card Option Unavailable',
        description: 'Please use PayPal to complete your payment.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      setCardFieldsReady(false);
    });
    
    setCardFieldsReady(true);
  };

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={10}>
        <Flex justify="center" align="center" minH="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading payment page...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  if (!bookingData) {
    return (
      <Container maxW="container.lg" py={10}>
        <Alert status="error">
          <AlertIcon />
          Booking data not found. Please start the booking process again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Back button */}
      <Button
        as={Link}
        href={`/book/${serviceId}`}
        leftIcon={<ArrowBackIcon />}
        variant="ghost"
        mb={6}
        isDisabled={isProcessingPayment}
      >
        Back to booking details
      </Button>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 400px' }} gap={8}>
        {/* Main content */}
        <GridItem>
          <VStack spacing={8} align="stretch">
            
            {/* Header */}
            <Box>
              <Heading size="lg" mb={2}>Complete your payment</Heading>
              <Text color="gray.600">Review your booking and pay securely with PayPal</Text>
            </Box>

            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <Heading size="md">Booking Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  
                  {/* Service */}
                  <HStack spacing={4}>
                    {bookingData.service.photos && bookingData.service.photos[0] && (
                      <Image
                        src={bookingData.service.photos[0]}
                        alt={bookingData.service.name}
                        boxSize="60px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <Box flex="1">
                      <Heading size="sm" mb={1}>{bookingData.service.name}</Heading>
                      <Badge colorScheme="blue">${bookingData.service.price}</Badge>
                    </Box>
                  </HStack>

                  <Divider />

                  {/* Booking Details */}
                  <List spacing={3}>
                    <ListItem>
                      <ListIcon as={CalendarIcon} color="blue.500" />
                      <strong>Date & Time:</strong> {bookingData.bookingDetails.date} at {bookingData.bookingDetails.time}
                    </ListItem>
                    <ListItem>
                      <ListIcon as={FiMapPin} color="red.500" />
                      <strong>Location:</strong> {bookingData.bookingDetails.address}, {bookingData.bookingDetails.city} {bookingData.bookingDetails.zipCode}
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckIcon} color="green.500" />
                      <strong>Guests:</strong> {bookingData.bookingDetails.guestCount}
                    </ListItem>
                    {bookingData.bookingDetails.contactPhone && (
                      <ListItem>
                        <ListIcon as={PhoneIcon} color="purple.500" />
                        <strong>Contact:</strong> {bookingData.bookingDetails.contactPhone}
                      </ListItem>
                    )}
                    {bookingData.bookingDetails.specialRequests && (
                      <ListItem>
                        <ListIcon as={CheckIcon} color="orange.500" />
                        <strong>Special Requests:</strong> {bookingData.bookingDetails.specialRequests}
                      </ListItem>
                    )}
                  </List>
                </VStack>
              </CardBody>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <Heading size="md">Payment Method</Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Your payment information is secure and encrypted
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={8} align="stretch">
                  
                  {isProcessingPayment && (
                    <Alert status="info" borderRadius="xl">
                      <AlertIcon />
                      <Spinner size="sm" mr={2} />
                      Processing your payment securely...
                    </Alert>
                  )}

                  {/* Debug info for PayPal initialization */}
                  {process.env.NODE_ENV === 'development' && (
                    <Alert status="info" size="sm">
                      <AlertIcon />
                      <VStack spacing={1} align="start" fontSize="xs">
                        <Text>PayPal SDK Loaded: {paypalLoaded ? '✅' : '❌'}</Text>
                        <Text>Window PayPal Available: {typeof window !== 'undefined' && window.paypal ? '✅' : '❌'}</Text>
                        <Text>Booking Data: {bookingData ? '✅' : '❌'}</Text>
                      </VStack>
                    </Alert>
                  )}
                  
                  {/* PayPal Advanced Credit Card Processing */}
                  <Box id="card-section">
                    <PayPalAdvancedCreditCard
                      amount={bookingData.pricing.total}
                      bookingData={{
                        serviceId: bookingData.serviceId,
                        bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
                        duration: bookingData.bookingDetails.duration || 4,
                        address: `${bookingData.bookingDetails.address}, ${bookingData.bookingDetails.city} ${bookingData.bookingDetails.zipCode}`,
                        comments: bookingData.bookingDetails.specialRequests || '',
                        contactPhone: bookingData.bookingDetails.contactPhone,
                        guestCount: bookingData.bookingDetails.guestCount
                      }}
                      onSuccess={(data) => {
                        console.log('Payment successful:', data);
                        // Clear booking data from sessionStorage
                        sessionStorage.removeItem('pendingBooking');
                        
                        // Show success message
                        toast({
                          title: 'Payment Successful! 🎉',
                          description: 'Your booking has been submitted to the provider for confirmation.',
                          status: 'success',
                          duration: 5000,
                          isClosable: true,
                        });

                        // Redirect to confirmation page
                        router.push(`/book/${serviceId}/confirmed?orderId=${data.orderId || data.orderID}&transactionId=${data.transactionId}`);
                      }}
                      onError={(error) => {
                        console.error('Payment error:', error);
                        toast({
                          title: 'Payment Failed',
                          description: error || 'Please try again or contact support.',
                          status: 'error',
                          duration: 5000,
                          isClosable: true,
                        });
                      }}
                      onCancel={() => {
                        console.log('Payment cancelled');
                        toast({
                          title: 'Payment Cancelled',
                          description: 'You can try again when ready.',
                          status: 'warning',
                          duration: 3000,
                          isClosable: true,
                        });
                      }}
                      disabled={isProcessingPayment}
                    />
                  </Box>

                  {/* Divider */}
                  <Box position="relative" py={4}>
                    <Divider />
                    <Box
                      position="absolute"
                      left="50%"
                      top="50%"
                      transform="translate(-50%, -50%)"
                      bg="white"
                      px={4}
                      color="gray.500"
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      OR
                    </Box>
                  </Box>

                  {/* PayPal Payment - Alternative Method */}
                  <Box id="paypal-section">
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={4}>
                        <Box>
                          <Heading size="sm" mb={1}>Pay with PayPal</Heading>
                          <Text fontSize="sm" color="gray.600">
                            Quick and secure payment with your PayPal account
                          </Text>
                        </Box>
                        <Box ml="auto">
                          <Box 
                            bg="blue.50" 
                            px={3} 
                            py={2} 
                            borderRadius="lg"
                            border="1px"
                            borderColor="blue.200"
                          >
                            <Text fontSize="lg" fontWeight="bold" color="blue.600">
                              PayPal
                            </Text>
                          </Box>
                        </Box>
                      </HStack>
                      
                      {/* PayPal Buttons Container */}
                      <Box 
                        id="paypal-buttons" 
                        p={4}
                        bg="gray.50"
                        borderRadius="xl"
                        border="1px"
                        borderColor="gray.200"
                      />
                      
                      {!paypalLoaded && (
                        <Flex justify="center" py={6}>
                          <VStack spacing={2}>
                            <Spinner size="lg" color="blue.500" />
                            <Text color="gray.600">Loading PayPal...</Text>
                          </VStack>
                        </Flex>
                      )}
                    </VStack>
                  </Box>
                  

                  
                </VStack>
              </CardBody>
            </Card>

          </VStack>
        </GridItem>

        {/* Sidebar - Price summary */}
        <GridItem>
          <Box position="sticky" top="20px">
            <Card>
              <CardHeader>
                <Heading size="md">Payment Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text>Service fee</Text>
                    <Text>${bookingData.pricing.basePrice.toFixed(2)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Platform fee</Text>
                    <Text>${bookingData.pricing.serviceFee.toFixed(2)}</Text>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between" fontWeight="bold" fontSize="lg">
                    <Text>Total</Text>
                    <Text>${bookingData.pricing.total.toFixed(2)}</Text>
                  </HStack>
                  
                  <Alert status="info" size="sm">
                    <AlertIcon />
                    <Text fontSize="xs">
                      You'll be charged immediately. The provider will then confirm your booking.
                    </Text>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
} 