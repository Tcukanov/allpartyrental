'use client';

import React, { useState, useEffect } from 'react';
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
  Heading
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import ServiceAvailabilityCalendar from './ServiceAvailabilityCalendar';
import { useRouter } from 'next/navigation';
import PayPalPaymentButton from '../payment/PayPalPaymentButton';
import { getActivePaymentProvider } from '@/lib/payment/paypal/config';

// Initialize PayPal client ID
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
console.log("NEXT_PUBLIC_PAYPAL_CLIENT_ID value:", paypalClientId ? "Key exists" : "Key missing");

if (!paypalClientId && process.env.NODE_ENV === 'production') {
  console.error("PayPal client ID is missing or invalid. Payment processing may not work in production.");
} else {
  console.log("PayPal initialization ready");
}

// Steps for the booking process
const steps = [
  { title: 'Pick Date & Time', description: 'Select when you need the service' },
  { title: 'Payment', description: 'Complete your booking' },
  { title: 'Confirmation', description: 'Booking confirmed' }
];

const ServiceRequestButton = ({ service, offer }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [activePaymentProvider, setActivePaymentProvider] = useState('paypal');

  // Booking details
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(service?.minRentalHours || 1);
  const [bookingComments, setBookingComments] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Check which payment provider is active
  useEffect(() => {
    const checkPaymentProvider = async () => {
      const provider = await getActivePaymentProvider();
      setActivePaymentProvider(provider);
    };

    checkPaymentProvider();
  }, []);

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

  const handleProceedToPayment = () => {
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

    // Create booking details object
    const bookingDate = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const newBookingDetails = {
      date: selectedDate,
      time: selectedTime,
      duration: selectedDuration,
      comments: bookingComments,
      address: bookingAddress,
      addons: selectedAddons,
      formattedDate: selectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      isoDateTime: bookingDate.toISOString()
    };

    setBookingDetails(newBookingDetails);
    setActiveStep(1);
  };

  const handlePaymentComplete = (transaction) => {
    console.log("Payment completed with transaction:", transaction);
    setActiveStep(2);
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0); // Go back to date selection
    } else {
      onClose(); // Close modal if on first step
    }
  };

  const handleCancel = () => {
    onClose();
    // Reset everything when modal closes
    setTimeout(() => {
      setActiveStep(0);
      setSelectedDate(null);
      setSelectedTime('');
      setSelectedAddons([]);
      setBookingDetails(null);
      setPaymentCompleted(false);
    }, 300);
  };

  // Format booking details for the confirmation step
  const getFormattedBookingInfo = () => {
    if (!selectedDate) return null;

    const date = new Date(selectedDate);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return {
      date: selectedDate,
      formattedDate,
      time: selectedTime,
      duration: selectedDuration,
      address: bookingAddress,
      comments: bookingComments,
    };
  };

  // Calculate total amount
  const servicePrice = offer?.price || service?.price || 0;
  const baseAmount = Number(servicePrice);
  const addonsTotal = selectedAddons.reduce((total, addon) => total + Number(addon.price), 0);
  const subtotal = baseAmount + addonsTotal;
  const serviceFeePercent = 5.0; // 5% platform fee
  const serviceFee = subtotal * (serviceFeePercent / 100);
  const totalAmount = subtotal + serviceFee;

  // Function to render the current step
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <ServiceAvailabilityCalendar
            service={service}
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
        );
      case 1:
        return (
          <Box width="100%">
            <VStack spacing={4} align="stretch">
              <Box 
                border="1px" 
                borderColor="gray.200" 
                borderRadius="md" 
                p={4} 
                bg="gray.50"
              >
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">Booking Summary</Text>
                  <Text>Date: {bookingDetails?.formattedDate}</Text>
                  <Text>Time: {bookingDetails?.time}</Text>
                  <Text>Duration: {bookingDetails?.duration} hour(s)</Text>
                  <Text>Address: {bookingDetails?.address}</Text>
                  {bookingDetails?.comments && (
                    <Text>Notes: {bookingDetails?.comments}</Text>
                  )}
                  {selectedAddons.length > 0 && (
                    <Box>
                      <Text fontWeight="bold">Selected Add-ons:</Text>
                      {selectedAddons.map((addon, index) => (
                        <Text key={index}>- {addon.title}: ${addon.price}</Text>
                      ))}
                    </Box>
                  )}
                </VStack>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Total Amount: ${totalAmount.toFixed(2)}</Text>
                <Text fontSize="sm" color="gray.600">
                  Base Price: ${baseAmount.toFixed(2)}<br />
                  {addonsTotal > 0 && `Add-ons: $${addonsTotal.toFixed(2)}\n`}
                  Service Fee (5%): ${serviceFee.toFixed(2)}
                </Text>
              </Box>
              
              <Box w="100%">
                <PayPalPaymentButton
                  amount={totalAmount}
                  serviceName={service?.name}
                  onPaymentSuccess={handlePaymentComplete}
                  onPaymentError={(error) => {
                    console.error("Payment error:", error);
                    toast({
                      title: "Payment Error",
                      description: error.message || "There was an error processing your payment.",
                      status: "error",
                      duration: 5000,
                      isClosable: true,
                    });
                  }}
                  metadata={{
                    serviceId: service?.id,
                    serviceName: service?.name,
                    providerId: service?.providerId,
                    bookingDetails: bookingDetails
                  }}
                  createPaymentEndpoint="/api/payment/create-intent"
                  showCardByDefault={true}
                  buttonText="Pay with PayPal"
                />
              </Box>
            </VStack>
          </Box>
        );
      case 2:
        return (
          <VStack spacing={6} align="center" w="100%">
            <Box 
              borderRadius="full" 
              bg="green.100" 
              p={3} 
              display="flex" 
              alignItems="center"
              justifyContent="center"
            >
              <CheckIcon color="green.500" boxSize={8} />
            </Box>
            <Heading size="md">Booking Confirmed!</Heading>
            <Text textAlign="center">
              Your booking has been successfully processed. You'll receive a confirmation email shortly.
            </Text>
            <Box 
              border="1px" 
              borderColor="gray.200" 
              borderRadius="md" 
              p={4} 
              bg="gray.50"
              w="100%"
            >
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold">Booking Details</Text>
                <Text>Date: {bookingDetails?.formattedDate}</Text>
                <Text>Time: {bookingDetails?.time}</Text>
                <Text>Duration: {bookingDetails?.duration} hour(s)</Text>
                <Text>Address: {bookingDetails?.address}</Text>
              </VStack>
            </Box>
            <Button 
              colorScheme="blue" 
              onClick={() => router.push('/client/my-bookings')}
              mt={4}
            >
              View My Bookings
            </Button>
          </VStack>
        );
      default:
        return null;
    }
  };

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
            <Flex mt={2}>
              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <Box 
                    textAlign="center" 
                    color={index <= activeStep ? "blue.500" : "gray.400"}
                  >
                    <Box 
                      width="30px" 
                      height="30px" 
                      borderRadius="50%" 
                      border="2px solid"
                      borderColor={index <= activeStep ? "blue.500" : "gray.300"}
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      bg={index < activeStep ? "blue.500" : "transparent"}
                      color={index < activeStep ? "white" : "inherit"}
                      mx="auto"
                    >
                      {index < activeStep ? <CheckIcon boxSize={3} /> : index + 1}
                    </Box>
                    <Text 
                      fontSize="xs" 
                      mt={1} 
                      fontWeight={index === activeStep ? "medium" : "normal"}
                    >
                      {step.title}
                    </Text>
                  </Box>
                  {index < steps.length - 1 && (
                    <Flex 
                      flex={1} 
                      alignItems="center" 
                      px={1}
                    >
                      <Box 
                        height="1px" 
                        bg={index < activeStep ? "blue.500" : "gray.300"} 
                        w="100%" 
                      />
                    </Flex>
                  )}
                </React.Fragment>
              ))}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6}>
            {!paypalClientId && activePaymentProvider === 'paypal' && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>PayPal configuration error</AlertTitle>
                  <AlertDescription>
                    The payment system is not properly configured. Please contact support.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
            
            {renderStep()}
          </ModalBody>

          <ModalFooter>
            {activeStep < 2 && (
              <Button 
                variant="ghost" 
                mr={3} 
                onClick={activeStep === 0 ? handleCancel : handleBack}
              >
                {activeStep === 0 ? "Cancel" : "Back"}
              </Button>
            )}
            
            {activeStep === 0 && (
              <Button 
                colorScheme="blue" 
                onClick={handleProceedToPayment}
                isDisabled={!selectedDate || !selectedTime || !bookingAddress}
              >
                Proceed to Payment
              </Button>
            )}
            
            {activeStep === 2 && (
              <Button colorScheme="blue" onClick={handleCancel}>
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