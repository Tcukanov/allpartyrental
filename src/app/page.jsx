"use client";

import { Box, Container, Heading, Text, Button, SimpleGrid, Image, Flex, Input, InputGroup, InputLeftElement, Select, HStack, VStack, Card, CardBody, Badge, useBreakpointValue } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Mock data for service categories
const serviceCategories = [
  { id: 1, name: 'Decoration', icon: '🎨', description: 'Make your party look amazing' },
  { id: 2, name: 'Catering', icon: '🍽️', description: 'Delicious food for your guests' },
  { id: 3, name: 'Entertainment', icon: '🎭', description: 'Keep your guests entertained' },
  { id: 4, name: 'Venues', icon: '🏛️', description: 'Find the perfect location' },
  { id: 5, name: 'Photography', icon: '📸', description: 'Capture your special moments' },
  { id: 6, name: 'Music', icon: '🎵', description: 'Set the mood with great music' },
  { id: 7, name: 'Bounce Houses', icon: '🏠', description: 'Fun for the kids' },
  { id: 8, name: 'Party Supplies', icon: '🎁', description: 'Everything you need for your party' }
];

// Mock data for best services
const bestServices = [
  { 
    id: 1, 
    name: 'Premium Decorations', 
    provider: 'Elegant Events', 
    rating: 4.9, 
    price: 250, 
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: true,
    isBestValue: false,
    isRecommended: true
  },
  { 
    id: 2, 
    name: 'Gourmet Catering', 
    provider: 'Taste Masters', 
    rating: 4.8, 
    price: 350, 
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: false,
    isBestValue: true,
    isRecommended: false
  },
  { 
    id: 3, 
    name: 'Live Band', 
    provider: 'Rhythm Kings', 
    rating: 4.7, 
    price: 400, 
    image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: false,
    isBestValue: false,
    isRecommended: false
  },
  { 
    id: 4, 
    name: 'Bounce House Rentals', 
    provider: 'Jump Around', 
    rating: 4.9, 
    price: 150, 
    image: 'https://images.unsplash.com/photo-1573982680571-f6e9a8a5850b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: true,
    isBestValue: false,
    isRecommended: false
  },
  { 
    id: 5, 
    name: 'Professional Photography', 
    provider: 'Capture Moments', 
    rating: 4.8, 
    price: 300, 
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: false,
    isBestValue: false,
    isRecommended: true
  }
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/services?search=${searchQuery}&category=${selectedCategory}&location=${selectedLocation}`);
  };
  
  const handleOrganizeParty = () => {
    router.push('/client/create-party');
  };
  
  const cardsPerRow = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 });
  
  return (
    <MainLayout>
      {/* Hero Section */}
      <Box 
        bg="brand.700" 
        color="white" 
        py={{ base: 12, md: 20 }} 
        px={4}
        backgroundImage="url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')"
        backgroundSize="cover"
        backgroundPosition="center"
        position="relative"
      >
        <Box 
          position="absolute" 
          top={0} 
          left={0} 
          right={0} 
          bottom={0} 
          bg="rgba(0, 0, 0, 0.6)" 
        />
        
        <Container maxW="1200px" position="relative" zIndex={1}>
          <Flex direction="column" align={{ base: "center", md: "flex-start" }} textAlign={{ base: "center", md: "left" }}>
            <Heading 
              as="h1" 
              size="2xl" 
              mb={4}
              fontWeight="bold"
            >
              Plan Your Perfect Party
            </Heading>
            <Text fontSize="xl" mb={8} maxW="600px">
              Connect with the best service providers for your next event. From decorations to entertainment, find everything you need in one place.
            </Text>
            <Button 
              size="lg" 
              colorScheme="brand" 
              onClick={handleOrganizeParty}
              mb={{ base: 8, md: 0 }}
            >
              Organize My Party!
            </Button>
          </Flex>
        </Container>
      </Box>
      
      {/* Search & Filter Section */}
      <Box bg="white" py={8} shadow="md">
        <Container maxW="1200px">
          <form onSubmit={handleSearch}>
            <Flex 
              direction={{ base: "column", md: "row" }} 
              gap={4}
              align="center"
            >
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search for services..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              
              <Select 
                placeholder="All Categories" 
                w={{ base: "full", md: "200px" }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {serviceCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
              
              <Select 
                placeholder="Location" 
                w={{ base: "full", md: "200px" }}
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="new-york">New York</option>
                <option value="los-angeles">Los Angeles</option>
                <option value="chicago">Chicago</option>
                <option value="houston">Houston</option>
                <option value="miami">Miami</option>
              </Select>
              
              <Button type="submit" colorScheme="brand" w={{ base: "full", md: "auto" }}>
                Search
              </Button>
            </Flex>
          </form>
        </Container>
      </Box>
      
      {/* Service Categories Section */}
      <Box py={12} bg="gray.50">
        <Container maxW="1200px">
          <Heading as="h2" size="xl" mb={2} textAlign="center">
            Service Categories
          </Heading>
          <Text textAlign="center" mb={10} color="gray.600">
            Browse services by category to find exactly what you need
          </Text>
          
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={8}>
            {serviceCategories.map(category => (
              <Link key={category.id} href={`/services?category=${category.id}`} passHref>
                <Card 
                  h="100%"
                  _hover={{ 
                    transform: 'translateY(-5px)', 
                    transition: 'transform 0.3s ease',
                    shadow: 'md'
                  }}
                  transition="transform 0.3s ease"
                  cursor="pointer"
                >
                  <CardBody>
                    <VStack spacing={3} align="center" textAlign="center">
                      <Text fontSize="4xl">{category.icon}</Text>
                      <Heading size="md">{category.name}</Heading>
                      <Text color="gray.600" fontSize="sm">{category.description}</Text>
                    </VStack>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </SimpleGrid>
        </Container>
      </Box>
      
      {/* Best in Your Location Section */}
      <Box py={12}>
        <Container maxW="1200px">
          <Flex justify="space-between" align="center" mb={10} direction={{ base: "column", md: "row" }}>
            <Box mb={{ base: 4, md: 0 }}>
              <Heading as="h2" size="xl" mb={2}>
                Best in New York
              </Heading>
              <Text color="gray.600">
                Top-rated services in your area
              </Text>
            </Box>
            <Link href="/services" passHref>
              <Button variant="outline" colorScheme="brand">
                View All Services
              </Button>
            </Link>
          </Flex>
          
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {bestServices.map(service => (
              <Link key={service.id} href={`/services/${service.id}`} passHref>
                <Card 
                  overflow="hidden" 
                  h="100%"
                  _hover={{ 
                    transform: 'translateY(-5px)', 
                    transition: 'transform 0.3s ease',
                    shadow: 'md'
                  }}
                  transition="transform 0.3s ease"
                  cursor="pointer"
                  borderWidth={service.isSponsored ? "2px" : "1px"}
                  borderColor={service.isSponsored ? "brand.500" : "gray.200"}
                >
                  <Box position="relative">
                    <Image 
                      src={service.image} 
                      alt={service.name} 
                      h="160px" 
                      w="100%" 
                      objectFit="cover"
                    />
                    <Flex position="absolute" top={2} left={2} gap={2}>
                      {service.isSponsored && (
                        <Badge colorScheme="brand" variant="solid">
                          Featured
                        </Badge>
                      )}
                      {service.isBestValue && (
                        <Badge colorScheme="green" variant="solid">
                          Best Value
                        </Badge>
                      )}
                      {service.isRecommended && (
                        <Badge colorScheme="purple" variant="solid">
                          Recommended
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                  
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Heading size="md" noOfLines={1}>{service.name}</Heading>
                      <Text color="gray.600" fontSize="sm">by {service.provider}</Text>
                      <Flex justify="space-between" w="100%" mt={2}>
                        <Text fontWeight="bold" color="brand.600">
                          ${service.price}
                        </Text>
                        <Flex align="center">
                          <Text color="orange.500" mr={1}>★</Text>
                          <Text>{service.rating}</Text>
                        </Flex>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </SimpleGrid>
        </Container>
      </Box>
      
      {/* How It Works Section */}
      <Box py={12} bg="gray.50">
        <Container maxW="1200px">
          <Heading as="h2" size="xl" mb={2} textAlign="center">
            How It Works
          </Heading>
          <Text textAlign="center" mb={10} color="gray.600">
            Plan your perfect party in just a few simple steps
          </Text>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
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
              <Text color="gray.600">
                Tell us about your event, select the services you need, and set your budget.
              </Text>
            </VStack>
            
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
              <Text color="gray.600">
                Service providers in your area will send you personalized offers for your event.
              </Text>
            </VStack>
            
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
              <Heading size="md">Book & Enjoy</Heading>
              <Text color="gray.600">
                Choose the best offers, make secure payments, and enjoy your perfectly planned party.
              </Text>
            </VStack>
          </SimpleGrid>
          
          <Flex justify="center" mt={12}>
            <Button size="lg" colorScheme="brand" onClick={handleOrganizeParty}>
              Start Planning Now
            </Button>
          </Flex>
        </Container>
      </Box>
      
      {/* Testimonials Section */}
      <Box py={12}>
        <Container maxW="1200px">
          <Heading as="h2" size="xl" mb={2} textAlign="center">
            What Our Customers Say
          </Heading>
          <Text textAlign="center" mb={10} color="gray.600">
            Join thousands of satisfied customers who found the perfect services for their events
          </Text>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <Card>
              <CardBody>
                <VStack spacing={4} align="start">
                  <Text fontSize="lg" fontStyle="italic">
                    "I found the perfect decorations for my daughter's birthday party. The process was so easy, and the service provider was amazing!"
                  </Text>
                  <Flex align="center">
                    <Text color="orange.500" mr={1}>★★★★★</Text>
                  </Flex>
                  <Text fontWeight="bold">Sarah Johnson</Text>
                  <Text color="gray.600" fontSize="sm">New York, NY</Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <VStack spacing={4} align="start">
                  <Text fontSize="lg" fontStyle="italic">
                    "The catering service I found through this platform exceeded all my expectations. My guests couldn't stop raving about the food!"
                  </Text>
                  <Flex align="center">
                    <Text color="orange.500" mr={1}>★★★★★</Text>
                  </F<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>