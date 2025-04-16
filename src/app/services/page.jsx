"use client";

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, Image, Button, useToast, HStack, Badge, Icon, Spinner, Select, InputGroup, InputLeftElement, Input, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Flex, Divider, Checkbox, CheckboxGroup, Stack } from '@chakra-ui/react';
import { StarIcon, ViewIcon, SearchIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import LocationServiceSearch from '@/components/search/LocationServiceSearch';
import Link from 'next/link';

export default function ServicesPage() {
  const router = useRouter();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedColor, setSelectedColor] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const availableColors = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'White'];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Only fetch categories and cities here
        const [categoriesRes, citiesRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/cities')
        ]);

        if (!categoriesRes.ok || !citiesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const categoriesData = await categoriesRes.json();
        const citiesData = await citiesRes.json();

        setCategories(categoriesData.data || []);
        setCities(citiesData.data || []);
        
        // If categories are available, automatically select the first one
        if (categoriesData.data && categoriesData.data.length > 0) {
          setSelectedCategory(categoriesData.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Function to fetch services with filters
  const fetchServices = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (selectedCategory) {
        queryParams.append('categoryId', selectedCategory);
      }
      
      if (selectedCity) {
        queryParams.append('cityId', selectedCity);
      }
      
      if (searchTerm && searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }
      
      if (minPrice > 0) {
        queryParams.append('minPrice', minPrice.toString());
      }
      
      if (maxPrice < 10000) {
        queryParams.append('maxPrice', maxPrice.toString());
      }

      if (selectedColor) {
        queryParams.append('color', selectedColor);
      }

      // Log the query params for debugging
      console.log('Fetching services with params:', queryParams.toString());

      // Use public API endpoint
      const response = await fetch(`/api/services/public?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error(`API error: ${response.status}`, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data || []);
        if (data.data.length === 0) {
          setErrorMessage('No services found matching your criteria.');
        }
      } else {
        console.error('Failed to fetch services:', data.error);
        setErrorMessage('Failed to load services. Please try again later.');
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setErrorMessage('Failed to load services. Please try again later.');
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Use effect to fetch services when filters change
  useEffect(() => {
    if (!isLoading || categories.length > 0 || cities.length > 0) {
      fetchServices();
    }
  }, [selectedCategory, selectedCity, searchTerm, minPrice, maxPrice, selectedColor]);

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleColorChange = (e) => {
    setSelectedColor(e.target.value);
  };

  const handlePriceChange = (values) => {
    setMinPrice(values[0]);
    setMaxPrice(values[1]);
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Browse Our Services</Heading>
          <Text color="gray.600" mt={2}>
            Discover our range of soft play services for all your needs
          </Text>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <VStack spacing={4}>
            <LocationServiceSearch />
            <HStack w="full" spacing={4} mt={2}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search services..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </InputGroup>
              <Select placeholder="All Locations" value={selectedCity} onChange={handleCityChange}>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
            </HStack>

            <Divider my={3} />
            
            <Flex w="full" direction={{ base: 'column', md: 'row' }} gap={6}>
              {/* Color filter */}
              <Box flex="1">
                <Text fontWeight="medium" mb={2}>Filter by Color</Text>
                <Select 
                  placeholder="All Colors" 
                  value={selectedColor} 
                  onChange={handleColorChange}
                >
                  {availableColors.map(color => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </Select>
              </Box>
              
              {/* Price range slider */}
              <Box flex="2">
                <Text fontWeight="medium" mb={2}>Price Range: ${minPrice} - ${maxPrice}</Text>
                <RangeSlider
                  aria-label={['min', 'max']}
                  defaultValue={[0, 10000]}
                  min={0}
                  max={10000}
                  step={50}
                  value={[minPrice, maxPrice]}
                  onChange={handlePriceChange}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
              </Box>
            </Flex>
          </VStack>
        </Box>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <Spinner size="xl" color="brand.500" />
          </Box>
        ) : services.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text fontSize="lg">{errorMessage}</Text>
            <Text mt={2} color="gray.600">
              Try changing your filters or search term.
            </Text>
            {errorMessage.includes('Failed to load') && (
              <Button mt={4} colorScheme="brand" onClick={fetchServices}>
                Try Again
              </Button>
            )}
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {services.map((service) => (
              <Card key={service.id} cursor="pointer" overflow="hidden" transition="transform 0.3s" _hover={{ transform: 'translateY(-5px)' }}>
                <Box position="relative" h="200px">
                  <Image 
                    src={Array.isArray(service.photos) && service.photos.length > 0 
                      ? service.photos[0] 
                      : '/images/placeholder.jpg'}
                    alt={service.name} 
                    objectFit="cover"
                    w="100%" 
                    h="100%"
                  />
                  <Badge
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme="brand"
                    fontSize="sm"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    ${Number(service.price).toFixed(2)}
                  </Badge>
                  {service.colors && service.colors.length > 0 && (
                    <HStack
                      position="absolute"
                      bottom={2}
                      left={2}
                      spacing={1}
                    >
                      {service.colors.slice(0, 3).map(color => (
                        <Box
                          key={color}
                          w="15px"
                          h="15px"
                          borderRadius="full"
                          bg={color.toLowerCase()}
                          border="1px solid white"
                        />
                      ))}
                      {service.colors.length > 3 && (
                        <Badge bg="white" color="gray.500" fontSize="xs">
                          +{service.colors.length - 3}
                        </Badge>
                      )}
                    </HStack>
                  )}
                </Box>
                
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Heading size="md">{service.name}</Heading>
                    <Text color="gray.600" noOfLines={2}>
                      {service.description}
                    </Text>

                    <HStack justify="space-between">
                      <HStack spacing={1}>
                        <Icon as={StarIcon} color="yellow.400" />
                        <Text fontSize="sm">
                          {service.rating ? Number(service.rating).toFixed(1) : '4.5'}
                        </Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Icon as={ViewIcon} color="gray.500" />
                        <Text fontSize="sm">{service.city?.name || 'Chicago'}</Text>
                      </HStack>
                    </HStack>

                    <Button 
                      as={Link}
                      href={`/services/${service.id}`}
                      colorScheme="brand" 
                      size="sm"
                      mt={2}
                    >
                      View Details
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
}