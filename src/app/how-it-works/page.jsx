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
          <Heading as="h2" size="xl" textAlign="center">For Clients</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Flex
                    w="60px"
                    h="60px"
                    bg="brand.500"
                    color="white"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    1
                  </Flex>
                  <Heading size="lg">Browse Services</Heading>
                  <Text>
                    Search for the exact services you need by location, date, and category. 
                    Filter results to find the perfect match for your event requirements.
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Browse local services by category
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Read verified reviews from past clients
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Contact providers directly with questions
                    </ListItem>
                  </List>
                  <Button 
                    as={Link} 
                    href="/services" 
                    colorScheme="brand" 
                    variant="outline"
                  >
                    Browse Services
                  </Button>
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Flex
                    w="60px"
                    h="60px"
                    bg="brand.500"
                    color="white"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    2
                  </Flex>
                  <Heading size="lg">Create a Party</Heading>
                  <Text>
                    Create a party request and let qualified service providers come to you with 
                    personalized offers. Compare options and choose the best fit for your event.
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Describe your event needs once
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Receive multiple competitive offers
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Negotiate details directly with providers
                    </ListItem>
                  </List>
                  <Button 
                    onClick={handleGetStarted}
                    colorScheme="brand"
                  >
                    Create a Party
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
          
          <Divider />
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Flex
                    w="60px"
                    h="60px"
                    bg="brand.500"
                    color="white"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    3
                  </Flex>
                  <Heading size="lg">Book Securely</Heading>
                  <Text>
                    Once you've found the right provider, book and pay securely through our platform. 
                    Your payment is protected until the service is completed to your satisfaction.
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Secure payment processing
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Funds held in escrow until completion
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Detailed service agreements
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Flex
                    w="60px"
                    h="60px"
                    bg="brand.500"
                    color="white"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    4
                  </Flex>
                  <Heading size="lg">Enjoy Your Event</Heading>
                  <Text>
                    Relax and enjoy your special event knowing all the details are handled by 
                    vetted professionals. After the event, leave a review to help others.
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Professional service delivery
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Customer support if needed
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Share your experience with a review
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
      
      {/* Process Flow Diagram */}
      <Box bg="gray.50" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading as="h2" size="xl" textAlign="center">The Process</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
              <VStack>
                <Icon as={MdQuestionAnswer} boxSize={12} color="brand.500" />
                <Heading size="md">Request</Heading>
                <Text textAlign="center">
                  Describe your event and what services you need
                </Text>
              </VStack>
              
              <VStack>
                <Icon as={MdVerified} boxSize={12} color="brand.500" />
                <Heading size="md">Match</Heading>
                <Text textAlign="center">
                  Receive offers from verified service providers
                </Text>
              </VStack>
              
              <VStack>
                <Icon as={MdPayment} boxSize={12} color="brand.500" />
                <Heading size="md">Book</Heading>
                <Text textAlign="center">
                  Book and pay securely through our platform
                </Text>
              </VStack>
              
              <VStack>
                <Icon as={MdCelebration} boxSize={12} color="brand.500" />
                <Heading size="md">Celebrate</Heading>
                <Text textAlign="center">
                  Enjoy your event with peace of mind
                </Text>
              </VStack>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
      
      {/* For Providers Section */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" textAlign="center">For Service Providers</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Flex
                    w="60px"
                    h="60px"
                    bg="brand.500"
                    color="white"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    1
                  </Flex>
                  <Heading size="lg">Join the Platform</Heading>
                  <Text>
                    Create your professional profile, showcase your services, and set your availability.
                    Our verification process ensures a trusted marketplace for all users.
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Free registration process
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Build a detailed service catalog
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Set your own pricing and terms
                    </ListItem>
                  </List>
                  <Button 
                    as={Link} 
                    href="/provider/join" 
                    colorScheme="brand"
                  >
                    Join as Provider
                  </Button>
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Flex
                    w="60px"
                    h="60px"
                    bg="brand.500"
                    color="white"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    2
                  </Flex>
                  <Heading size="lg">Get Clients</Heading>
                  <Text>
                    Receive notifications about relevant party requests in your area and respond with 
                    personalized offers. Stand out with your unique selling points.
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Access to local client base
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Submit customized offers
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      No upfront costs to make offers
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
          
          <Divider />
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Flex
                    w="60px"
                    h="60px"
                    bg="brand.500"
                    color="white"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    3
                  </Flex>
                  <Heading size="lg">Provide Services</Heading>
                  <Text>
                    Deliver exceptional service according to the agreed terms. Build your reputation 
                    on our platform through successful events and positive reviews.
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Clear client expectations
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Direct communication channel
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Opportunity to exceed expectations
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Flex
                    w="60px"
                    h="60px"
                    bg="brand.500"
                    color="white"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    fontSize="xl"
                    fontWeight="bold"
                  >
                    4
                  </Flex>
                  <Heading size="lg">Get Paid</Heading>
                  <Text>
                    Receive secure, timely payments once services are completed. 
                    Our platform handles the financial details so you can focus on your work.
                  </Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Secure payment processing
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Transparent fee structure
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Fast payouts to your account
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
      
      {/* FAQ Section */}
      <Box bg="gray.50" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading as="h2" size="xl" textAlign="center">Frequently Asked Questions</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Box>
                <Heading size="md" mb={3}>How much does it cost to use the platform?</Heading>
                <Text>
                  For clients, browsing and creating party requests is completely free. You only pay for the services you book.
                  For providers, registration is free. A small commission fee applies only when a booking is confirmed.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>How are service providers verified?</Heading>
                <Text>
                  We verify business information, insurance coverage, and check reviews from previous clients.
                  Only providers who meet our quality standards are approved.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>Is my payment secure?</Heading>
                <Text>
                  Yes, all payments are processed through our secure platform. Funds are held in escrow until
                  services are completed to your satisfaction.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>What if I need to cancel?</Heading>
                <Text>
                  Each provider sets their own cancellation policy, which is clearly displayed before booking.
                  Our platform helps mediate any disputes according to these agreed terms.
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={3}>How do I contact a provider before booking?</Heading>
                <Text>
                  You can message providers directly through our platform once they've sent you an offer
                  or you've expressed interest in their services.
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
      </Box>
      
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