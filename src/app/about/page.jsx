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
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HowItWorksPage() {
  const router = useRouter();
  
  const handleGetStarted = () => {
    router.push('/client/create-party');
  };
  
  return (
    <Box>
      {/* Hero Section */}
      <Box bg="brand.600" color="white" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="center" textAlign="center">
            <Heading as="h1" size="2xl">How Party Marketplace Works</Heading>
            <Text fontSize="xl" maxW="800px">
              Our platform offers two flexible ways to connect with service providers for your next event: browse services by location or create a party and receive offers from providers near you.
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
          <Heading as="h2" size="xl" textAlign="center">Two Ways to Use Our Platform</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12}>
            {/* Option 1: Browse by Location */}
            <Card h="100%">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box bg="brand.100" p={6} borderRadius="md">
                    <Heading size="lg" mb={4} textAlign="center" color="brand.700">Option 1: Browse Services</Heading>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <Flex 
                          w="40px" 
                          h="40px" 
                          bg="brand.500" 
                          color="white" 
                          rounded="full" 
                          justify="center" 
                          align="center"
                          fontSize="lg"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          1
                        </Flex>
                        <Text>
                          <strong>Choose Your Location</strong> - Select your city to find services available in your area
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Flex 
                          w="40px" 
                          h="40px" 
                          bg="brand.500" 
                          color="white" 
                          rounded="full" 
                          justify="center" 
                          align="center"
                          fontSize="lg"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          2
                        </Flex>
                        <Text>
                          <strong>Browse Categories</strong> - Explore different service categories like decoration, catering, entertainment, etc.
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Flex 
                          w="40px" 
                          h="40px" 
                          bg="brand.500" 
                          color="white" 
                          rounded="full" 
                          justify="center" 
                          align="center"
                          fontSize="lg"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          3
                        </Flex>
                        <Text>
                          <strong>Compare Options</strong> - View provider profiles, compare prices, and read reviews
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Flex 
                          w="40px" 
                          h="40px" 
                          bg="brand.500" 
                          color="white" 
                          rounded="full" 
                          justify="center" 
                          align="center"
                          fontSize="lg"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          4
                        </Flex>
                        <Text>
                          <strong>Book Services</strong> - Contact providers directly or book services through our platform
                        </Text>
                      </HStack>
                    </VStack>
                    <Box mt={6} textAlign="center">
                      <Button 
                        as={Link} 
                        href="/services" 
                        colorScheme="brand"
                      >
                        Browse Services
                      </Button>
                    </Box>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
            
            {/* Option 2: Create a Party */}
            <Card h="100%">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box bg="secondary.100" p={6} borderRadius="md">
                    <Heading size="lg" mb={4} textAlign="center" color="secondary.700">Option 2: Create a Party</Heading>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <Flex 
                          w="40px" 
                          h="40px" 
                          bg="secondary.500" 
                          color="white" 
                          rounded="full" 
                          justify="center" 
                          align="center"
                          fontSize="lg"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          1
                        </Flex>
                        <Text>
                          <strong>Plan Your Party</strong> - Describe your event details, including location, date, and service needs
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Flex 
                          w="40px" 
                          h="40px" 
                          bg="secondary.500" 
                          color="white" 
                          rounded="full" 
                          justify="center" 
                          align="center"
                          fontSize="lg"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          2
                        </Flex>
                        <Text>
                          <strong>Receive Offers</strong> - Local service providers near your area will apply with personalized offers
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Flex 
                          w="40px" 
                          h="40px" 
                          bg="secondary.500" 
                          color="white" 
                          rounded="full" 
                          justify="center" 
                          align="center"
                          fontSize="lg"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          3
                        </Flex>
                        <Text>
                          <strong>Compare & Choose</strong> - Review offers, chat with providers, and select the best fit for your needs
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Flex 
                          w="40px" 
                          h="40px" 
                          bg="secondary.500" 
                          color="white" 
                          rounded="full" 
                          justify="center" 
                          align="center"
                          fontSize="lg"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          4
                        </Flex>
                        <Text>
                          <strong>Secure Booking</strong> - Pay through our secure platform with escrow protection
                        </Text>
                      </HStack>
                    </VStack>
                    <Box mt={6} textAlign="center">
                      <Button 
                        as={Link} 
                        href="/client/create-party" 
                        colorScheme="brand"
                      >
                        Create a Party
                      </Button>
                    </Box>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
          
          <Box textAlign="center" maxW="800px" mt={8}>
            <Heading size="md" mb={4}>Benefits for Clients</Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                Flexibility to browse existing services or receive custom offers
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                Connect with verified local providers in your area
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                Secure payment system with escrow protection
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                Compare prices and read reviews before booking
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
                    Set up your profile and list your services with details, pricing, and your service area.
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
                  <Heading size="md">Find Opportunities</Heading>
                  <Text>
                    Browse party requests in your area and respond to those that match your services.
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
                    Apply to party projects with personalized offers tailored to the client's specific needs.
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
                Find clients in your local area without expensive advertising
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                Choose between listing your services or bidding on party projects
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
  );
}