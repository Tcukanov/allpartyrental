'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Button,
  useToast,
  Badge,
  HStack,
  Divider,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

// Mock data for ad packages
const adPackages = [
  {
    id: 1,
    name: '1 Day Spotlight',
    description: 'Your service featured in the "Best in Your Location" section for 1 day',
    price: 19.99,
    duration: '1 day',
    features: [
      'Featured in "Best in Your Location" section',
      'Increased visibility for 24 hours',
      'Priority placement in search results',
      'Highlighted listing with special badge'
    ]
  },
  {
    id: 2,
    name: '7 Day Spotlight',
    description: 'Your service featured in the "Best in Your Location" section for 7 days',
    price: 99.99,
    duration: '7 days',
    features: [
      'Featured in "Best in Your Location" section',
      'Increased visibility for 7 days',
      'Priority placement in search results',
      'Highlighted listing with special badge',
      'Weekly performance report'
    ]
  },
  {
    id: 3,
    name: 'First Wave Weekly',
    description: 'Get early access to new client requests for 7 days',
    price: 49.99,
    duration: '7 days',
    features: [
      'Early access to new client requests',
      'Priority notification system',
      'Exclusive client contact information',
      'Weekly request summary report'
    ]
  },
  {
    id: 4,
    name: 'First Wave Monthly',
    description: 'Get early access to new client requests for 30 days',
    price: 149.99,
    duration: '30 days',
    features: [
      'Early access to new client requests',
      'Priority notification system',
      'Exclusive client contact information',
      'Monthly request summary report',
      'Priority support'
    ]
  },
  {
    id: 5,
    name: 'Premium Bundle',
    description: '7 Day Spotlight + First Wave Weekly',
    price: 129.99,
    duration: '7 days',
    features: [
      'Featured in "Best in Your Location" section',
      'Early access to new client requests',
      'Priority placement in search results',
      'Highlighted listing with special badge',
      'Weekly performance report',
      'Priority support'
    ]
  }
];

export default function ProviderAdvertisingPage() {
  const router = useRouter();
  const toast = useToast();
  const [selectedPackage, setSelectedPackage] = useState(null);

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    
    // Show PayPal payment info toast
    toast({
      title: 'PayPal Payment',
      description: 'You will be redirected to PayPal to complete your payment for this advertising package.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });

    // In a real implementation, redirect to PayPal checkout or show PayPal modal
    // For now, we'll just simulate a successful payment
    setTimeout(() => {
      handlePaymentSuccess();
    }, 1500);
  };

  const handlePaymentSuccess = () => {
    setSelectedPackage(null);
    toast({
      title: 'Success',
      description: 'Your advertisement has been activated successfully!',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    // Refresh the page or update the UI as needed
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>Boost Your Visibility</Heading>
          <Text fontSize="lg" color="gray.600">
            Choose an advertising package to increase your visibility and get more clients
          </Text>
        </Box>

        {selectedPackage && (
          <Alert status="info" variant="subtle">
            <AlertIcon />
            <AlertTitle>Processing Payment:</AlertTitle>
            <AlertDescription>
              Your payment for {selectedPackage.name} is being processed.
            </AlertDescription>
          </Alert>
        )}
                
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {adPackages.map((pkg) => (
            <Card key={pkg.id} size="lg">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Heading size="md" mb={2}>{pkg.name}</Heading>
                    <Text color="gray.600">{pkg.description}</Text>
                    <Badge colorScheme="blue" mt={2}>{pkg.duration}</Badge>
                  </Box>
                
                <Divider />
                
                  <List spacing={3}>
                    {pkg.features.map((feature, index) => (
                      <ListItem key={index}>
                        <HStack>
                          <ListIcon as={CheckIcon} color="green.500" />
                          <Text>{feature}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>

                  <Box pt={4}>
                    <Text fontSize="2xl" fontWeight="bold" mb={2}>
                      ${pkg.price}
                    </Text>
                    <Button
                      colorScheme="blue"
                      width="full"
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      Pay with PayPal
                    </Button>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}