"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Image,
  Button,
  Card,
  CardBody,
  List,
  ListItem,
  ListIcon,
  Divider,
  Icon
} from '@chakra-ui/react';
import { CheckCircleIcon, InfoIcon } from '@chakra-ui/icons';
import { MdQuestionAnswer, MdVerified, MdPayment, MdCelebration } from 'react-icons/md';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';

export default function HowItWorksPage() {
  const router = useRouter();
  
  const handleGetStarted = () => {
    router.push('/client/create-party');
  };
  
  return (
    <MainLayout>
      <Box>
        {/* Hero Section */}
        <Box bg="brand.600" color="white" py={16}>
          <Container maxW="container.xl">
            <VStack spacing={6} align="center" textAlign="center">
              <Heading as="h1" size="2xl">How Party Marketplace Works</Heading>
              <Text fontSize="xl" maxW="800px">
                Our platform makes it easy to plan and organize your perfect party by connecting you with the best service providers in your area.
              </Text>
              <Button 
                size="lg" 
                colorScheme="white" 
                variant="outline" 
                onClick={handleGetStarted}
                _hover={{ bg: 'white', color: 'brand.600' }}
              >
                Get Started
              </Button>
            </VStack>
          </Container>
        </Box>
        
        {/* For Clients Section */}
        <Container maxW="container.xl" py={16}>
          <VStack spacing={12}>
            <Heading as="h2" size="xl" textAlign="center">For Clients</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
              <Card h="100%">
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex 
                      w="80px" 
                      h="80px" 
                      bg="brand.500" 
                      color="white" 
                      rounded="full" 
                      justify="center" 
                      align="center"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      1
                    </Flex>
                    <Heading size="md">Create Your Party</Heading>
                    <Text>
                      Use our intuitive party configurator to select the services you need for your event.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card h="100%">
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex 
                      w="80px" 
                      h="80px" 
                      bg="brand.500" 
                      color="white" 
                      rounded="full" 
                      justify="center" 
                      align="center"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      2
                    </Flex>
                    <Heading size="md">Receive Offers</Heading>
                    <Text>
                      Local service providers will send you personalized offers based on your requirements.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card h="100%">
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex 
                      w="80px" 
                      h="80px" 
                      bg="brand.500" 
                      color="white" 
                      rounded="full" 
                      justify="center" 
                      align="center"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      3
                    </Flex>
                    <Heading size="md">Compare and Choose</Heading>
                    <Text>
                      Review and compare offers, chat with providers, and select the best options for your event.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card h="100%">
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex 
                      w="80px" 
                      h="80px" 
                      bg="brand.500" 
                      color="white" 
                      rounded="full" 
                      justify="center" 
                      align="center"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      4
                    </Flex>
                    <Heading size="md">Secure Payment</Heading>
                    <Text>
                      Pay securely through our platform with funds held in escrow until service completion.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
            
            <Box textAlign="center" maxW="800px">
              <Heading size="md" mb={4}>Benefits for Clients</Heading>
              <List spacing={3}>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Save time by getting multiple offers from local providers
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Compare prices and services in one place
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Secure payment system with escrow protection
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Read reviews from other clients before booking
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Manage all your party details in one dashboard
                </ListItem>
              </List>
            </Box>
          </VStack>
        </Container>
        
        <Divider />
        
        {/* For Providers Section */}
        <Container maxW="container.xl" py={16}>
          <VStack spacing={12}>
            <Heading as="h2" size="xl" textAlign="center">For Service Providers</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
              <Card h="100%">
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex 
                      w="80px" 
                      h="80px" 
                      bg="secondary.500" 
                      color="white" 
                      rounded="full" 
                      justify="center" 
                      align="center"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      1
                    </Flex>
                    <Heading size="md">Create Your Profile</Heading>
                    <Text>
                      Set up your service provider profile and list your services with details and pricing.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card h="100%">
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex 
                      w="80px" 
                      h="80px" 
                      bg="secondary.500" 
                      color="white" 
                      rounded="full" 
                      justify="center" 
                      align="center"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      2
                    </Flex>
                    <Heading size="md">Receive Requests</Heading>
                    <Text>
                      Get notified when clients in your area are looking for services you provide.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card h="100%">
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex 
                      w="80px" 
                      h="80px" 
                      bg="secondary.500" 
                      color="white" 
                      rounded="full" 
                      justify="center" 
                      align="center"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      3
                    </Flex>
                    <Heading size="md">Send Custom Offers</Heading>
                    <Text>
                      Create personalized offers based on client requirements and answer their questions.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card h="100%">
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex 
                      w="80px" 
                      h="80px" 
                      bg="secondary.500" 
                      color="white" 
                      rounded="full" 
                      justify="center" 
                      align="center"
                      fontSize="2xl"
                      fontWeight="bold"
                    >
                      4
                    </Flex>
                    <Heading size="md">Get Paid Securely</Heading>
                    <Text>
                      Receive secure payments through our platform after service completion.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
            
            <Box textAlign="center" maxW="800px">
              <Heading size="md" mb={4}>Benefits for Service Providers</Heading>
              <List spacing={3}>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Find new clients without expensive advertising
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Manage all your client requests in one dashboard
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Secure payment guarantee through escrow
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Boost your visibility with advertising options
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Build your reputation with client reviews
                </ListItem>
              </List>
            </Box>
          </VStack>
        </Container>
        
        {/* Security and Trust Section */}
        <Box bg="gray.50" py={16}>
          <Container maxW="container.xl">
            <VStack spacing={8}>
              <Heading as="h2" size="xl" textAlign="center">Security and Trust</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                <Card h="100%">
                  <CardBody>
                    <VStack spacing={4} align="center" textAlign="center">
                      <Icon as={MdPayment} boxSize={10} color="brand.500" />
                      <Heading size="md">Secure Payments</Heading>
                      <Text>
                        All payments are processed securely and held in escrow until service completion.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card h="100%">
                  <CardBody>
                    <VStack spacing={4} align="center" textAlign="center">
                      <Icon as={MdVerified} boxSize={10} color="brand.500" />
                      <Heading size="md">Verified Providers</Heading>
                      <Text>
                        We verify service providers' details to ensure you're working with legitimate businesses.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card h="100%">
                  <CardBody>
                    <VStack spacing={4} align="center" textAlign="center">
                      <Icon as={MdQuestionAnswer} boxSize={10} color="brand.500" />
                      <Heading size="md">Dispute Resolution</Heading>
                      <Text>
                        Our platform includes a fair dispute resolution process to protect both parties.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          </Container>
        </Box>
        
        {/* FAQ Section */}
        <Container maxW="container.xl" py={16}>
          <VStack spacing={8}>
            <Heading as="h2" size="xl" textAlign="center">Frequently Asked Questions</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} maxW="1000px">
              <Box>
                <Heading size="md" mb={3}>How much does it cost to use the platform?</Heading>
                <Text>
                  It's free for clients to create party requests and receive offers. Service providers pay a small commission on completed bookings.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>How does the escrow payment work?</Heading>
                <Text>
                  When you book a service, your payment is held securely in escrow. After service completion and your confirmation, the funds are released to the provider.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>Can I cancel a booking?</Heading>
                <Text>
                  Yes, you can cancel a booking, but cancellation policies may apply depending on how close to the event date you cancel.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>How do I become a service provider?</Heading>
                <Text>
                  Create an account, select the "Service Provider" role, complete your profile, and list your services to start receiving booking requests.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>What if I'm not satisfied with the service?</Heading>
                <Text>
                  If you're not satisfied, you can raise a dispute. Our platform offers a fair resolution process to address any issues.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>How quickly will I receive offers?</Heading>
                <Text>
                  Most clients receive their first offers within 24 hours of publishing their party request.
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </Container>
        
        {/* CTA Section */}
        <Box bg="brand.600" color="white" py={16}>
          <Container maxW="container.xl" textAlign="center">
            <VStack spacing={6}>
              <Heading as="h2" size="xl">Ready to Get Started?</Heading>
              <Text fontSize="lg" maxW="800px">
                Join thousands of satisfied clients who found the perfect service providers for their parties.
              </Text>
              <Button 
                size="lg" 
                colorScheme="white" 
                variant="outline" 
                onClick={handleGetStarted}
                _hover={{ bg: 'white', color: 'brand.600' }}
              >
                Plan Your Party Now
              </Button>
            </VStack>
          </Container>
        </Box>
      </Box>
    </MainLayout>
  );
}