"use client";

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Image,
  Card,
  CardBody,
  Flex,
  Badge,
  HStack,
  VStack,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { StarIcon, SearchIcon } from '@chakra-ui/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

// Fallback data in case API doesn't work
const fallbackServices = [
  { 
    id: '4',
    name: 'Standard Bounce House',
    provider: { name: 'Jump Around' },
    rating: 4.9,
    reviewCount: 127,
    price: 199.99,
    photos: ['https://images.unsplash.com/photo-1573982680571-f6e9a8a5850b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
    isSponsored: false,
    isBestValue: true,
    isRecommended: false,
    category: { name: 'Bounce Houses', slug: 'bounce-houses' },
    city: { name: 'New York', slug: 'new-york' }
  },
  { 
    id: '5',
    name: 'Water Slide',
    provider: { name: 'Jump Around' },
    rating: 4.8,
    reviewCount: 93,
    price: 249.99,
    photos: ['https://images.unsplash.com/photo-1558181409-4fa124ccbda4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
    isSponsored: true,
    isBestValue: false,
    isRecommended: false,
    category: { name: 'Bounce Houses', slug: 'bounce-houses' },
    city: { name: 'New York', slug: 'new-york' }
  },
  { 
    id: '6',
    name: 'Combo Bounce House',
    provider: { name: 'Party Rentals' },
    rating: 4.7,
    reviewCount: 85,
    price: 299.99,
    photos: ['https://images.unsplash.com/photo-1663486630748-d6cb7fda0fe8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
    isSponsored: false,
    isBestValue: false,
    isRecommended: true,
    category: { name: 'Bounce Houses', slug: 'bounce-houses' },
    city: { name: 'New York', slug: 'new-york' }
  },
  { 
    id: '7',
    name: 'Princess Castle Bounce House',
    provider: { name: 'Royal Rentals' },
    rating: 4.9,
    reviewCount: 112,
    price: 249.99,
    photos: ['https://images.unsplash.com/photo-1560486983-bdd71948121e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1467&q=80'],
    isSponsored: false,
    isBestValue: false,
    isRecommended: true,
    category: { name: 'Bounce Houses', slug: 'bounce-houses' },
    city: { name: 'New York', slug: 'new-york' }
  }
];

// Fallback categories for filtering
const fallbackCategories = [
  { id: 'category-1', name: 'Decoration', slug: 'decoration' },
  { id: 'category-2', name: 'Catering', slug: 'catering' },
  { id: 'category-3', name: 'Entertainment', slug: 'entertainment' },
  { id: 'category-4', name: 'Venue', slug: 'venue' },
  { id: 'category-5', name: 'Photography', slug: 'photography' },
  { id: 'category-6', name: 'Music', slug: 'music' },
  { id: 'category-7', name: 'Bounce Houses', slug: 'bounce-houses' },
  { id: 'category-8', name: 'Party Supplies', slug: 'party-supplies' }
];

// Fallback cities for filtering
const fallbackCities = [
  { id: 'city-1', name: 'New York', slug: 'new-york' },
  { id: 'city-2', name: 'Los Angeles', slug: 'los-angeles' },
  { id: 'city-3', name: 'Chicago', slug: 'chicago' },
  { id: 'city-4', name: 'Houston', slug: 'houston' },
  { id: 'city-5', name: 'Miami', slug: 'miami' }
];

export default function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  // State for services and filters
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for filter values
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'price_asc');
  
  // Fetch services data
  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch categories
        let categoriesData = [];
        try {
          const categoriesResponse = await fetch('/api/categories');
          if (categoriesResponse.ok) {
            const data = await categoriesResponse.json();
            if (data.success) {
              categoriesData = data.data;
            }
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
        
        // Use fallback categories if API fetch fails
        if (categoriesData.length === 0) {
          categoriesData = fallbackCategories;
        }
        setCategories(categoriesData);
        
        // Try to fetch cities
        let citiesData = [];
        try {
          const citiesResponse = await fetch('/api/cities');
          if (citiesResponse.ok) {
            const data = await citiesResponse.json();
            if (data.success) {
              citiesData = data.data;
            }
          }
        } catch (error) {
          console.error('Error fetching cities:', error);
        }
        
        // Use fallback cities if API fetch fails
        if (citiesData.length === 0) {
          citiesData = fallbackCities;
        }
        setCities(citiesData);
        
        // Build query params for services request
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.append('search', searchQuery);
        if (selectedCategory) queryParams.append('category', selectedCategory); // Change from categoryId
        if (selectedCity) queryParams.append('cityId', selectedCity);
        if (sortOption) queryParams.append('sort', sortOption);
        
        // Try to fetch services
        let servicesData = [];
        try {
          const servicesResponse = await fetch(`/api/services?${queryParams.toString()}`);
          if (servicesResponse.ok) {
            const data = await servicesResponse.json();
            if (data.success) {
              servicesData = data.data;
            }
          }
        } catch (error) {
          console.error('Error fetching services:', error);
        }
        
        // Use fallback services if API fetch fails
        if (servicesData.length === 0) {
          servicesData = fallbackServices;
          
          // Apply client-side filtering for fallback data
          if (searchQuery) {
            servicesData = servicesData.filter(service => 
              service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.provider.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          
          if (selectedCategory) {
            const category = categoriesData.find(cat => cat.id === selectedCategory);
            if (category) {
              servicesData = servicesData.filter(service => 
                service.category.slug === category.slug
              );
            }
          }
          
          if (selectedCity) {
            const city = citiesData.find(c => c.id === selectedCity);
            if (city) {
              servicesData = servicesData.filter(service => 
                service.city.slug === city.slug
              );
            }
          }
          
          // Apply sorting
          switch (sortOption) {
            case 'price_asc':
              servicesData.sort((a, b) => a.price - b.price);
              break;
            case 'price_desc':
              servicesData.sort((a, b) => b.price - a.price);
              break;
            case 'rating_desc':
              servicesData.sort((a, b) => b.rating - a.rating);
              break;
            default:
              servicesData.sort((a, b) => a.price - b.price);
          }
        }
        
        setServices(servicesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load services. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        
        // Use fallback data in case of error
        setCategories(fallbackCategories);
        setCities(fallbackCities);
        setServices(fallbackServices);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServicesData();
  }, [searchQuery, selectedCategory, selectedCity, sortOption, toast]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Build the URL with query parameters
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.append('search', searchQuery);
    if (selectedCategory) queryParams.append('category', selectedCategory);
    if (selectedCity) queryParams.append('city', selectedCity);
    if (sortOption) queryParams.append('sort', sortOption);
    
    // Log the search parameters for debugging
    console.log('Search params:', {
      search: searchQuery,
      category: selectedCategory,
      city: selectedCity,
      sort: sortOption
    });
    
    // Navigate to the services page with filters
    router.push(`/services?${queryParams.toString()}`);
  };
  
  
  // Set SEO metadata
  useEffect(() => {
    // Set page title
    document.title = 'Services | Party Marketplace';
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Browse and book services for your next party or event. Find decorations, catering, entertainment, and more.';
  }, []);
  
  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" size="xl" mb={2}>Services</Heading>
        <Text mb={6} color="gray.600">
          Find the perfect services for your next party or event
        </Text>
        
        {/* Search and Filter Bar */}
        <Box bg="white" p={6} shadow="md" borderRadius="lg" mb={8}>
          <form onSubmit={handleSearch}>
            <Flex 
              direction={{ base: "column", md: "row" }} 
              gap={4}
              align="center"
              mb={4}
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
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
              <Select 
  placeholder="All Locations" 
  w={{ base: "full", md: "200px" }}
  value={selectedCity}
  onChange={(e) => {
    console.log("City selected:", e.target.value);
    setSelectedCity(e.target.value);
  }}
>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </Select>
              <Button 
                type="submit" 
                colorScheme="brand" 
                w={{ base: "full", md: "auto" }}
              >
                Search
              </Button>
            </Flex>
            
            <Flex justify="flex-end">
              <Select 
                w={{ base: "full", md: "200px" }}
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
              </Select>
            </Flex>
          </form>
        </Box>
        
        {/* Results */}
        {isLoading ? (
          <Flex justify="center" align="center" h="40vh">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : services.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Heading size="md" mb={4}>No services found</Heading>
            <Text mb={6}>Try adjusting your search filters or browse all services.</Text>
            <Button 
              colorScheme="brand" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedCity('');
                setSortOption('price_asc');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {services.map(service => (
              <Card 
                key={service.id} 
                as={Link}
                href={`/services/${service.id}`}
                _hover={{ 
                  transform: 'translateY(-5px)', 
                  transition: 'transform 0.3s ease',
                  shadow: 'md'
                }}
                transition="transform 0.3s ease"
                borderWidth={service.isSponsored ? "2px" : "1px"}
                borderColor={service.isSponsored ? "brand.500" : "gray.200"}
                overflow="hidden"
              >
                <Box position="relative">
                  <Image 
                    src={service.photos[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
                    alt={service.name} 
                    h="200px" 
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
                    <Text color="gray.600" fontSize="sm">by {service.provider.name}</Text>
                    
                    {service.category && service.city && (
                      <Flex wrap="wrap" gap={1}>
                        <Badge colorScheme="blue" variant="outline">
                          {service.category.name}
                        </Badge>
                        <Badge colorScheme="gray" variant="outline">
                          {service.city.name}
                        </Badge>
                      </Flex>
                    )}
                    
                    <Divider my={2} />
                    
                    <Flex justify="space-between" w="100%">
                      <Text fontWeight="bold" color="brand.600">
                        ${typeof service.price === 'number' ? service.price.toFixed(2) : service.price}
                      </Text>
                      {service.rating && (
                        <Flex align="center">
                          <StarIcon color="yellow.400" mr={1} />
                          <Text>{service.rating}</Text>
                          {service.reviewCount && (
                            <Text color="gray.500" fontSize="xs" ml={1}>
                              ({service.reviewCount})
                            </Text>
                          )}
                        </Flex>
                      )}
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Container>
    </MainLayout>
  );
}