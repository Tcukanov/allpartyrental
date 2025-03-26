"use client";

import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, Image, Button, useColorModeValue } from '@chakra-ui/react';
import LocationServiceSearch from '@/components/search/LocationServiceSearch';
import Link from 'next/link';

export default function HomeContent() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box bg={bgGradient} py={20}>
      <Container maxW="container.xl">
        <VStack spacing={12} align="center">
          <Box textAlign="center" maxW="800px">
            <Heading as="h1" size="2xl" mb={6}>
              Find Party Services in Your Area
            </Heading>
            <Text fontSize="xl" color="gray.600" mb={8}>
              Discover and book the best party services in your location. From bounce houses to catering, we've got everything you need for your next celebration.
            </Text>
            
            <LocationServiceSearch />
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
            <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Image
                  src="https://www.deluxebouncehouse.com/cdn/shop/products/white-bounce-house.jpg?v=1725278985"
                  alt="Bounce House"
                  borderRadius="md"
                  mb={4}
                  height="200px"
                  objectFit="cover"
                />
                <Heading size="md" mb={2}>Bounce Houses</Heading>
                <Text color="gray.600" mb={4}>
                  Find the perfect bounce house for your party. We offer a wide selection of sizes and themes.
                </Text>
                <Button as={Link} href="/new-york/bounce-houses" colorScheme="brand">
                  View in New York
                </Button>
              </CardBody>
            </Card>

            <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Image
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                  alt="Catering"
                  borderRadius="md"
                  mb={4}
                  height="200px"
                  objectFit="cover"
                />
                <Heading size="md" mb={2}>Catering</Heading>
                <Text color="gray.600" mb={4}>
                  Professional catering services for all your party needs. From appetizers to full meals.
                </Text>
                <Button as={Link} href="/san-diego/catering" colorScheme="brand">
                  View in San Diego
                </Button>
              </CardBody>
            </Card>

            <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Image
                  src="https://res.cloudinary.com/luxuryp/images/f_auto,q_auto/ror2cjrfqay5lcozhk71/untitled-design-6"
                  alt="Decoration"
                  borderRadius="md"
                  mb={4}
                  height="200px"
                  objectFit="cover"
                />
                <Heading size="md" mb={2}>Decoration</Heading>
                <Text color="gray.600" mb={4}>
                  Transform your venue with our professional decoration services. Custom themes available.
                </Text>
                <Button as={Link} href="/los-angeles/decoration" colorScheme="brand">
                  View in Los Angeles
                </Button>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Custom Vision Section */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10} alignItems="center" w="full">
            <Box>
              <Heading as="h2" size="xl" mb={4}>
                Have a Special Vision in Mind?
              </Heading>
              <Text fontSize="lg" color="gray.600" mb={8}>
                Looking for something unique and personalized? Upload your own pictures and let our service providers bring your vision to life.
              </Text>
              <Button
                as={Link}
                href="/client/create-party"
                size="lg"
                colorScheme="brand"
                px={8}
                py={7}
              >
                Create Your Custom Party
              </Button>
            </Box>
            <Box>
              <Image
                src="/images/girl.png"
                alt="Girl with party vision"
                borderRadius="lg"
                shadow="xl"
                objectFit="contain"
                maxH="500px"
                width="100%"
                mx="auto"
                display="block"
              />
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
} 