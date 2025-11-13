'use client';
// Version: 2024-11-09 - Authorization-first payment flow

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

  // Debug component mount
  useEffect(() => {
    console.log('💳 Payment Page Component Mounted');
    console.log('- Service ID:', serviceId);
    console.log('- Environment:', process.env.NODE_ENV);
    console.log('- PayPal Client ID available:', !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
  }, [serviceId]);

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
          // Ensure pricing values are numbers
          if (parsed.pricing) {
            parsed.pricing.basePrice = parseFloat(parsed.pricing.basePrice) || 0;
            parsed.pricing.serviceFee = parseFloat(parsed.pricing.serviceFee) || 0;
            parsed.pricing.total = parseFloat(parsed.pricing.total) || 0;
          }
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
    console.log('🔍 PayPal SDK Loading Debug:');
    console.log('- NEXT_PUBLIC_PAYPAL_CLIENT_ID:', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
    console.log('- window.paypal exists:', !!window.paypal);
    console.log('- paypalLoaded state:', paypalLoaded);

    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
      console.error('❌ PayPal Client ID not found in environment variables');
      toast({
        title: 'Configuration Error',
        description: 'PayPal Client ID not configured. Please contact support.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Check if PayPal is already loaded with all components as functions
    if (window.paypal && 
        typeof window.paypal.Buttons === 'function' && 
        typeof window.paypal.CardFields === 'function') {
      console.log('✅ PayPal SDK already loaded with all components, setting state');
      setPaypalLoaded(true);
      return;
    } else if (window.paypal) {
      console.log('⚠️ PayPal SDK exists but components not ready yet, will wait...');
      console.log('- Buttons type:', typeof window.paypal.Buttons);
      console.log('- CardFields type:', typeof window.paypal.CardFields);
      // Don't return - continue to load the script properly
    }

    console.log('📦 Creating PayPal SDK script...');
    const script = document.createElement('script');
    
    // Conditionally disable Pay Later based on provider setting
    const disableFunding = bookingData?.provider?.enablePayLater === false 
      ? 'paylater' 
      : '';  // Empty string means Pay Later is enabled
    
    const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&components=buttons,card-fields,messages${disableFunding ? `&disable-funding=${disableFunding}` : ''}&enable-funding=venmo,card&commit=true`;
    console.log('- SDK URL:', sdkUrl);
    console.log('- Pay Later enabled:', bookingData?.provider?.enablePayLater !== false);
    
    script.src = sdkUrl;
    script.setAttribute('data-partner-attribution-id', 'NYCKIDSPARTYENT_SP_PPCP');
    script.async = true;

    script.onload = () => {
      console.log('✅ PayPal SDK script loaded successfully');
      console.log('- window.paypal available:', !!window.paypal);
      console.log('- PayPal version:', window.paypal?.version);
      
      // Wait for CardFields to be available with retry logic
      let retryCount = 0;
      const maxRetries = 20; // 20 attempts over 10 seconds
      
      const checkPayPalReady = () => {
        console.log(`🔍 Checking PayPal readiness (attempt ${retryCount + 1}/${maxRetries})...`);
        console.log('- window.paypal:', !!window.paypal);
        console.log('- window.paypal.Buttons type:', typeof window.paypal?.Buttons);
        console.log('- window.paypal.CardFields type:', typeof window.paypal?.CardFields);
        console.log('- window.paypal.Messages type:', typeof window.paypal?.Messages);
        
        // Check if Buttons and CardFields are actually functions
        if (window.paypal && 
            typeof window.paypal.Buttons === 'function' && 
            typeof window.paypal.CardFields === 'function') {
          console.log('✅ PayPal fully ready with all components!');
          setPaypalLoaded(true);
          return;
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(checkPayPalReady, 500);
        } else {
          console.error('❌ PayPal components not available after maximum retries');
          console.error('❌ Final state:', {
            hasPaypal: !!window.paypal,
            ButtonsType: typeof window.paypal?.Buttons,
            CardFieldsType: typeof window.paypal?.CardFields,
            paypalKeys: window.paypal ? Object.keys(window.paypal) : []
          });
          toast({
            title: 'Payment System Error',
            description: 'PayPal components failed to load. Please refresh the page.',
            status: 'error',
            duration: 10000,
            isClosable: true,
          });
          // DO NOT set paypalLoaded to true if components aren't functions
          // setPaypalLoaded(true); // REMOVED - this was causing the error
        }
      };
      
      // Start checking after initial delay
      setTimeout(checkPayPalReady, 500);
    };

    script.onerror = (error) => {
      console.error('❌ Failed to load PayPal SDK:', error);
      console.error('- Script src:', script.src);
      console.error('- Error event:', error);
      
      toast({
        title: 'Payment Error',
        description: 'Failed to load payment system. Please refresh the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    };

    console.log('📝 Appending PayPal script to document head');
    document.head.appendChild(script);

    return () => {
      console.log('🧹 Cleaning up PayPal script');
      // Cleanup script if component unmounts
      const existingScript = document.querySelector(`script[src*="paypal"]`);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [toast, bookingData]);

  // Render PayPal Messages for financing options
  useEffect(() => {
    if (!paypalLoaded || !window.paypal || !window.paypal.Messages) return;
    
    console.log('🎨 Rendering PayPal Messages component');
    try {
      window.paypal.Messages().render();
    } catch (error) {
      console.error('Error rendering PayPal Messages:', error);
    }
  }, [paypalLoaded]);

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
        
        // Initialize CardFields AFTER PayPal buttons, with a delay
        setTimeout(() => {
          console.log('Now initializing CardFields after PayPal buttons...');
          initializeCardFields();
        }, 1000); // 1 second delay to ensure everything is ready
        
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

    // Check if PayPal Buttons component is available
    if (!window.paypal || typeof window.paypal.Buttons !== 'function') {
      console.error('❌ window.paypal.Buttons is not available:', {
        hasPaypal: !!window.paypal,
        paypalKeys: window.paypal ? Object.keys(window.paypal) : [],
        ButtonsType: window.paypal ? typeof window.paypal.Buttons : 'undefined'
      });
      
      toast({
        title: 'Payment System Error',
        description: 'PayPal buttons component not loaded. Please refresh the page.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
      return;
    }

    console.log('Initializing PayPal buttons for wallet payments (PayPal + Venmo)...');

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        shape: 'rect',
        height: 50,
        tagline: false
      },
      // NO fundingSource restriction - allows PayPal AND Venmo buttons to render
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
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Create order failed:', response.status, errorData);
            throw new Error(errorData.error || `Payment order creation failed: ${response.status}`);
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
          console.log('Payment approved (authorization):', data.orderID);

          // IMPORTANT: We only AUTHORIZE here, not capture
          // Payment will be captured when provider approves the booking
          const response = await fetch('/api/payments/authorize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderID: data.orderID,
              serviceId: bookingData.serviceId,
              bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
              hours: bookingData.bookingDetails.duration || 4,
              addons: [],
              address: bookingData.bookingDetails.address,
              city: bookingData.bookingDetails.city,
              zipCode: bookingData.bookingDetails.zipCode,
              guestCount: bookingData.bookingDetails.guestCount,
              contactPhone: bookingData.bookingDetails.contactPhone,
              contactEmail: bookingData.bookingDetails.contactEmail,
              comments: bookingData.bookingDetails.specialRequests
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Authorization failed:', response.status, errorData);
            throw new Error(errorData.error || `Payment authorization failed: ${response.status}`);
          }

          const result = await response.json();
          console.log('Payment authorized:', result);

          if (!result.success) {
            throw new Error(result.error || 'Payment authorization failed');
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
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Create order failed:', response.status, errorData);
            throw new Error(errorData.error || `Payment order creation failed: ${response.status}`);
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
          console.log('Card payment approved (authorization):', data.orderID);

          // IMPORTANT: We only AUTHORIZE here, not capture
          // Payment will be captured when provider approves the booking
          const response = await fetch('/api/payments/authorize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderID: data.orderID,
              serviceId: bookingData.serviceId,
              bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
              hours: bookingData.bookingDetails.duration || 4,
              addons: [],
              address: bookingData.bookingDetails.address,
              city: bookingData.bookingDetails.city,
              zipCode: bookingData.bookingDetails.zipCode,
              guestCount: bookingData.bookingDetails.guestCount,
              contactPhone: bookingData.bookingDetails.contactPhone,
              contactEmail: bookingData.bookingDetails.contactEmail,
              comments: bookingData.bookingDetails.specialRequests
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Authorization failed:', response.status, errorData);
            throw new Error(errorData.error || `Payment authorization failed: ${response.status}`);
          }

          const result = await response.json();
          console.log('Card payment authorized:', result);

          if (!result.success) {
            throw new Error(result.error || 'Payment authorization failed');
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
    console.log('🎯 Initializing PayPal Card Fields...');
    console.log('- window.paypal available:', !!window.paypal);
    console.log('- window.paypal.CardFields available:', !!window.paypal?.CardFields);
    console.log('- paypalLoaded state:', paypalLoaded);

    // Check if DOM elements exist (with correct IDs including -container suffix)
    const cardNumberField = document.getElementById('card-number-field-container');
    const cardExpiryField = document.getElementById('card-expiry-field-container');
    const cardCvvField = document.getElementById('card-cvv-field-container');
    const cardNameField = document.getElementById('card-name-field-container');
    
    console.log('- DOM elements check:', {
      cardNumberField: !!cardNumberField,
      cardExpiryField: !!cardExpiryField,
      cardCvvField: !!cardCvvField,
      cardNameField: !!cardNameField
    });

    if (!window.paypal || !window.paypal.CardFields) {
      console.error('❌ PayPal CardFields not available, retrying...');
      
      // Retry after a short delay (CardFields might still be loading)
      let retryAttempt = 0;
      const maxRetries = 5;
      
      const retryInitialize = () => {
        retryAttempt++;
        console.log(`🔄 Retry attempt ${retryAttempt}/${maxRetries} for CardFields...`);
        
        if (window.paypal && window.paypal.CardFields) {
          console.log('✅ CardFields now available, initializing...');
          initializeCardFields(); // Recursive call now that it's available
          return;
        }
        
        if (retryAttempt < maxRetries) {
          setTimeout(retryInitialize, 1000); // Wait 1 second between retries
        } else {
          console.error('❌ PayPal CardFields still not available after retries');
          toast({
            title: 'Payment System Error',
            description: 'PayPal card payment system not loaded. Please refresh the page or try PayPal wallet.',
            status: 'error',
            duration: 7000,
            isClosable: true,
          });
        }
      };
      
      // Start retry after 1 second
      setTimeout(retryInitialize, 1000);
      return;
    }
    
    // Check if DOM elements exist, if not retry
    if (!cardNumberField || !cardExpiryField || !cardCvvField || !cardNameField) {
      console.error('❌ Card field DOM elements not ready, retrying...');
      
      let retryAttempt = 0;
      const maxRetries = 3;
      
      const retryDOM = () => {
        retryAttempt++;
        console.log(`🔄 Retry attempt ${retryAttempt}/${maxRetries} for DOM elements...`);
        
        const cardNumberField = document.getElementById('card-number-field-container');
        const cardExpiryField = document.getElementById('card-expiry-field-container');
        const cardCvvField = document.getElementById('card-cvv-field-container');
        const cardNameField = document.getElementById('card-name-field-container');
        
        if (cardNumberField && cardExpiryField && cardCvvField && cardNameField) {
          console.log('✅ DOM elements now ready, initializing...');
          initializeCardFields(); // Recursive call now that DOM is ready
          return;
        }
        
        if (retryAttempt < maxRetries) {
          setTimeout(retryDOM, 500);
        } else {
          console.error('❌ Card field DOM elements not ready after retries');
          toast({
            title: 'Payment System Error',
            description: 'Card payment form not loaded. Please refresh the page or use PayPal wallet.',
            status: 'error',
            duration: 7000,
            isClosable: true,
          });
        }
      };
      
      setTimeout(retryDOM, 500);
      return;
    }

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

    let transactionId;
    let orderId = '';

    console.log('🏗️ Creating PayPal CardFields instance...');
    const cardField = window.paypal.CardFields({
      createOrder: () => {
        setIsProcessingPayment(true);
        console.log('Creating real booking...')
        try {
          if(orderId) {
            return orderId;
          }
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
              .then((data) => {

                if (!data.success) {
                  throw new Error(data.error || 'Failed to create booking');
                }

                transactionId = data.transactionId;
                orderId = data.orderId;
                return data.orderId
              });
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
          console.log('Card payment approved (authorization):', data.orderID);

          // IMPORTANT: We only AUTHORIZE here, not capture
          // Payment will be captured when provider approves the booking
          const response = await fetch('/api/payments/authorize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderID: data.orderID,
              serviceId: bookingData.serviceId,
              bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
              hours: bookingData.bookingDetails.duration || 4,
              addons: [],
              address: bookingData.bookingDetails.address,
              city: bookingData.bookingDetails.city,
              zipCode: bookingData.bookingDetails.zipCode,
              guestCount: bookingData.bookingDetails.guestCount,
              contactPhone: bookingData.bookingDetails.contactPhone,
              contactEmail: bookingData.bookingDetails.contactEmail,
              comments: bookingData.bookingDetails.specialRequests
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Authorization failed:', response.status, errorData);
            throw new Error(errorData.error || `Payment authorization failed: ${response.status}`);
          }

          const result = await response.json();
          console.log('Card payment authorized:', result);

          if (!result.success) {
            throw new Error(result.error || 'Payment authorization failed');
          }

          // Clear booking data from sessionStorage
          orderId = '';
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

        } catch (err) {
          console.error('Card payment authorization error:', err);
          const userMsg = extractPayPalErrorMessage(err, 'Payment authorization failed');
          toast({ 
            title: 'Payment Processing Failed', 
            description: userMsg, 
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          orderId = '';
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

    console.log('🔍 Checking CardFields eligibility...');
    console.log('- cardField.isEligible():', cardField.isEligible());
    
    if (cardField.isEligible()) {
      console.log('✅ CardFields is eligible, rendering fields...');
      
      try {
        const nameField = cardField.NameField({
          style: chakraStyle,
          placeholder: "John Doe"
        });
        console.log('- Rendering name field to #card-name-field-container');
        nameField.render("#card-name-field-container");

        const numberField = cardField.NumberField({
          style: chakraStyle,
          placeholder: "1234 5678 9012 3456",
        });
        console.log('- Rendering number field to #card-number-field-container');
        numberField.render("#card-number-field-container");

        const cvvField = cardField.CVVField({
          style: chakraStyle,
          placeholder: "123"
        });
        console.log('- Rendering CVV field to #card-cvv-field-container');
        cvvField.render("#card-cvv-field-container");

        const expiryField = cardField.ExpiryField({
          style: chakraStyle,
          placeholder: "MM/YY"
        });
        console.log('- Rendering expiry field to #card-expiry-field-container');
        expiryField.render("#card-expiry-field-container");

        cardFieldRef.current = cardField;
        setCardFieldsReady(true);
        console.log('✅ All card fields rendered successfully');
        
      } catch (error) {
        console.error('❌ Error rendering card fields:', error);
        toast({
          title: 'Payment System Error',
          description: 'Failed to initialize card payment fields. Please refresh the page.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } else {
      console.warn('⚠️ CardFields not eligible for this configuration');
      toast({
        title: 'Payment Method Unavailable',
        description: 'Credit card payments are not available. Please try PayPal wallet.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
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

                  {/* Debug info for PayPal initialization */}
                  {process.env.NODE_ENV === 'development' && (
                    <Alert status="info" size="sm">
                      <AlertIcon />
                      <VStack spacing={1} align="start" fontSize="xs">
                        <Text><strong>PayPal Debug Info:</strong></Text>
                        <Text>• PayPal SDK Loaded: {paypalLoaded ? '✅' : '❌'}</Text>
                        <Text>• Window PayPal Available: {typeof window !== 'undefined' && window.paypal ? '✅' : '❌'}</Text>
                        <Text>• PayPal CardFields Available: {typeof window !== 'undefined' && window.paypal?.CardFields ? '✅' : '❌'}</Text>
                        <Text>• Card Fields Ready: {cardFieldsReady ? '✅' : '❌'}</Text>
                        <Text>• Booking Data: {bookingData ? '✅' : '❌'}</Text>
                        <Text>• Client ID: {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID.substring(0, 10)}...` : '❌ Missing'}</Text>
                        <Text>• Processing Payment: {isProcessingPayment ? '✅' : '❌'}</Text>
                      </VStack>
                    </Alert>
                  )}

                  {/* PayPal Advanced Credit Card Processing */}
                  <Box>

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

                        {/* PayPal Messaging - Shows financing options */}
                        <Box 
                          p={3} 
                          bg="blue.50" 
                          borderRadius="md" 
                          border="1px" 
                          borderColor="blue.100"
                        >
                          <div 
                            data-pp-message 
                            data-pp-amount={bookingData.pricing.total.toFixed(2)}
                            data-pp-style-layout="text"
                            data-pp-style-logo-type="inline"
                            data-pp-style-text-color="black"
                            data-pp-style-text-size="12"
                          ></div>
                        </Box>

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

                  <Box bg="blue.50" p={3} borderRadius="md" borderWidth="1px" borderColor="blue.200">
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="semibold">Due today</Text>
                        <Text fontSize="sm" fontWeight="bold" color="green.600">$0.00</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Due after provider approval</Text>
                        <Text fontSize="sm" fontWeight="bold">${bookingData.pricing.total.toFixed(2)}</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Alert status="info" size="sm">
                    <AlertIcon />
                    <Text fontSize="xs">
                      Your payment will be authorized (held) but not charged yet. You'll only be charged after the provider confirms your booking.
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
