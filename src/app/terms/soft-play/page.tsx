'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, Divider, Spinner, Center, Button, useToast } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SoftPlayTermsPage() {
  const [vendorName, setVendorName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPopup, setIsPopup] = useState(false);
  const toast = useToast();
  const searchParams = useSearchParams();
  const serviceId = searchParams?.get('serviceId');
  const router = useRouter();

  useEffect(() => {
    // Check if this is a popup window
    try {
      setIsPopup(window.opener !== null && window.opener !== window);
    } catch (e) {
      // If there's a security error accessing window.opener, assume it's not a popup
      setIsPopup(false);
    }
    
    // If we have a serviceId, fetch the vendor's business name
    if (serviceId) {
      fetchVendorDetails();
    } else {
      setIsLoading(false);
    }
  }, [serviceId]);

  const fetchVendorDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/services/${serviceId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Service data:", data);
        
        // Check for different possible response structures
        if (data.success && data.data?.service?.provider) {
          // Direct service provider structure
          setVendorName(data.data.service.provider.businessName || data.data.service.provider.name);
        } else if (data.success && data.data?.provider) {
          // Alternate provider structure
          setVendorName(data.data.provider.businessName || data.data.provider.name);
        } else if (data.success && data.data?.user?.provider) {
          // User provider structure
          setVendorName(data.data.user.provider.businessName || data.data.user.name);
        } else if (data.provider) {
          // Direct provider in root
          setVendorName(data.provider.businessName || data.provider.name);
        } else if (data.user?.name) {
          // Fallback to user name
          setVendorName(data.user.name);
        } else {
          // Default fallback
          setVendorName("the Service Provider");
        }
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      // Fallback to generic name in case of error
      setVendorName("the Service Provider");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseWindow = () => {
    try {
      // Try to close the window
      window.close();
      
      // If we're still here after trying to close, the browser might have blocked it
      // Show a message after a short delay
      setTimeout(() => {
        toast({
          title: "Unable to close window automatically",
          description: "Please close this window manually to return to the booking process.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }, 300);
    } catch (e) {
      console.error("Error closing window:", e);
      toast({
        title: "Unable to close window",
        description: "Please close this window manually to return to the booking process.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const currentDate = new Date().toLocaleDateString();
  const businessName = vendorName || 'the Service Provider';

  if (isLoading) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading service details...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box py={16} bg="gray.50" minH="100vh">
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">
            Soft Play Equipment Service Agreement
          </Heading>
          
          <Text fontSize="md" color="gray.600" textAlign="center">
            Between the Client and {businessName}
          </Text>
          
          <Text fontSize="sm" color="gray.500" textAlign="right">
            Last updated: {currentDate}
          </Text>

          <Divider />

          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h2" size="md" mb={4}>
                1. Services and Equipment
              </Heading>
              <Text>
                {businessName} agrees to provide soft play equipment rental services to the Client as detailed in the service description and booking details. The equipment will be delivered, set up, and collected by {businessName} unless otherwise specified.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                2. Safety and Supervision
              </Heading>
              <Text mb={2}>
                The Client acknowledges that:
              </Text>
              <Text ml={4} mb={1}>• Children must be supervised by a responsible adult at all times while using the soft play equipment</Text>
              <Text ml={4} mb={1}>• The Client is responsible for ensuring the safety of all users</Text>
              <Text ml={4} mb={1}>• Food, drinks, shoes, and sharp objects are not permitted on the soft play equipment</Text>
              <Text ml={4} mb={1}>• The equipment should not be used by adults unless specifically designed for adult use</Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                3. Equipment Care and Damage
              </Heading>
              <Text>
                The Client agrees to take reasonable care of the equipment and ensure it is not misused. Any damage beyond normal wear and tear may result in additional charges. The Client must inform {businessName} immediately of any damage that occurs during the rental period.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                4. Space and Setup Requirements
              </Heading>
              <Text>
                The Client is responsible for ensuring adequate space is available for the equipment as specified in the service details. The area must be clean, dry, and free from obstacles. Indoor setups require sufficient ceiling height and access to power outlets where applicable.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                5. Liability and Insurance
              </Heading>
              <Text>
                {businessName} maintains appropriate public liability insurance for the equipment provided. However, the Client assumes responsibility for injuries or accidents that occur due to improper supervision or misuse of the equipment. The Client acknowledges that soft play activities carry inherent risks.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                6. Cancellation and Rescheduling
              </Heading>
              <Text>
                Cancellation policies are as specified in the service details. Generally, cancellations within 48 hours of the event may incur a charge. Rescheduling is subject to availability and may incur additional fees if requested within 48 hours of the event.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                7. Weather Conditions (for Outdoor Setups)
              </Heading>
              <Text>
                For outdoor setups, {businessName} reserves the right to cancel or postpone the service in case of adverse weather conditions that may compromise safety or damage the equipment. Alternative arrangements will be discussed with the Client.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                8. Payment Terms
              </Heading>
              <Text>
                Payment terms are as specified in the booking process. A deposit may be required to secure the booking, with the remaining balance due before or on the day of the event as agreed. All payments are processed securely through the AllPartyRent platform.
              </Text>
            </Box>

            <Divider my={4} />

            <Box>
              <Text fontSize="sm" color="gray.600" fontStyle="italic">
                Note: This is the complete terms and conditions document for reference. Agreement to these terms is provided during the booking and payment process.
              </Text>
              <Center mt={6}>
                {isPopup ? (
                  <Button onClick={handleCloseWindow} size="md" colorScheme="blue">
                    Close Window
                  </Button>
                ) : (
                  <Button onClick={handleGoBack} size="md" colorScheme="blue">
                    Return to Previous Page
                  </Button>
                )}
              </Center>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
} 