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
  Box,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
  Spinner
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import ServiceAvailabilityCalendar from './ServiceAvailabilityCalendar';
import PayPalCreditCardForm from '../payment/PayPalCreditCardForm';
import { useRouter } from 'next/navigation';

// Steps for the booking process (simplified)
const steps = [
  { title: 'Book Service', description: 'Select when you need the service' }
];

const ServiceRequestButton = ({ service, offer }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();

  // Booking details
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(service?.minRentalHours || 1);
  const [bookingComments, setBookingComments] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  
  // Payment states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('booking'); // 'booking', 'payment', 'processing', 'success'
  const [transactionId, setTransactionId] = useState(null);

  console.log("ServiceRequestButton received service:", JSON.stringify({
    id: service?.id,
    name: service?.name,
    price: service?.price,
    providerId: service?.providerId,
    availableDays: service?.availableDays,
    availableHoursStart: service?.availableHoursStart,
    availableHoursEnd: service?.availableHoursEnd,
    minRentalHours: service?.minRentalHours,
    maxRentalHours: service?.maxRentalHours
  }, null, 2));

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration);
  };
  
  const handleCommentChange = (comment) => {
    setBookingComments(comment);
  };
  
  const handleAddressChange = (address) => {
    setBookingAddress(address);
  };
  
  const handleAddonsChange = (addons) => {
    console.log("Selected addons:", addons);
    setSelectedAddons(addons);
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Incomplete Information",
        description: "Please select a date and time for your booking.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!bookingAddress) {
      toast({
        title: "Missing Information", 
        description: "Please provide the address where the service will be delivered.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Combine date and time for booking
    const bookingDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes));

    // Set booking data for payment form
    const bookingData = {
      serviceId: service?.id || offer?.service?.id,
      bookingDate: bookingDateTime.toISOString(),
      duration: selectedDuration,
      comments: bookingComments,
      address: bookingAddress,
      addons: selectedAddons
    };

    setTransactionId(bookingData); // Store booking data instead of transaction ID
    setPaymentStep('payment');
  };

  const handlePaymentSuccess = (paymentData) => {
    setPaymentStep('success');
    toast({
      title: "Payment Successful",
      description: `Your payment of $${paymentData.amountReceived?.toFixed(2)} has been processed successfully.`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    // Auto-close modal after success
    setTimeout(() => {
      handleCancel();
      router.push('/dashboard'); // Redirect to dashboard
    }, 3000);
  };

  const handlePaymentError = (error) => {
    setPaymentStep('booking');
    toast({
      title: "Payment Failed",
      description: error || "Payment processing failed. Please try again.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  const handlePaymentCancel = () => {
    setPaymentStep('booking');
    toast({
      title: "Payment Cancelled",
      description: "Payment was cancelled. You can try again.",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCancel = () => {
    onClose();
    // Reset everything when modal closes
    setTimeout(() => {
      setSelectedDate(null);
      setSelectedTime('');
      setSelectedAddons([]);
      setBookingComments('');
      setBookingAddress('');
      setIsProcessing(false);
      setPaymentStep('booking');
      setTransactionId(null);
    }, 300);
  };

  // Calculate pricing (for display only) - FLAT PRICING
  const service_price = parseFloat(service?.price || offer?.price || 0);
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + parseFloat(addon.price || 0), 0);
  const baseAmount = service_price; // Flat price, not multiplied by hours
  const serviceFee = (baseAmount + addonsTotal) * 0.05; // 5% service fee
  const totalAmount = baseAmount + addonsTotal + serviceFee;

  return (
    <>
      <Button 
        onClick={onOpen} 
        colorScheme="blue" 
        size="lg" 
        width="100%"
        isDisabled={!service && !offer}
      >
        Book Now
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={handleCancel} 
        size="lg" 
        closeOnOverlayClick={false}
        isCentered
      >
        <ModalOverlay />
        <ModalContent maxW={{ base: "90%", md: "800px" }}>
          <ModalHeader>
            <Text>Book {service?.name || offer?.service?.name}</Text>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6}>
            {paymentStep === 'booking' && (
              <>
                <ServiceAvailabilityCalendar
                  service={service}
                  offer={offer}
                  onDateSelect={handleDateSelect}
                  onTimeSelect={handleTimeSelect}
                  onDurationSelect={handleDurationSelect}
                  onCommentChange={handleCommentChange}
                  onAddressChange={handleAddressChange}
                  onAddonsChange={handleAddonsChange}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  selectedDuration={selectedDuration}
                  bookingComments={bookingComments}
                  bookingAddress={bookingAddress}
                  selectedAddons={selectedAddons}
                />
                
                {/* Pricing Summary */}
                {selectedDate && selectedTime && (
                  <Box mt={6} p={4} border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                    <Text fontWeight="bold" mb={2}>Pricing Summary</Text>
                    <Text>Service Price: ${baseAmount.toFixed(2)} (flat rate)</Text>
                    {addonsTotal > 0 && <Text>Add-ons: ${addonsTotal.toFixed(2)}</Text>}
                    <Text>Service Fee (5%): ${serviceFee.toFixed(2)}</Text>
                    <Text fontWeight="bold" fontSize="lg" mt={2}>Total: ${totalAmount.toFixed(2)}</Text>
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      * Secure payment with PayPal
                    </Text>
                  </Box>
                )}
              </>
            )}

            {paymentStep === 'payment' && (
              <VStack spacing={6} align="stretch">
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="bold">Complete Your Payment</Text>
                  <Text color="gray.600">Secure payment for {service?.name || offer?.service?.name}</Text>
                </Box>
                
                <PayPalCreditCardForm
                  amount={totalAmount}
                  bookingData={transactionId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              </VStack>
            )}

            {paymentStep === 'success' && (
              <VStack spacing={6} align="center" py={8}>
                <CheckIcon boxSize={16} color="green.500" />
                <Text fontSize="xl" fontWeight="bold" color="green.600">
                  Payment Successful!
                </Text>
                <Text textAlign="center" color="gray.600">
                  Your booking request has been submitted. The provider will review and confirm your booking.
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Redirecting to dashboard...
                </Text>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            {paymentStep === 'booking' && (
              <>
                <Button 
                  variant="ghost" 
                  mr={3} 
                  onClick={handleCancel}
                  isDisabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  onClick={handleSubmitBooking}
                  isDisabled={!selectedDate || !selectedTime || !bookingAddress || isProcessing}
                  isLoading={isProcessing}
                  loadingText="Creating booking..."
                >
                  Continue to Payment
                </Button>
              </>
            )}

            {paymentStep === 'payment' && (
              <>
                <Button 
                  variant="ghost" 
                  mr={3} 
                  onClick={() => setPaymentStep('booking')}
                >
                  Back to Booking
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Complete payment using the form above
                </Text>
              </>
            )}

            {paymentStep === 'success' && (
              <Button 
                colorScheme="green" 
                onClick={handleCancel}
                width="full"
              >
                Close
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ServiceRequestButton; 