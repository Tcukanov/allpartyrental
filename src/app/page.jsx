"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Image,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  VStack,
  Card,
  CardBody,
  Badge,
  useBreakpointValue,
  useColorModeValue,
  Icon,
  Divider
} from '@chakra-ui/react';
import { SearchIcon, StarIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { FaCheck, FaMagic, FaGem } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '@/components/layout/MainLayout';

// Mock data for service categories
const serviceCategories = [
  { id: '1', name: 'Decoration', icon: '🎨', description: 'Make your party look amazing' },
  { id: '2', name: 'Catering', icon: '🍽️', description: 'Delicious food for your guests' },
  { id: '3', name: 'Entertainment', icon: '🎭', description: 'Keep your guests entertained' },
  { id: '4', name: 'Venues', icon: '🏛️', description: 'Find the perfect location' },
  { id: '5', name: 'Photography', icon: '📸', description: 'Capture your special moments' },
  { id: '6', name: 'Music', icon: '🎵', description: 'Set the mood with great music' },
  { id: '7', name: 'Bounce Houses', icon: '🏠', description: 'Fun for the kids' },
  { id: '8', name: 'Party Supplies', icon: '🎁', description: 'Everything you need for your party' }
];

// Mock data for popular services
const popularServices = [
  { 
    id: '4',
    name: 'Standard Bounce House',
    provider: 'Jump Around',
    rating: 4.9,
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1573982680571-f6e9a8a5850b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: false,
    isBestValue: true,
    isRecommended: false
  },
  { 
    id: '5',
    name: 'Water Slide Rental',
    provider: 'Jump Around',
    rating: 4.8,
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1558181409-4fa124ccbda4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: true,
    isBestValue: false,
    isRecommended: false
  },
  { 
    id: '6',
    name: 'Combo Bounce House',
    provider: 'Party Rentals',
    rating: 4.7,
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1663486630748-d6cb7fda0fe8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: false,
    isBestValue: false,
    isRecommended: true
  },
  { 
    id: '1',
    name: 'Premium Decorations',
    provider: 'Elegant Events',
    rating: 4.9,
    price: 250.00,
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    isSponsored: true,
    isBestValue: false,
    isRecommended: true
  }
];

// Testimonials data
const testimonials = [
  {
    name: "Sarah Johnson",
    location: "New York, NY",
    quote: "I found the perfect decorations for my daughter's birthday party. The process was so easy, and the service provider was amazing!",
    rating: 5,
    image: "https://randomuser.me/api/portraits/women/1.jpg"
  },
  {
    name: "Michael Brown",
    location: "Chicago, IL",
    quote: "The catering service I found through this platform exceeded all my expectations. My guests couldn't stop raving about the food!",
    rating: 5,
    image: "https://randomuser.me/api/portraits/men/2.jpg"
  },
  {
    name: "Jennifer Davis",
    location: "Los Angeles, CA",
    quote: "I was able to plan my entire anniversary party in just a few hours. The payment system was secure and the providers were professional.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/women/3.jpg"
  }
];

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [cities, setCities] = useState([
    { id: 'new-york', name: 'New York' },
    { id: 'los-angeles', name: 'Los Angeles' },
    { id: 'chicago', name: 'Chicago' },
    { id: 'houston', name: 'Houston' },
    { id: 'miami', name: 'Miami' }
  ]);
  
  // Fetch cities from API on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setCities(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    
    fetchCities();
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/services?search=${searchQuery}&category=${selectedCategory}&city=${selectedLocation}`);
  };
  
  const handleOrganizeParty = () => {
    if (session) {
      router.push('/client/create-party');
    } else {
      router.push('/auth/signin?callbackUrl=/client/create-party');
    }
  };
  
  const handleCategoryClick = (categoryId) => {
    router.push(`/services/categories/${categoryId}`);
  };
  
  const cardsPerRow = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 });
  const bgGradient = useColorModeValue(
    'linear(to-b, brand.50, white)',
    'linear(to-b, gray.900, gray.800)'
  );
  
  return (
    <MainLayout>
      {/* Hero Section with Full-Width Background */}
      <Box 
        position="relative"
        h={{ base: "90vh", md: "80vh" }}
        w="100%"
        overflow="hidden"
      >
        {/* Background Image with Overlay */}
        <Box
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          bgImage="url('https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')"
          bgPosition="center"
          bgRepeat="no-repeat"
          bgSize="cover"
          zIndex={-1}
        />
        <Box 
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          bg="rgba(0, 0, 0, 0.6)"
          zIndex={-1}
        />
        
        {/* Hero Content */}
        <Container maxW="container.xl" h="100%">
          <Flex 
            direction="column" 
            align={{ base: "center", md: "flex-start" }} 
            justify="center"
            textAlign={{ base: "center", md: "left" }} 
            h="100%"
            color="white"
            position="relative"
          >
            <Box maxW={{ base: "100%", md: "60%" }}>
              <Heading 
                as="h1" 
                size="2xl" 
                fontWeight="bold"
                lineHeight="shorter"
                mb={4}
              >
                Make Your Next Event Unforgettable
              </Heading>
              
              <Text fontSize="xl" mb={8} lineHeight="tall">
                Connect with top-rated service providers for parties and events.
                From decorations to entertainment, find everything you need in one place.
              </Text>
              
              <Button 
                size="lg" 
                colorScheme="brand" 
                onClick={handleOrganizeParty}
                mb={{ base: 12, md: 0 }}
                rightIcon={<ArrowForwardIcon />}
                fontSize="md"
                px={8}
                py={6}
              >
                Plan Your Party
              </Button>
            </Box>
          </Flex>
        </Container>
      </Box>
      
      {/* Search & Filter Section */}
      <Box bg={useColorModeValue('white', 'gray.800')} py={8} shadow="lg" mt={{ base: "-12", md: "-20" }} borderRadius="xl" mx={4}>
        <Container maxW="container.xl">
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
                  placeholder="What are you looking for?" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={useColorModeValue('white', 'gray.700')}
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                  _hover={{ borderColor: 'brand.400' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                />
              </InputGroup>
              
              <Select 
                placeholder="All Categories" 
                w={{ base: "full", md: "200px" }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                bg={useColorModeValue('white', 'gray.700')}
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                _hover={{ borderColor: 'brand.400' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
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
                bg={useColorModeValue('white', 'gray.700')}
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                _hover={{ borderColor: 'brand.400' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
              >
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </Select>
              
              <Button 
                type="submit" 
                colorScheme="brand" 
                w={{ base: "full", md: "auto" }}
                px={8}
              >
                Search
              </Button>
            </Flex>
          </form>
        </Container>
      </Box>
      
      {/* Service Categories Section */}
      <Box py={16} bg={bgGradient}>
        <Container maxW="container.xl">
          <Heading as="h2" size="xl" mb={3} textAlign="center">
            Find the Perfect Services
          </Heading>
          <Text textAlign="center" mb={12} color={useColorModeValue('gray.600', 'gray.400')} maxW="700px" mx="auto" fontSize="lg">
            Explore a wide range of services for your next event, from decorations to entertainment
          </Text>
          
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 4, md: 8 }}>
            {serviceCategories.map(category => (
              <Card 
                key={category.id} 
                h="100%"
                _hover={{ 
                  transform: 'translateY(-8px)', 
                  transition: 'transform 0.3s ease',
                  shadow: 'lg'
                }}
                transition="transform 0.3s ease"
                cursor="pointer"
                onClick={() => handleCategoryClick(category.id)}
                bg={useColorModeValue('white', 'gray.700')}
                border="1px solid"
                borderColor={useColorModeValue('gray.100', 'gray.600')}
                overflow="hidden"
              >
                <CardBody>
                  <VStack spacing={4} align="center" textAlign="center">
                    <Flex
                      justify="center"
                      align="center"
                      w="60px"
                      h="60px"
                      bg={useColorModeValue('brand.50', 'brand.900')}
                      color={useColorModeValue('brand.500', 'brand.200')}
                      borderRadius="xl"
                      fontSize="2xl"
                    >
                      {category.icon}
                    </Flex>
                    <Heading size="md" fontWeight="bold">{category.name}</Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm">
                      {category.description}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
          
          <Flex justify="center" mt={12}>
            <Button 
              as={Link}
              href="/services" 
              variant="outline" 
              colorScheme="brand"
              rightIcon={<ArrowForwardIcon />}
              size="lg"
            >
              View All Services
            </Button>
          </Flex>
        </Container>
      </Box>
      
      {/* Popular Services Section */}
      <Box py={16} bg={useColorModeValue('white', 'gray.800')}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" mb={12} direction={{ base: "column", md: "row" }}>
            <Box mb={{ base: 4, md: 0 }} textAlign={{ base: "center", md: "left" }}>
              <Heading as="h2" size="xl" mb={3}>
                Popular Services
              </Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')} maxW="500px">
                Highly rated services that our customers love
              </Text>
            </Box>
            <Button 
              as={Link}
              href="/services" 
              variant="ghost" 
              colorScheme="brand"
              rightIcon={<ArrowForwardIcon />}
            >
              Browse All Services
            </Button>
          </Flex>
          
          <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 4 }} spacing={8}>
            {popularServices.map(service => (
              <Card 
                key={service.id} 
                as={Link}
                href={`/services/${service.id}`}
                overflow="hidden" 
                h="100%"
                _hover={{ 
                  transform: 'translateY(-8px)', 
                  transition: 'transform 0.3s ease',
                  shadow: 'lg'
                }}
                transition="transform 0.3s ease, border-color 0.3s ease"
                cursor="pointer"
                borderWidth="1px"
                borderColor={service.isSponsored ? "brand.400" : useColorModeValue('gray.100', 'gray.700')}
                borderRadius="lg"
              >
                <Box position="relative">
                  <Image 
                    src={service.image} 
                    alt={service.name} 
                    h="200px" 
                    w="100%" 
                    objectFit="cover"
                  />
                  <Flex position="absolute" top={2} left={2} gap={2}>
                    {service.isSponsored && (
                      <Badge colorScheme="brand" variant="solid" fontSize="xs" px={2} py={1} borderRadius="full">
                        Featured
                      </Badge>
                    )}
                    {service.isBestValue && (
                      <Badge colorScheme="green" variant="solid" fontSize="xs" px={2} py={1} borderRadius="full">
                        Best Value
                      </Badge>
                    )}
                    {service.isRecommended && (
                      <Badge colorScheme="purple" variant="solid" fontSize="xs" px={2} py={1} borderRadius="full">
                        Recommended
                      </Badge>
                    )}
                  </Flex>
                </Box>
                
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <Heading size="md" noOfLines={1}>{service.name}</Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">by {service.provider}</Text>
                    <Flex justify="space-between" w="100%" mt={2}>
                      <Text fontWeight="bold" color="brand.500" fontSize="lg">
                        ${service.price.toFixed(2)}
                      </Text>
                      <Flex align="center">
                        <StarIcon color="yellow.400" mr={1} boxSize={4} />
                        <Text fontWeight="medium">{service.rating}</Text>
                      </Flex>
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>
      
      {/* How It Works Section */}
      <Box py={16} bg={useColorModeValue('gray.50', 'gray.900')}>
        <Container maxW="container.xl">
          <Heading as="h2" size="xl" mb={3} textAlign="center">
            How It Works
          </Heading>
          <Text textAlign="center" mb={16} color={useColorModeValue('gray.600', 'gray.400')} maxW="700px" mx="auto" fontSize="lg">
            Plan your perfect party in just a few simple steps
          </Text>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <VStack spacing={6} align="center" textAlign="center">
              <Flex 
                w="80px" 
                h="80px" 
                bg={useColorModeValue('brand.500', 'brand.400')}
                color="white" 
                rounded="full" 
                justify="center" 
                align="center"
                fontSize="3xl"
                fontWeight="bold"
                boxShadow="lg"
              >
                1
              </Flex>
              <Heading size="md">Create Your Party</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Tell us about your event, select the services you need, and set your budget using our easy party configurator.
              </Text>
            </VStack>
            
            <VStack spacing={6} align="center" textAlign="center">
              <Flex 
                w="80px" 
                h="80px" 
                bg={useColorModeValue('brand.500', 'brand.400')}
                color="white" 
                rounded="full" 
                justify="center" 
                align="center"
                fontSize="3xl"
                fontWeight="bold"
                boxShadow="lg"
              >
                2
              </Flex>
              <Heading size="md">Receive Offers</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Service providers in your area will send you personalized offers based on your specific requirements.
              </Text>
            </VStack>
            
            <VStack spacing={6} align="center" textAlign="center">
              <Flex 
                w="80px" 
                h="80px" 
                bg={useColorModeValue('brand.500', 'brand.400')}
                color="white" 
                rounded="full" 
                justify="center" 
                align="center"
                fontSize="3xl"
                fontWeight="bold"
                boxShadow="lg"
              >
                3
              </Flex>
              <Heading size="md">Book & Enjoy</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Choose the best offers, make secure payments through our escrow system, and enjoy your perfectly planned party.
              </Text>
            </VStack>
          </SimpleGrid>
          
          <Flex justify="center" mt={16}>
            <Button 
              size="lg" 
              colorScheme="brand" 
              onClick={handleOrganizeParty}
              rightIcon={<ArrowForwardIcon />}
              px={8}
              py={7}
              fontSize="md"
              boxShadow="md"
            >
              Start Planning Now
            </Button>
          </Flex>
        </Container>
      </Box>
      
      {/* Testimonials Section */}
      <Box py={16} bg={useColorModeValue('white', 'gray.800')}>
        <Container maxW="container.xl">
          <Heading as="h2" size="xl" mb={3} textAlign="center">
            What Our Customers Say
          </Heading>
          <Text textAlign="center" mb={12} color={useColorModeValue('gray.600', 'gray.400')} maxW="700px" mx="auto" fontSize="lg">
            Join thousands of satisfied customers who found the perfect services for their events
          </Text>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {testimonials.map((testimonial, index) => (
              <Card key={index} boxShadow="lg" borderRadius="lg" h="100%">
                <CardBody>
                  <VStack spacing={6} align="start">
                    <Flex>
                      {Array(5).fill('').map((_, i) => (
                        <StarIcon
                          key={i}
                          color={i < testimonial.rating ? 'yellow.400' : 'gray.300'}
                          mr={1}
                        />
                      ))}
                    </Flex>
                    
                    <Text fontSize="lg" fontStyle="italic">
                      "{testimonial.quote}"
                    </Text>
                    
                    <Flex mt={4} align="center">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        borderRadius="full"
                        boxSize="50px"
                        mr={4}
                      />
                      <Box>
                        <Text fontWeight="bold">{testimonial.name}</Text>
                        <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">{testimonial.location}</Text>
                      </Box>
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>
      
      {/* Features Section */}
      <Box py={16} bg={useColorModeValue('gray.50', 'gray.900')}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12} alignItems="center">
            <Box>
              <Heading as="h2" size="xl" mb={6}>
                Why Choose Party Marketplace
              </Heading>
              
              <VStack spacing={8} align="start">
                <HStack align="start" spacing={4}>
                  <Flex
                    minW="50px"
                    h="50px"
                    bg={useColorModeValue('brand.50', 'brand.900')}
                    color={useColorModeValue('brand.500', 'brand.200')}
                    borderRadius="lg"
                    justify="center"
                    align="center"
                  >
                    <Icon as={FaCheck} boxSize={5} />
                  </Flex>
                  <Box>
                    <Heading size="md" mb={2}>Verified Service Providers</Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                      All service providers are thoroughly verified to ensure quality and reliability. We check references, licenses, and insurance.
                    </Text>
                  </Box>
                </HStack>
                
                <HStack align="start" spacing={4}>
                  <Flex
                    minW="50px"
                    h="50px"
                    bg={useColorModeValue('brand.50', 'brand.900')}
                    color={useColorModeValue('brand.500', 'brand.200')}
                    borderRadius="lg"
                    justify="center"
                    align="center"
                  >
                    <Icon as={FaMagic} boxSize={5} />
                  </Flex>
                  <Box>
                    <Heading size="md" mb={2}>Easy Party Planning</Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                      Our intuitive drag-and-drop party configurator makes it easy to design your perfect event without the stress.
                    </Text>
                  </Box>
                </HStack>
                
                <HStack align="start" spacing={4}>
                  <Flex
                    minW="50px"
                    h="50px"
                    bg={useColorModeValue('brand.50', 'brand.900')}
                    color={useColorModeValue('brand.500', 'brand.200')}
                    borderRadius="lg"
                    justify="center"
                    align="center"
                  >
                    <Icon as={FaGem} boxSize={5} />
                  </Flex>
                  <Box>
                    <Heading size="md" mb={2}>Secure Payments</Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                      Our escrow payment system ensures your money is protected until services are delivered to your satisfaction.
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>
            
            <Box>
              <Image 
                src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                alt="Party planning made easy" 
                borderRadius="lg"
                shadow="2xl"
              />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>
      
      {/* CTA Section */}
      <Box 
        py={20} 
        bg={useColorModeValue('brand.600', 'brand.700')} 
        color="white"
        position="relative"
        overflow="hidden"
      >
        {/* Background Shapes */}
        <Box
          position="absolute"
          top="-10%"
          right="-5%"
          width="300px"
          height="300px"
          borderRadius="full"
          bg="rgba(255,255,255,0.05)"
          zIndex={0}
        />
        <Box
          position="absolute"
          bottom="-15%"
          left="-5%"
          width="400px"
          height="400px"
          borderRadius="full"
          bg="rgba(255,255,255,0.05)"
          zIndex={0}
        />
        
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack spacing={8} textAlign="center">
            <Heading as="h2" size="2xl">
              Ready to Plan Your Perfect Party?
            </Heading>
            <Text fontSize="xl" maxW="750px">
              Join thousands of satisfied customers who have used our platform to find the best service providers for their events.
            </Text>
            <Button 
              size="lg" 
              colorScheme="white" 
              variant="outline" 
              onClick={handleOrganizeParty}
              fontSize="md"
              px={10}
              py={7}
              _hover={{ bg: 'white', color: 'brand.600' }}
              fontWeight="bold"
              borderWidth={2}
            >
              Get Started Today
            </Button>
          </VStack>
        </Container>
      </Box>
    </MainLayout>
  );
}