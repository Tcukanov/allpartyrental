"use client";

import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, Image, Button, useColorModeValue, Center, Icon, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Avatar, Stack, Flex, Divider } from '@chakra-ui/react';
import LocationServiceSearch from '@/components/search/LocationServiceSearch';
import Link from 'next/link';
import { FiSearch, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useState, useEffect, useCallback } from 'react';

export default function HomeContent() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue('gray.50', 'gray.900');

  // Testimonial slideshow state
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      location: "Los Angeles, CA",
      text: "AllPartyRent made my daughter's birthday party a breeze! Found an amazing bounce house and catering all in one place. The vendors were professional and everything was set up perfectly.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      id: 2,
      name: "Michael Thomas",
      location: "New York, NY",
      text: "I was skeptical about booking party services online, but AllPartyRent exceeded my expectations. The decorations were stunning and matched exactly what we asked for. Will definitely use again!",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      location: "Miami, FL",
      text: "We found the perfect entertainers for our son's birthday through AllPartyRent. The booking process was simple and the kids had an absolute blast! Saved us so much time compared to calling vendors individually.",
      avatar: "https://randomuser.me/api/portraits/women/63.jpg"
    }
  ];

  const photos = [
    "https://images.unsplash.com/photo-1562967005-a3c85514d3e9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?q=80&w=2848&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  ];
  
  const [currentPhoto, setCurrentPhoto] = useState(0);
  
  // Auto transition for testimonials and photos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setCurrentPhoto((prev) => (prev + 1) % photos.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [testimonials.length, photos.length]);

  return (
    <Box>
      {/* Hero Section with Gradient Background */}
      <Box 
        bg="#fdf9ed" 
        position="relative"
        py={16}
        overflow="hidden"
      >
        {/* Background Elements */}
        <Box 
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.05"
          bgImage="url('data:image/svg+xml;charset=utf-8,%3Csvg width=%27100%27 height=%27100%27 viewBox=%270 0 100 100%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z%27 fill=%27%23000000%27 fill-opacity=%270.4%27 fill-rule=%27evenodd%27/%3E%3C/svg%3E')"
          zIndex="0"
        />

        <Container maxW="container.xl" position="relative" zIndex="1">
          <VStack spacing={8} align="center">
            <Box textAlign="center" maxW="800px">
              <Heading 
                as="h1" 
                size="2xl" 
                mb={6} 
                color="gray.800"
              >
                Find Party Services in Your Area
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.600" 
                mb={8}
              >
                Discover and book the best party services in your location. From bounce houses to catering, we've got everything you need for your next celebration.
              </Text>
              
              <Box 
                bg="white" 
                p={6} 
                borderRadius="xl" 
                boxShadow="xl"
                _dark={{ bg: 'gray.800' }}
                mb={6}
              >
                <LocationServiceSearch />
              </Box>
              
              <Box w="full" mt={4} position="relative">
                <Image
                  src="/images/back.png"
                  alt="Party decorations"
                  w="full"
                  h="auto"
                  objectFit="contain"
                />
              </Box>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Services Section with Subtle Pattern */}
      <Box 
        py={20} 
        bg="gray.50" 
        _dark={{ bg: 'gray.900' }}
        position="relative"
        overflow="hidden"
      >
        {/* Subtle background pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.4"
          bgImage="url('data:image/svg+xml;charset=utf-8,%3Csvg width=%2720%27 height=%2720%27 viewBox=%270 0 20 20%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z%27 fill=%27%23000%27 fill-opacity=%270.03%27 fill-rule=%27evenodd%27/%3E%3C/svg%3E')"
        />

        <Container maxW="container.xl" position="relative">
          <VStack spacing={12} align="center">
            <Heading 
              as="h2" 
              size="xl" 
              mb={8} 
              textAlign="center"
              position="relative"
              _after={{
                content: '""',
                width: '100px',
                height: '4px',
                background: 'brand.500',
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: 'full'
              }}
            >
              Popular Services
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
              <Card 
                bg={bgColor} 
                borderWidth="1px" 
                borderColor={borderColor} 
                overflow="hidden" 
                transition="transform 0.3s, box-shadow 0.3s"
                _hover={{
                  transform: "translateY(-5px)",
                  boxShadow: "xl",
                  borderColor: "brand.200"
                }}
              >
                <Box position="relative">
                  <Image
                    src="https://www.deluxebouncehouse.com/cdn/shop/products/white-bounce-house.jpg?v=1725278985"
                    alt="Bounce House"
                    height="200px"
                    objectFit="cover"
                    w="full"
                  />
                  <Box 
                    position="absolute" 
                    top="0" 
                    left="0" 
                    bg="brand.500" 
                    color="white" 
                    px={3} 
                    py={1}
                    borderBottomRightRadius="md"
                  >
                    Popular
                  </Box>
                </Box>
                <CardBody>
                  <Heading size="md" mb={2}>Bounce Houses</Heading>
                  <Text color="gray.600" mb={4}>
                    Find the perfect bounce house for your party. We offer a wide selection of sizes and themes.
                  </Text>
                  <Button as={Link} href="/new-york/bounce-houses" colorScheme="brand">
                    View in New York
                  </Button>
                </CardBody>
              </Card>

              <Card 
                bg={bgColor} 
                borderWidth="1px" 
                borderColor={borderColor}
                overflow="hidden"
                transition="transform 0.3s, box-shadow 0.3s"
                _hover={{
                  transform: "translateY(-5px)",
                  boxShadow: "xl",
                  borderColor: "brand.200"
                }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                  alt="Catering"
                  height="200px"
                  objectFit="cover"
                />
                <CardBody>
                  <Heading size="md" mb={2}>Catering</Heading>
                  <Text color="gray.600" mb={4}>
                    Professional catering services for all your party needs. From appetizers to full meals.
                  </Text>
                  <Button as={Link} href="/san-diego/catering" colorScheme="brand">
                    View in San Diego
                  </Button>
                </CardBody>
              </Card>

              <Card 
                bg={bgColor} 
                borderWidth="1px" 
                borderColor={borderColor}
                overflow="hidden"
                transition="transform 0.3s, box-shadow 0.3s"
                _hover={{
                  transform: "translateY(-5px)",
                  boxShadow: "xl",
                  borderColor: "brand.200"
                }}
              >
                <Image
                  src="https://res.cloudinary.com/luxuryp/images/f_auto,q_auto/ror2cjrfqay5lcozhk71/untitled-design-6"
                  alt="Decoration"
                  height="200px"
                  objectFit="cover"
                />
                <CardBody>
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
          </VStack>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box 
        py={24} 
        position="relative"
        overflow="hidden"
        bg="white"
        _dark={{ bg: 'gray.800' }}
      >
        {/* Background wave pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          height="100%"
          bgImage="url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1440 320%22%3E%3Cpath fill=%22%23f3f4f6%22 fill-opacity=%221%22 d=%22M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z%22%3E%3C/path%3E%3C/svg%3E')"
          bgRepeat="no-repeat"
          bgSize="cover"
          bgPosition="center"
          opacity="0.8"
          _dark={{ 
            filter: "invert(1) brightness(0.2)",
            opacity: "0.4"
          }}
        />
        
        <Container maxW="container.xl" position="relative">
          <Heading 
            as="h2" 
            size="xl" 
            mb={12} 
            textAlign="center"
            position="relative"
            _after={{
              content: '""',
              width: '100px',
              height: '4px',
              background: 'brand.500',
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: 'full'
            }}
          >
            How It Works
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={12} mt={8}>
            <Box 
              p={8} 
              borderRadius="xl" 
              boxShadow="lg" 
              bg="white" 
              _dark={{ bg: 'gray.700' }}
              transition="all 0.3s"
              _hover={{ 
                transform: 'translateY(-8px)',
                boxShadow: '2xl'
              }}
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '5px',
                bg: 'brand.500',
              }}
            >
              <Center 
                w={20} 
                h={20} 
                borderRadius="full" 
                bg="brand.500"
                color="white"
                mb={6}
                mx="auto"
              >
                <Icon as={FiSearch} boxSize={10} />
              </Center>
              <Heading as="h3" size="md" textAlign="center" mb={4}>All in One Place</Heading>
              <Text textAlign="center" fontSize="md" color="gray.600" _dark={{ color: 'gray.300' }}>
                Find everything you need in one place - from rentals to entertainers.
              </Text>
            </Box>
            
            <Box 
              p={8} 
              borderRadius="xl" 
              boxShadow="lg" 
              bg="white" 
              _dark={{ bg: 'gray.700' }}
              transition="all 0.3s"
              _hover={{ 
                transform: 'translateY(-8px)',
                boxShadow: '2xl'
              }}
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '5px',
                bg: 'brand.500',
              }}
            >
              <Center 
                w={20} 
                h={20} 
                borderRadius="full" 
                bg="brand.500"
                color="white"
                mb={6}
                mx="auto"
              >
                <Icon as={FiCheckCircle} boxSize={10} />
              </Center>
              <Heading as="h3" size="md" textAlign="center" mb={4}>Verified Local Vendors</Heading>
              <Text textAlign="center" fontSize="md" color="gray.600" _dark={{ color: 'gray.300' }}>
                Verified providers with reviews and safety checks.
              </Text>
            </Box>
            
            <Box 
              p={8} 
              borderRadius="xl" 
              boxShadow="lg" 
              bg="white" 
              _dark={{ bg: 'gray.700' }}
              transition="all 0.3s"
              _hover={{ 
                transform: 'translateY(-8px)',
                boxShadow: '2xl'
              }}
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '5px',
                bg: 'brand.500',
              }}
            >
              <Center 
                w={20} 
                h={20} 
                borderRadius="full" 
                bg="brand.500"
                color="white"
                mb={6}
                mx="auto"
              >
                <Icon as={FiClock} boxSize={10} />
              </Center>
              <Heading as="h3" size="md" textAlign="center" mb={4}>Fast & Easy</Heading>
              <Text textAlign="center" fontSize="md" color="gray.600" _dark={{ color: 'gray.300' }}>
                Book online in minutes. No back-and-forth quotes.
              </Text>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Custom Vision Section */}
      <Box 
        py={24} 
        bgGradient="linear(to-br, blue.50, purple.50)" 
        _dark={{ bgGradient: "linear(to-br, gray.900, purple.900)" }}
        position="relative"
        overflow="hidden"
      >
        {/* Abstract shapes background */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.2"
          bgImage="url('data:image/svg+xml;charset=utf-8,%3Csvg width=%27600%27 height=%27600%27 viewBox=%270 0 800 800%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Ccircle stroke=%27%23E2E8F0%27 stroke-width=%274%27 cx=%27400%27 cy=%27400%27 r=%27200%27/%3E%3Ccircle stroke=%27%23E2E8F0%27 stroke-width=%274%27 cx=%27400%27 cy=%27400%27 r=%27300%27/%3E%3Ccircle stroke=%27%23E2E8F0%27 stroke-width=%274%27 cx=%27400%27 cy=%27400%27 r=%27400%27/%3E%3C/g%3E%3C/svg%3E')"
          bgSize="cover"
          bgRepeat="no-repeat"
          bgPosition="center"
          _dark={{
            filter: "invert(1) brightness(0.2)"
          }}
        />

        <Container maxW="container.xl" position="relative">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10} alignItems="center" w="full">
            <Box>
              <Heading 
                as="h2" 
                size="xl" 
                mb={4}
                bgGradient="linear(to-r, brand.500, purple.500)"
                bgClip="text"
                _dark={{
                  bgGradient: "linear(to-r, brand.200, purple.200)",
                }}
              >
                Have a Special Vision in Mind?
              </Heading>
              <Text fontSize="lg" color="gray.600" _dark={{ color: 'gray.300' }} mb={8}>
                Looking for something unique and personalized? Upload your own pictures and let our service providers bring your vision to life.
              </Text>
              <Button
                as={Link}
                href="/client/create-party"
                size="lg"
                colorScheme="brand"
                px={8}
                py={7}
                boxShadow="md"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "lg"
                }}
              >
                Create Your Custom Party
              </Button>
            </Box>
            <Box>
              <Image
                src="/images/girl.png"
                alt="Girl with party vision"
                borderRadius="2xl"
                shadow="2xl"
                objectFit="contain"
                maxH="500px"
                width="100%"
                mx="auto"
                display="block"
                transform="rotate(2deg)"
              />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Testimonials & FAQ Section */}
      <Box 
        py={24} 
        bg="#fdf9ed"
        _dark={{ bg: "gray.900" }}
        position="relative"
        overflow="hidden"
        w="full"
      >
        {/* Stylized background elements */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.07"
          bgImage="url('data:image/svg+xml;charset=utf-8,%3Csvg width=%27100%27 height=%27100%27 viewBox=%270 0 100 100%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z%27 fill=%27%23ffffff%27 fill-rule=%27evenodd%27/%3E%3C/svg%3E')"
        />

        <Container maxW="container.xl" position="relative">
          <Heading 
            as="h2" 
            size="xl" 
            mb={12} 
            textAlign="center"
            color="gray.800"
            position="relative"
            _after={{
              content: '""',
              width: '100px',
              height: '4px',
              background: 'brand.500',
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: 'full',
              opacity: '0.7'
            }}
          >
            What Our Customers Say
          </Heading>
          
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {/* Photo Slideshow - Left Side */}
            <VStack spacing={6}>
              <Box 
                borderRadius="xl" 
                overflow="hidden"
                boxShadow="dark-lg"
                position="relative"
                h="400px"
                w="full"
                border="4px solid white"
                transform="rotate(-1deg)"
              >
                {photos.map((photo, index) => (
                  <Box
                    key={index}
                    position="absolute"
                    top="0"
                    left="0"
                    w="100%"
                    h="100%"
                    opacity={currentPhoto === index ? 1 : 0}
                    transition="opacity 1s ease-in-out"
                  >
                    <Image 
                      src={photo}
                      alt={`Customer party photo ${index + 1}`}
                      objectFit="cover"
                      w="full"
                      h="full"
                    />
                  </Box>
                ))}
                
                {/* Photo navigation dots */}
                <Flex 
                  position="absolute" 
                  bottom="4" 
                  width="100%" 
                  justify="center" 
                  zIndex="1"
                >
                  {photos.map((_, index) => (
                    <Box
                      key={index}
                      w="3"
                      h="3"
                      borderRadius="full"
                      bg={currentPhoto === index ? "brand.500" : "white"}
                      mx="1"
                      cursor="pointer"
                      onClick={() => setCurrentPhoto(index)}
                      opacity="0.8"
                      _hover={{ opacity: 1 }}
                    />
                  ))}
                </Flex>
              </Box>
            </VStack>
            
            {/* Testimonials - Right Side */}
            <Box
              position="relative"
              h="400px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="dark-lg"
              bg="white"
              transform="rotate(1deg)"
              _dark={{ bg: "gray.800" }}
            >
              {/* Background pattern */}
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                opacity="0.03"
                bgImage="url('data:image/svg+xml;charset=utf-8,%3Csvg width=%2730%27 height=%2730%27 viewBox=%270 0 30 30%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M15 0C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15zm0 2c7.18 0 13 5.82 13 13S22.18 28 15 28 2 22.18 2 15 7.82 2 15 2z%27 fill=%27%23000%27 fill-opacity=%271%27 fill-rule=%27evenodd%27/%3E%3C/svg%3E')"
              />
              
              {/* Testimonial content */}
              <VStack
                position="relative"
                justify="center"
                align="center"
                h="full"
                p={8}
                spacing={6}
              >
                <Icon 
                  viewBox="0 0 24 24" 
                  boxSize={10} 
                  color="brand.500"
                  opacity="0.8"
                  _dark={{ color: "brand.300" }}
                >
                  <path
                    fill="currentColor"
                    d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"
                  />
                </Icon>
                
                {testimonials.map((testimonial, index) => (
                  <Box
                    key={testimonial.id}
                    position="absolute"
                    opacity={currentTestimonial === index ? 1 : 0}
                    transform={`translateY(${currentTestimonial === index ? 0 : 20}px)`}
                    transition="all 0.5s ease"
                    p={8}
                    textAlign="center"
                  >
                    <Text 
                      fontSize="xl" 
                      fontStyle="italic" 
                      mb={6} 
                      fontWeight="medium"
                      color="gray.700"
                      _dark={{ color: "gray.200" }}
                    >
                      "{testimonial.text}"
                    </Text>
                    
                    <Flex direction="column" align="center">
                      <Avatar 
                        src={testimonial.avatar} 
                        name={testimonial.name} 
                        size="md" 
                        mb={2}
                        border="2px solid"
                        borderColor="brand.500"
                        _dark={{ borderColor: "brand.300" }}
                      />
                      <Text 
                        fontWeight="bold"
                        color="gray.800"
                        _dark={{ color: "white" }}
                      >
                        {testimonial.name}
                      </Text>
                      <Text 
                        fontSize="sm" 
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                      >
                        {testimonial.location}
                      </Text>
                    </Flex>
                  </Box>
                ))}
                
                {/* Testimonial navigation dots */}
                <Flex 
                  position="absolute" 
                  bottom="4" 
                  width="100%" 
                  justify="center"
                >
                  {testimonials.map((_, index) => (
                    <Box
                      key={index}
                      w="2"
                      h="2"
                      borderRadius="full"
                      bg={currentTestimonial === index ? "brand.500" : "gray.300"}
                      mx="1"
                      cursor="pointer"
                      onClick={() => setCurrentTestimonial(index)}
                      _dark={{
                        bg: currentTestimonial === index ? "brand.300" : "gray.600"
                      }}
                    />
                  ))}
                </Flex>
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box 
        py={20} 
        w="full" 
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
        position="relative"
        overflow="hidden"
      >
        {/* Background dots pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.4"
          bgImage="url('data:image/svg+xml;charset=utf-8,%3Csvg width=%2720%27 height=%2720%27 viewBox=%270 0 20 20%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27%23000%27 fill-opacity=%270.05%27 fill-rule=%27evenodd%27%3E%3Ccircle cx=%273%27 cy=%273%27 r=%273%27/%3E%3Ccircle cx=%2713%27 cy=%2713%27 r=%273%27/%3E%3C/g%3E%3C/svg%3E')"
        />
        
        <Container maxW="container.xl" position="relative">
          <Heading 
            as="h2" 
            size="xl" 
            mb={12}
            textAlign="center"
            position="relative"
            _after={{
              content: '""',
              width: '100px',
              height: '4px',
              background: 'brand.500',
              position: 'absolute',
              bottom: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: 'full'
            }}
          >
            Frequently Asked Questions
          </Heading>
          
          <Box 
            maxW="800px" 
            mx="auto"
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderRadius="xl"
            boxShadow="lg"
            overflow="hidden"
          >
            <Accordion allowToggle borderColor={borderColor}>
              <AccordionItem>
                <h2>
                  <AccordionButton py={4}>
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      How does AllPartyRent work?
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  AllPartyRent is a marketplace that connects party planners with local service providers. 
                  Browse services by location, book directly through our platform, and pay securely online. 
                  We verify all vendors to ensure quality service for your event.
                </AccordionPanel>
              </AccordionItem>
              
              <AccordionItem>
                <h2>
                  <AccordionButton py={4}>
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      Can I cancel or modify my booking?
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  Yes, you can modify or cancel your booking through your account dashboard. 
                  Cancellation policies vary by vendor, but most allow free cancellation up to 48 hours 
                  before your event. Check the specific terms when booking.
                </AccordionPanel>
              </AccordionItem>
              
              <AccordionItem>
                <h2>
                  <AccordionButton py={4}>
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      Are the vendors insured?
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  All vendors on our platform are required to have appropriate insurance coverage. 
                  For bounce houses and other equipment rentals, vendors must meet safety standards 
                  and have liability insurance. You can request insurance verification directly from vendors.
                </AccordionPanel>
              </AccordionItem>
              
              <AccordionItem>
                <h2>
                  <AccordionButton py={4}>
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      How far in advance should I book?
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  We recommend booking at least 2-3 weeks in advance, especially for weekend events 
                  or during peak season (summer months and holidays). Some popular vendors may require 
                  even earlier booking. Last-minute bookings are possible but selection may be limited.
                </AccordionPanel>
              </AccordionItem>
              
              <AccordionItem>
                <h2>
                  <AccordionButton py={4}>
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      What if something goes wrong with my booking?
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  Our customer support team is available to help resolve any issues. We offer a satisfaction 
                  guarantee and can assist with vendor communication, rescheduling, or refunds if services 
                  don't meet expectations. Contact us immediately if you encounter any problems.
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
          
          <Box mt={12} textAlign="center">
            <Text mb={4} fontSize="lg">Still have questions?</Text>
            <Button 
              as={Link} 
              href="/contact" 
              colorScheme="brand" 
              size="lg"
              boxShadow="md"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "lg"
              }}
            >
              Contact Us
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 