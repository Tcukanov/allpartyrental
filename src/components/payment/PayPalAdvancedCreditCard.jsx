'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  Icon,
  Divider,
  Badge,
  Flex,
  Input,
  Grid
} from '@chakra-ui/react';
import { FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';

const PayPalAdvancedCreditCard = ({ 
  amount, 
  onSuccess, 
  onError, 
  onCancel,
  bookingData,
  disabled = false
}) => {
  const buttonRef = useRef();
  const paypalInstanceRef = useRef(null);
  const isInitializedRef = useRef(false);
  const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Loading PayPal SDK...');
  const [orderID, setOrderID] = useState(null);
  const [fieldsReady, setFieldsReady] = useState(false);
  const toast = useToast();

  // Cleanup function
  const cleanup = () => {
    console.log(`[${instanceIdRef.current}] Cleaning up PayPal Hosted Fields component...`);
    try {
      if (paypalInstanceRef.current) {
        // PayPal hosted fields don't have a direct cleanup method
        paypalInstanceRef.current = null;
      }
      
      isInitializedRef.current = false;
      setFieldsReady(false);
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Cleanup error:`, error);
    }
  };

  // Load PayPal script if not already loaded
  const loadPayPalScript = () => {
    return new Promise((resolve, reject) => {
      console.log(`[${instanceIdRef.current}] Checking PayPal availability...`);
      
      if (window.paypal) {
        console.log(`[${instanceIdRef.current}] PayPal already loaded and ready`);
        setDebugInfo('PayPal SDK ready');
        resolve();
        return;
      }

      // Check if PayPal script is already in the DOM (loaded by parent page)
      const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
      if (existingScript) {
        console.log(`[${instanceIdRef.current}] PayPal script already in DOM, waiting...`);
        setDebugInfo('Waiting for PayPal SDK...');
        
        let attempts = 0;
        const checkLoaded = () => {
          attempts++;
          if (window.paypal) {
            console.log(`[${instanceIdRef.current}] PayPal became available after ${attempts} attempts`);
            setDebugInfo('PayPal SDK ready');
            resolve();
          } else if (attempts > 50) {
            console.error(`[${instanceIdRef.current}] PayPal never became available`);
            setDebugInfo('PayPal SDK failed to load');
            reject(new Error('PayPal SDK failed to load'));
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      console.log(`[${instanceIdRef.current}] Loading PayPal script...`);
      setDebugInfo('Loading PayPal SDK...');
      
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=buttons,hosted-fields,messages&intent=capture&enable-funding=card&disable-funding=paylater`;
      script.setAttribute('data-partner-attribution-id', 'NYCKIDSPARTYENT_SP_PPCP');
      script.async = true;
      
      script.onload = () => {
        console.log(`[${instanceIdRef.current}] PayPal script loaded successfully`);
        setDebugInfo('PayPal SDK ready');
        resolve();
      };
      
      script.onerror = () => {
        console.error(`[${instanceIdRef.current}] Failed to load PayPal script`);
        setDebugInfo('PayPal SDK failed to load');
        reject(new Error('Failed to load PayPal SDK'));
      };
      
      document.head.appendChild(script);
    });
  };

  // Initialize PayPal Buttons with Card styling for direct card input
  const initializeCardPayment = async () => {
    try {
      console.log(`[${instanceIdRef.current}] Initializing PayPal Card Payment...`);
      
      if (!window.paypal) {
        throw new Error('PayPal SDK not loaded');
      }

      if (isInitializedRef.current) {
        console.log(`[${instanceIdRef.current}] Already initialized, skipping...`);
        return;
      }

      setDebugInfo('Setting up card payment...');

      // Verify payment button container is available
      const buttonContainer = document.getElementById(`card-button-${instanceIdRef.current}`);
      if (!buttonContainer) {
        throw new Error('Payment button container not found');
      }
      
      console.log(`[${instanceIdRef.current}] Container verified, creating payment button...`);

      // Create PayPal Buttons configured for credit cards
      const buttonInstance = window.paypal.Buttons({
        // Force credit card funding source
        fundingSource: window.paypal.FUNDING.CARD,
        
        style: {
          layout: 'vertical',
          color: 'black',
          shape: 'rect',
          label: 'pay',
          height: 55,
          tagline: false
        },

        createOrder: async () => {
          console.log(`[${instanceIdRef.current}] Creating payment order for card payment...`);
          setDebugInfo('Creating payment order...');
          setIsProcessing(true);
          
          try {
            // Add timestamp to make each request unique
            const response = await fetch('/api/payments/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                serviceId: bookingData.serviceId,
                bookingDate: bookingData.bookingDate,
                hours: bookingData.duration,
                paymentMethod: 'advanced_card_processing',
                address: bookingData.address,
                comments: bookingData.comments,
                contactPhone: bookingData.contactPhone,
                guestCount: bookingData.guestCount,
                timestamp: Date.now() // Add unique timestamp
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText };
              }
              
              console.error(`[${instanceIdRef.current}] Create order failed:`, response.status, errorData);
              
              // Handle specific error cases
              if (response.status === 409 && errorData.code === 'DUPLICATE_TRANSACTION') {
                throw new Error('A payment for this booking is already in progress. Please wait or refresh the page.');
              }
              
              throw new Error(errorData.error || `Payment order creation failed: ${response.status}`);
            }

            const data = await response.json();
            console.log(`[${instanceIdRef.current}] Order created:`, data);
            
            if (!data.success || !data.orderId) {
              throw new Error(data.error || 'Failed to create payment order');
            }

            setDebugInfo('Payment order created successfully');
            setOrderID(data.orderId);
            return data.orderId;
            
          } catch (error) {
            console.error(`[${instanceIdRef.current}] Create order error:`, error);
            setError(`Failed to create payment order: ${error.message}`);
            setIsProcessing(false);
            throw error;
          }
        },

        onApprove: async (data) => {
          try {
            console.log(`[${instanceIdRef.current}] Payment approved:`, data.orderID);
            setDebugInfo('Processing payment...');
            setIsProcessing(true);
            
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
              console.error(`[${instanceIdRef.current}] Capture failed:`, response.status, errorText);
              throw new Error(`Payment capture failed: ${response.status}`);
            }

            const result = await response.json();
            console.log(`[${instanceIdRef.current}] Payment captured:`, result);
            
            if (!result.success) {
              throw new Error(result.error || 'Payment capture failed');
            }

            setDebugInfo('Payment completed successfully!');
            // Pass the result object with orderId and transactionId for confirmation page
            onSuccess({
              orderId: data.orderID, // PayPal order ID from the approval
              orderID: data.orderID, // Also include orderID variant for compatibility
              transactionId: result.transactionId,
              captureId: result.captureId,
              status: result.status
            });
            
          } catch (error) {
            console.error(`[${instanceIdRef.current}] Capture error:`, error);
            setIsProcessing(false);
            setError(`Payment processing failed: ${error.message}`);
            onError(error.message);
          }
        },

        onError: (err) => {
          console.error(`[${instanceIdRef.current}] PayPal card error:`, err);
          setIsProcessing(false);
          
          let errorMessage = 'Card payment failed. Please try again.';
          if (err.message) {
            errorMessage = err.message;
          }
          
          setError(errorMessage);
          onError(errorMessage);
        },

        onCancel: () => {
          console.log(`[${instanceIdRef.current}] Payment cancelled by user`);
          setIsProcessing(false);
          if (onCancel) onCancel();
        }
      });

      // Render to container
      await buttonInstance.render(`#card-button-${instanceIdRef.current}`);

      console.log(`[${instanceIdRef.current}] PayPal Card Payment rendered successfully`);
      paypalInstanceRef.current = buttonInstance;
      isInitializedRef.current = true;
      setIsLoading(false);
      setFieldsReady(true);
      setDebugInfo('Ready for payment');

    } catch (error) {
      console.error(`[${instanceIdRef.current}] Card Payment initialization failed:`, error);
      setError(error.message);
      setIsLoading(false);
    }
  };



  useEffect(() => {
    const init = async () => {
      try {
        await loadPayPalScript();
        
        // Wait for DOM refs to be ready and retry if needed
        let retryCount = 0;
        const maxRetries = 10;
        
        const checkContainerAndInitialize = () => {
          console.log(`[${instanceIdRef.current}] Checking button container availability (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Check for button container by ID
          const buttonEl = document.getElementById(`card-button-${instanceIdRef.current}`);
          
          console.log(`[${instanceIdRef.current}] Button container found:`, !!buttonEl);
          
          if (buttonEl) {
            console.log(`[${instanceIdRef.current}] Button container found, initializing card payment...`);
            setDebugInfo('Initializing payment button...');
            initializeCardPayment();
          } else {
            retryCount++;
            console.log(`[${instanceIdRef.current}] Button container not ready (attempt ${retryCount}/${maxRetries})`);
            setDebugInfo(`Waiting for payment button... (${retryCount}/${maxRetries})`);
            
            if (retryCount < maxRetries) {
              setTimeout(checkContainerAndInitialize, 300);
            } else {
              console.error(`[${instanceIdRef.current}] Button container not found after all retries`);
              setError('Payment form failed to load. Please refresh the page.');
              setDebugInfo('Failed to load payment form');
              setIsLoading(false);
            }
          }
        };
        
        // Start checking after a small delay
        setTimeout(checkContainerAndInitialize, 300);
        
      } catch (error) {
        console.error(`[${instanceIdRef.current}] Initialization failed:`, error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    init();

    // Cleanup on unmount
    return cleanup;
  }, []);

  // Error display with retry functionality
  if (error) {
    return (
      <Box 
        bg="white" 
        borderRadius="xl" 
        boxShadow="lg" 
        p={6}
        border="1px solid"
        borderColor="red.200"
      >
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Payment Error</Text>
            <Text>{error}</Text>
            {debugInfo && (
              <Text fontSize="sm" color="gray.600" mt={2}>
                Debug: {debugInfo}
              </Text>
            )}
          </Box>
        </Alert>
        <Button
          mt={4}
          onClick={() => {
            setError(null);
            setDebugInfo('Retrying...');
            cleanup();
            setTimeout(() => {
              setIsLoading(true);
              initializeHostedFields();
            }, 1000);
          }}
          colorScheme="red"
          variant="outline"
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      bg="white" 
      borderRadius="xl" 
      boxShadow="xl" 
      overflow="hidden"
      border="1px solid"
      borderColor="gray.200"
      maxW="500px"
      mx="auto"
    >
      {/* Header */}
      <Box 
        bgGradient="linear(to-r, blue.600, purple.600)" 
        p={6} 
        color="white"
      >
        <HStack spacing={3} mb={2}>
          <Icon as={FaCreditCard} boxSize={6} />
          <Text fontSize="xl" fontWeight="bold">Secure Payment</Text>
          <Icon as={FaLock} boxSize={4} />
        </HStack>
        <Text fontSize="2xl" fontWeight="bold">${amount?.toFixed(2)}</Text>
        <Text fontSize="sm" opacity={0.9}>
          PayPal Hosted Fields • SSL Encrypted
        </Text>
      </Box>

      {/* Payment Form */}
      <Box p={6}>
        {/* Test Card Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert status="info" borderRadius="lg" mb={6}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" fontSize="sm">Test Card Numbers (Sandbox)</Text>
              <VStack align="start" spacing={1} fontSize="xs" mt={2}>
                <Text><strong>Visa:</strong> 4111 1111 1111 1111</Text>
                <Text><strong>Mastercard:</strong> 5555 5555 5555 4444</Text>
                <Text><strong>Expiry:</strong> Any future date (e.g., 12/2030)</Text>
                <Text><strong>CVV:</strong> Any 3 digits (e.g., 123)</Text>
              </VStack>
            </Box>
          </Alert>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Alert status="info" borderRadius="lg" mb={6}>
            <AlertIcon />
            <HStack>
              <Spinner size="sm" />
              <Text fontWeight="medium">Processing your payment...</Text>
            </HStack>
          </Alert>
        )}
        
        {/* Card Input Fields */}
        <VStack spacing={6} align="stretch">
                    <Box>
            <Text fontSize="md" fontWeight="semibold" mb={4} color="gray.700">
              Pay with Credit or Debit Card
            </Text>
            
            {/* Card Input Container with Loading Overlay */}
            <Box position="relative" minH="300px">
              {/* Loading State Overlay */}
              {isLoading && (
                <Box 
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center" 
                  bg="white"
                  borderRadius="lg"
                  zIndex="10"
                >
                  <VStack spacing={3}>
                    <Spinner size="lg" color="blue.500" thickness="3px" />
                    <Text color="gray.600" fontWeight="medium" fontSize="sm">Loading payment form...</Text>
                    {debugInfo && (
                      <Text fontSize="xs" color="gray.500" textAlign="center">
                        {debugInfo}
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}
              
                            {/* PayPal Card Payment Button - Always rendered */}
              <VStack spacing={4} align="stretch" opacity={isLoading ? 0.3 : 1}>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Click below to pay with your credit or debit card
                </Text>
                
                {/* PayPal Card Button Container */}
                <Box 
                  id={`card-button-${instanceIdRef.current}`}
                  minH="55px"
                  borderRadius="12px"
                  overflow="hidden"
                  sx={{
                    '& > div': {
                      borderRadius: '12px !important'
                    },
                    '& iframe': {
                      borderRadius: '12px !important'
                    }
                  }}
                />
                
                {!fieldsReady && !isLoading && (
                  <Box 
                    minH="55px"
                    bg="gray.100"
                    borderRadius="12px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.500" fontSize="sm">Setting up payment button...</Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </Box>

          {/* Security Features */}
          {!isLoading && (
            <>
              <Divider />
              
              <HStack justify="center" spacing={6} color="gray.600" fontSize="sm">
                <HStack spacing={2}>
                  <Icon as={FaShieldAlt} />
                  <Text>SSL Protected</Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FaLock} />
                  <Text>PCI Compliant</Text>
                </HStack>
              </HStack>
              
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Your payment information is secure and encrypted. 
                We never store your card details on our servers.
              </Text>
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default PayPalAdvancedCreditCard; 