'use client';

import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Text,
  VStack,
  useToast,
  Box
} from '@chakra-ui/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import ServiceRequestPayment from '../payment/ServiceRequestPayment';
import { useRouter } from 'next/navigation';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const ServiceRequestButton = ({ service, offer }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handlePaymentComplete = (transaction) => {
    setPaymentCompleted(true);
    toast({
      title: "Service Request Submitted",
      description: "Your payment has been authorized and the provider has been notified. You will be redirected to your transactions page.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    
    // Redirect to transactions page after a short delay
    setTimeout(() => {
      router.push('/client/transactions');
    }, 3000);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <>
      <Button 
        onClick={onOpen} 
        colorScheme="blue" 
        size="lg" 
        width="full"
        isLoading={isSubmitting}
      >
        Send Request
      </Button>

      <Modal isOpen={isOpen} onClose={handleCancel} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Request Service
            <Text fontSize="sm" color="gray.500" mt={1}>
              {service?.name || offer?.service?.name}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            {paymentCompleted ? (
              <VStack spacing={4} align="stretch" p={4}>
                <Text fontSize="lg" fontWeight="bold" color="green.500">
                  Payment Authorized!
                </Text>
                <Text>
                  Your service request has been submitted and the provider has been notified. 
                  They will review your request within 24 hours.
                </Text>
                <Text>
                  Your payment will only be processed if the provider accepts your request.
                </Text>
              </VStack>
            ) : (
              <Box>
                <Elements stripe={stripePromise}>
                  <ServiceRequestPayment 
                    service={service} 
                    offer={offer}
                    onPaymentComplete={handlePaymentComplete}
                    onCancel={handleCancel}
                  />
                </Elements>
              </Box>
            )}
          </ModalBody>
          
          {paymentCompleted && (
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleCancel}>
                Close
              </Button>
              <Button variant="outline" onClick={() => router.push('/client/transactions')}>
                View Transactions
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ServiceRequestButton; 