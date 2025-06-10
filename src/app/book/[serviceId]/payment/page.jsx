'use client';

import React, {useState, useEffect, use, useRef} from 'react'
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
  FormControl,
  FormLabel,
  Input
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, CalendarIcon, PhoneIcon } from '@chakra-ui/icons';
import { FiMapPin } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function PaymentPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();

  const [bookingData, setBookingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [cardFieldsReady, setCardFieldsReady] = useState(false);
  const [billing, setBilling] = useState({
    line1: '',
    city: '',
    state: '',
    zip: ''
  });
  const [errors, setErrors] = useState({
    line1: false,
    city: false,
    state: false,
    zip: false
  });
  const cardFieldRef = useRef(null);

  // Unwrap params using use() as required by Next.js 15
  const { serviceId } = use(params);

  const validateBilling = () => {

    console.log({billing});

    const newErrors = {
      line1: billing.line1.trim() === '',
      city:   billing.city.trim()   === '',
      state:  billing.state.trim()  === '',
      zip:    billing.zip.trim()    === ''
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(v => v);
  };

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
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&components=buttons,card-fields&disable-funding=venmo,paylater&enable-funding=card&commit=true`;
    script.setAttribute('data-partner-attribution-id', 'NYCKIDSPARTYENT_SP_PPCP');
    script.async = true;

    script.onload = () => {
      console.log('PayPal SDK loaded successfully');
      setPaypalLoaded(true);
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

  // Initialize PayPal buttons for both card and PayPal payments
  useEffect(() => {
    if (!paypalLoaded || !bookingData || !window.paypal) return;

    // Initialize credit card buttons (primary method)
    const cardButtonsContainer = document.getElementById('card-buttons');
    if (cardButtonsContainer) {
      cardButtonsContainer.innerHTML = '';
      initializeCreditCardButtons();
    }

    // Initialize PayPal buttons (secondary method)
    const paypalButtonsContainer = document.getElementById('paypal-buttons');
    if (paypalButtonsContainer) {
      paypalButtonsContainer.innerHTML = '';
      initializePayPalButtons();
    }

    initializeCardFields();
  }, [paypalLoaded, bookingData]);

  const initializePayPalButtons = () => {
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
      const paypalSection = document.getElementById('paypal-section');
      if (paypalSection) {
        paypalSection.innerHTML = '<Text color="red.500">PayPal option currently unavailable.</Text>';
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

  /**
   * Extracts a user-friendly error message from PayPal error responses
   *
   * PayPal errors often contain JSON data embedded within the error message string.
   * This function attempts to parse that JSON and extract the most relevant error description.
   *
   * @param {Error|string} error - The error object or message string from PayPal
   * @param {string} defaultMessage - Default message to show if parsing fails
   * @returns {string} A user-friendly error message
   */
  function extractPayPalErrorMessage(error, defaultMessage = 'Payment failed') {
    try {
      // Get the raw error message
      const raw = typeof error === 'string' ? error : error.message || JSON.stringify(error);

      // Try to find JSON content within the error message
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');

      if (start !== -1 && end !== -1 && end > start) {
        // Extract and parse the JSON part
        const jsonPart = raw.slice(start, end + 1);
        try {
          const parsed = JSON.parse(jsonPart);

          // Extract the most descriptive error message available
          return parsed.details?.[0]?.description ||
              parsed.message ||
              parsed.error_description ||
              parsed.error ||
              defaultMessage;
        } catch (parseErr) {
          // If JSON parsing fails, return the raw message
          return raw;
        }
      } else {
        // If no JSON content found, return the raw message
        return raw;
      }
    } catch (err) {
      // Fallback to default message if anything goes wrong
      console.error('Error parsing PayPal error:', err);
      return defaultMessage;
    }
  }

  const initializeCardFields = () => {

    const chakraStyle = {
      base: {
        "font-size": "16px",
        "font-family": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "font-weight": "400",
        color: "#1A202C", // chakra gray.800
        "::placeholder": {
          color: "#A0AEC0" // chakra gray.400
        },
      },
      input: {
        "background-color": "white",
        "border-radius": "0.75rem", // xl border radius
        "border": "1px solid #E2E8F0", // chakra gray.200
        "padding": "16px",
        "height": "60px",
        "box-shadow": "none",
        "transition": "all 0.2s",
      },
      ".valid": {
        color: "#38A169" // chakra green.500
      },
      ".invalid": {
        color: "#E53E3E" // chakra red.500
      },
      ":hover": {
        "border-color": "#63B3ED" // chakra blue.300
      },
      ":focus": {
        "border-color": "#3182CE", // chakra blue.500
        "box-shadow": "0 0 0 3px rgba(66, 153, 225, 0.1)" // chakra blue focus shadow
      }
    };

    const cardField = window.paypal.CardFields({
      createOrder: () => {
        setIsProcessingPayment(true);
        console.log('Creating real booking...')
        try {
          return fetch('/api/payments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceId: bookingData.serviceId,
              bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
              hours: bookingData.bookingDetails.duration || 4,
              address: `${bookingData.bookingDetails.address}, ${bookingData.bookingDetails.city} ${bookingData.bookingDetails.zipCode}`,
              comments: bookingData.bookingDetails.specialRequests || '',
              contactPhone: bookingData.bookingDetails.contactPhone,
              guestCount: bookingData.bookingDetails.guestCount,
              paymentMethod: 'direct_booking',
            }),
          })
              .then((res) => res.json())
              .then((data) => data.orderId);
        } catch (error) {
          console.error('Create order error:', error);
          const userMsg = extractPayPalErrorMessage(error, 'Payment failed');
          setIsProcessingPayment(false);
          toast({
            title: 'Booking Error',
            description: `Failed to create booking: ${userMsg}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      },

      onApprove: async (data) => {
        try {
          const { orderID } = data;

          const authRes = await fetch('/api/payments/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderID,
              serviceId: bookingData.serviceId,
              bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
              hours: bookingData.bookingDetails.duration || 4,
              address: `${bookingData.bookingDetails.address}, ${bookingData.bookingDetails.city} ${bookingData.bookingDetails.zipCode}`,
              comments: bookingData.bookingDetails.specialRequests || '',
              contactPhone: bookingData.bookingDetails.contactPhone,
              guestCount: bookingData.bookingDetails.guestCount,
              paymentMethod: 'direct_booking'
            }),
          });

          const result = await authRes.json();

          console.log('Payment order created:', result);

          if (!result.success) {
            throw new Error(result.error || 'Failed to create booking');
          }

          sessionStorage.removeItem('pendingBooking');

          // Show success message
          toast({
            title: 'Booking Created Successfully! 🎉',
            description: 'Your booking has been submitted to the provider for confirmation.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Redirect to confirmation page with the real transaction ID
          router.push(`/book/${serviceId}/confirmed?orderId=${result.orderId}&transactionId=${result.transactionId}`);
        } catch (err) {
          console.error('Payment failed', err);
          const userMsg = extractPayPalErrorMessage(err, 'Payment failed');
          toast({ title: 'Payment failed', description: userMsg, status: 'error' });
        } finally {
          setIsProcessingPayment(false);
        }
      },
      onError: (err) => {
        console.error('CardFields Error:', err);
        const userMsg = extractPayPalErrorMessage(err, 'CardFields Error');
        toast({ title: 'CardFields Error', description: userMsg, status: 'error' });
        setIsProcessingPayment(false);
      },
      style: chakraStyle,
    });

    if (cardField.isEligible()) {
      const nameField = cardField.NameField({
        style: chakraStyle,
        placeholder: "John Doe"
      });
      nameField.render("#card-name-field-container");

      const numberField = cardField.NumberField({
        style: chakraStyle,
        placeholder: "1234 5678 9012 3456",
      });
      numberField.render("#card-number-field-container");

      const cvvField = cardField.CVVField({
        style: chakraStyle,
        placeholder: "123"
      });
      cvvField.render("#card-cvv-field-container");

      const expiryField = cardField.ExpiryField({
        style: chakraStyle,
        placeholder: "MM/YY"
      });
      expiryField.render("#card-expiry-field-container");

      cardFieldRef.current = cardField;

      // Add click listener to submit button and call the submit function on the CardField component
      // document
      //     .getElementById("card-field-submit-button")
      //     .addEventListener("click", () => {
      //
      //       if (!validateBilling()) {
      //         toast({
      //           title: 'Please fill in all required fields',
      //           status: 'error',
      //           duration: 3000,
      //           isClosable: true,
      //         });
      //         return;
      //       }
      //
      //       cardField
      //           .submit({
      //             // From your billing address fields
      //             billingAddress: {
      //               addressLine1: document.getElementById(
      //                   "card-billing-address-line-1"
      //               ).value,
      //               adminArea1: document.getElementById(
      //                   "card-billing-address-admin-area-line-1"
      //               ).value,
      //               adminArea2: document.getElementById(
      //                   "card-billing-address-admin-area-line-2"
      //               ).value,
      //               postalCode: document.getElementById(
      //                   "card-billing-address-postal-code"
      //               ).value,
      //               countryCode: "US",
      //             },
      //
      //           })
      //           .then(() => {
      //             // submit successful
      //           }).catch(err => {
      //
      //               const userMsg = extractPayPalErrorMessage(err, 'Payment failed');
      //               toast({ title: 'CardFields error', description: userMsg, status: 'error' });
      //               setIsProcessingPayment(false);
      //           });
      //     });
    }
  };

  const submitPayment = async () => {
    if (!validateBilling()) {
      toast({
        title: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsProcessingPayment(true);
    try {
      await cardFieldRef.current.submit({
        billingAddress: {
          addressLine1: billing.line1,
          adminArea1: billing.city,
          adminArea2: billing.state,
          postalCode: billing.zip,
          countryCode: 'US',
        }
      });
    } catch (err) {
      const msg = extractPayPalErrorMessage(err, 'Payment failed');
      toast({ title: 'Payment Error', description: msg, status: 'error' });
    } finally {
      setIsProcessingPayment(false);
    }
  }

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

                  {/* Credit Card Form - Modern Design */}
                  <Box id="card-section">
                    {/* Payment Method Header */}
                    <VStack spacing={6} align="stretch">
                      {/* Card Fields */}
                      <Box>
                        <div id="card-form" className="card_container">
                          <Box marginBottom="16px">

                            <HStack spacing={4} mb={6}>
                              <Box>
                                <Heading size="sm" mb={1}>Pay with Card</Heading>
                                <Text fontSize="sm" color="gray.600">
                                  Safe and secure payment processing
                                </Text>
                              </Box>
                              <Box ml="auto">
                                <HStack spacing={2}>
                                  <Box
                                      bg="gray.100"
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                      fontSize="xs"
                                      fontWeight="bold"
                                      color="gray.700"
                                  >
                                    VISA
                                  </Box>
                                  <Box
                                      bg="gray.100"
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                      fontSize="xs"
                                      fontWeight="bold"
                                      color="gray.700"
                                  >
                                    MC
                                  </Box>
                                  <Box
                                      bg="gray.100"
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                      fontSize="xs"
                                      fontWeight="bold"
                                      color="gray.700"
                                  >
                                    AMEX
                                  </Box>
                                </HStack>
                              </Box>
                            </HStack>

                            <VStack spacing={4} align="stretch">
                              <FormControl isRequired>
                                <FormLabel fontWeight="600" color="gray.700" fontSize="sm">
                                  Card Number
                                </FormLabel>
                                <Box position="relative" marginLeft="-8px" marginRight="-8px">
                                  <div id="card-number-field-container"></div>
                                </Box>
                              </FormControl>
                              <Grid templateColumns="2fr 1fr" gap={4}>
                                <FormControl isRequired>
                                  <FormLabel fontWeight="600" color="gray.700" fontSize="sm">
                                    Expiry Date
                                  </FormLabel>
                                  <Box position="relative" marginLeft="-8px" marginRight="-8px">
                                    <div id="card-expiry-field-container"></div>
                                  </Box>
                                </FormControl>
                                <FormControl isRequired>

                                  <FormLabel fontWeight="600" color="gray.700" fontSize="sm">
                                    CVV
                                  </FormLabel>
                                  <Box position="relative" marginLeft="-8px" marginRight="-8px">
                                    <div id="card-cvv-field-container"></div>
                                  </Box>
                                </FormControl>
                              </Grid>
                              <FormControl>
                                <FormLabel fontWeight="600" color="gray.700" fontSize="sm">
                                  Cardholder Name
                                </FormLabel>
                                <Box position="relative" marginLeft="-8px" marginRight="-8px">
                                  <div id="card-name-field-container"></div>
                                </Box>
                              </FormControl>
                            </VStack>
                          </Box>

                          <Box
                              bg="gray.50"
                              p={6}
                              borderRadius="xl"
                              border="1px"
                              borderColor="gray.200"
                          >
                            <HStack justify="space-between" mb={4}>
                              <Text fontWeight="600" color="gray.700" fontSize="md">
                                Billing Address
                              </Text>
                              <Badge colorScheme="green" fontSize="xs">
                                SSL Secured
                              </Badge>
                            </HStack>

                            <VStack spacing={4} align="stretch">
                              <FormControl isRequired isInvalid={errors.line1}>
                                <FormLabel htmlFor="card-billing-address-line-1" fontWeight="500" color="gray.600" fontSize="sm">
                                  Street Address
                                </FormLabel>
                                <Input
                                    id="card-billing-address-line-1"
                                    name="card-billing-address-line-1"
                                    placeholder="123 Main Street"
                                    size="lg"
                                    bg="white"
                                    border="2px"
                                    borderColor="gray.200"
                                    borderRadius="lg"
                                    _hover={{ borderColor: 'blue.300' }}
                                    _focus={{
                                      borderColor: 'blue.500',
                                      bg: 'white',
                                      shadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
                                    }}
                                    value={billing.line1}
                                    onChange={e => {
                                      setBilling({...billing, line1: e.target.value});
                                      setErrors({...errors, line1: false});
                                    }}
                                    h="50px"
                                    transition="all 0.2s"
                                />
                              </FormControl>

                              <Grid templateColumns="2fr 1fr 1fr" gap={4}>
                                <FormControl isRequired isInvalid={errors.city}>
                                  <FormLabel htmlFor="card-billing-address-admin-area-line-1" fontWeight="500" color="gray.600" fontSize="sm">
                                    City
                                  </FormLabel>
                                  <Input
                                      id="card-billing-address-admin-area-line-1"
                                      name="card-billing-address-admin-area-line-1"
                                      value={billing.city}
                                      onChange={e => {
                                        setBilling({...billing, city: e.target.value});
                                        setErrors({...errors, city: false});
                                      }}
                                      placeholder="New York"
                                      size="lg"
                                      bg="white"
                                      border="2px"
                                      borderColor="gray.200"
                                      borderRadius="lg"
                                      _hover={{ borderColor: 'blue.300' }}
                                      _focus={{
                                        borderColor: 'blue.500',
                                        bg: 'white',
                                        shadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
                                      }}
                                      h="50px"
                                      transition="all 0.2s"
                                  />
                                </FormControl>

                                <FormControl isRequired isInvalid={errors.state}>
                                  <FormLabel htmlFor="card-billing-address-admin-area-line-2" fontWeight="500" color="gray.600" fontSize="sm">
                                    State
                                  </FormLabel>
                                  <Input
                                      id="card-billing-address-admin-area-line-2"
                                      name="card-billing-address-admin-area-line-2"
                                      value={billing.state}
                                      onChange={e => {
                                        setBilling({...billing, state: e.target.value});
                                        setErrors({...errors, state: false});
                                      }}
                                      placeholder="NY"
                                      size="lg"
                                      bg="white"
                                      border="2px"
                                      borderColor="gray.200"
                                      borderRadius="lg"
                                      _hover={{ borderColor: 'blue.300' }}
                                      _focus={{
                                        borderColor: 'blue.500',
                                        bg: 'white',
                                        shadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
                                      }}
                                      h="50px"
                                      transition="all 0.2s"
                                  />
                                </FormControl>

                                <FormControl isRequired isInvalid={errors.zip}>
                                  <FormLabel htmlFor="card-billing-address-postal-code" fontWeight="500" color="gray.600" fontSize="sm">
                                    ZIP Code
                                  </FormLabel>
                                  <Input
                                      id="card-billing-address-postal-code"
                                      name="card-billing-address-postal-code"
                                      value={billing.zip}
                                      onChange={e => {
                                        setBilling({...billing, zip: e.target.value});
                                        setErrors({...errors, zip: false});
                                      }}
                                      placeholder="10001"
                                      size="lg"
                                      bg="white"
                                      border="2px"
                                      borderColor="gray.200"
                                      borderRadius="lg"
                                      _hover={{ borderColor: 'blue.300' }}
                                      _focus={{
                                        borderColor: 'blue.500',
                                        bg: 'white',
                                        shadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
                                      }}
                                      h="50px"
                                      transition="all 0.2s"
                                  />
                                </FormControl>

                              </Grid>

                            </VStack>

                          </Box>

                          {/* Payment Button - Enhanced */}
                          <Box pt={4}>
                            <Button
                                id="card-field-submit-button"
                                colorScheme="blue"
                                size="lg"
                                borderRadius="xl"
                                isDisabled={isProcessingPayment}
                                isLoading={isProcessingPayment}
                                loadingText="Processing Payment..."
                                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                color="white"
                                _hover={{
                                  transform: 'translateY(-2px)',
                                  shadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                                  bg: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                                }}
                                _active={{
                                  transform: 'translateY(0px)',
                                  shadow: '0 5px 15px rgba(102, 126, 234, 0.3)'
                                }}
                                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                h="70px"
                                fontWeight="bold"
                                fontSize="lg"
                                w="full"
                                position="relative"
                                overflow="hidden"
                                _before={{
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: '-100%',
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                  transition: 'left 0.5s'
                                }}
                                _hover_before={{
                                  left: '100%'
                                }}
                                onClick={submitPayment}
                            >
                              <HStack spacing={3}>
                                <Text>🔒</Text>
                                <Text>Complete Secure Payment</Text>
                                <Text fontWeight="bold">${bookingData.pricing.total.toFixed(2)}</Text>
                              </HStack>
                            </Button>

                            {/* Trust Indicators */}
                            <HStack justify="center" mt={4} spacing={6}>
                              <HStack spacing={1}>
                                <Text fontSize="xs" color="gray.500">🔐</Text>
                                <Text fontSize="xs" color="gray.500">256-bit SSL</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Text fontSize="xs" color="gray.500">🛡️</Text>
                                <Text fontSize="xs" color="gray.500">PCI Compliant</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Text fontSize="xs" color="gray.500">💳</Text>
                                <Text fontSize="xs" color="gray.500">Bank-level Security</Text>
                              </HStack>
                            </HStack>
                          </Box>

                        </div>
                      </Box>
                    </VStack>
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
