"use client";

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, Image, Button, useToast, HStack, Badge, Icon, Spinner, Select, InputGroup, InputLeftElement, Input, Flex, Divider, Checkbox, CheckboxGroup, Stack, useDisclosure, IconButton, Collapse } from '@chakra-ui/react';
import { StarIcon, ViewIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
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
  const [selectedColor, setSelectedColor] = useState('');
  const [sortByPrice, setSortByPrice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { isOpen, onToggle } = useDisclosure();
  
  // Add state for category filters
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  
  const availableColors = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'White'];
  const sortOptions = [
    { value: '', label: 'Default Sort' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' }
  ];
  
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
          const softPlayCategory = categoriesData.data.find(cat => cat.name === 'Soft play') || categoriesData.data[0];
          setSelectedCategory(softPlayCategory.id);
          
          // Fetch filters for this category
          await fetchCategoryFilters(softPlayCategory.id);
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

  // Add function to fetch category filters
  const fetchCategoryFilters = async (categoryId) => {
    try {
      const response = await fetch(`/api/categories/filters?categoryId=${categoryId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category filters: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCategoryFilters(data.data || []);
        console.log('Fetched category filters:', data.data);
      } else {
        console.error('Failed to fetch category filters:', data.error);
      }
    } catch (error) {
      console.error('Error fetching category filters:', error);
    }
  };

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
      
      // Note: cityId is a required field in the database schema but not prominently
      // displayed in the frontend UI. It's included in the query for filtering but
      // the UI de-emphasizes it. See DEVELOPMENT_NOTES.md for more details.
      if (selectedCity) {
        queryParams.append('cityId', selectedCity);
      }
      
      if (searchTerm && searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      if (selectedColor) {
        queryParams.append('color', selectedColor);
      }
      
      if (sortByPrice) {
        queryParams.append('sort', sortByPrice);
      }
      
      // Add dynamic filter values
      Object.entries(filterValues).forEach(([filterId, value]) => {
        if (value && (typeof value === 'string' || Array.isArray(value))) {
          if (typeof value === 'string') {
            queryParams.append(`filter_${filterId}`, value);
          } else if (Array.isArray(value) && value.length > 0) {
            // For multi-select filters, we can join values with comma
            queryParams.append(`filter_${filterId}`, value.join(','));
          }
        }
      });

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
        // Apply client-side sorting if needed
        let sortedServices = data.data || [];
        
        if (sortByPrice && !queryParams.has('sort')) {
          sortedServices = [...sortedServices].sort((a, b) => {
            if (sortByPrice === 'price_asc') {
              return parseFloat(a.price) - parseFloat(b.price);
            } else if (sortByPrice === 'price_desc') {
              return parseFloat(b.price) - parseFloat(a.price);
            }
            return 0;
          });
        }
        
        setServices(sortedServices);
        if (sortedServices.length === 0) {
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
  }, [selectedCategory, selectedCity, searchTerm, selectedColor, sortByPrice, filterValues]);

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleColorChange = (e) => {
    setSelectedColor(e.target.value);
  };
  
  const handleSortChange = (e) => {
    setSortByPrice(e.target.value);
  };
  
  // Add handler for filter changes
  const handleFilterChange = (filterId, value) => {
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }));
  };
  
  return (
    <Container maxW="container.xl" py={8}>
        <Box>
          <Heading as="h1" size="xl">Browse Our Services</Heading>
          <Text color="gray.600" mt={2}>
            Discover our range of soft play services for all your needs
          </Text>
        </Box>

      {/* Top Filters Bar */}
      <Box mt={6} bg="white" p={4} borderRadius="lg" boxShadow="md">
            <Flex w="full" wrap="wrap" gap={4}>
              {/* Search input */}
              <Box flex="1" minW="200px">
                <Text fontWeight="medium" mb={2}>Search</Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input 
                    placeholder="Search services..." 
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </Box>
            
              {/* Location filter */}
              <Box flex="1" minW="200px">
                <Text fontWeight="medium" mb={2}>Location</Text>
                <Select placeholder="All Locations" value={selectedCity} onChange={handleCityChange}>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </Select>
              </Box>
              
              {/* Color filter */}
          {/* <Box flex="1" minW="200px">
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
          </Box> */}
              
              {/* Sort by price */}
              <Box flex="1" minW="200px">
                <Text fontWeight="medium" mb={2}>Sort by Price</Text>
                <Select
                  value={sortByPrice}
                  onChange={handleSortChange}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Box>
            </Flex>
      </Box>

      <Flex mt={6} gap={6} flexDirection={{ base: "column", md: "row" }}>
        {/* Left Sidebar with Additional Filters only */}
            {categoryFilters.length > 0 && (
          <Box w={{ base: "100%", md: "300px" }} flexShrink={0}>
            <Box bg="white" p={4} borderRadius="lg" boxShadow="md">
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading as="h3" size="md">Additional Filters</Heading>
                <IconButton 
                  display={{ base: "flex", md: "none" }}
                  icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  onClick={onToggle}
                  variant="ghost"
                  aria-label={isOpen ? "Hide filters" : "Show filters"}
                  size="md"
                  fontSize="24px"
                />
              </Flex>
              
              <Box display={{ base: isOpen ? "block" : "none", md: "block" }}>
                <VStack spacing={4} align="stretch">
                  {categoryFilters.map(filter => (
                    <Box key={filter.id}>
                      <Text fontWeight="medium" mb={2}>
                        {filter.name}
                        {filter.iconUrl && (
                          <Image
                            src={filter.iconUrl}
                            alt={filter.name}
                            boxSize="16px"
                            display="inline-block"
                            ml={2}
                            verticalAlign="middle"
                          />
                        )}
                      </Text>
                      
                      {/* Render different input types based on filter type */}
                      {filter.options.length === 0 ? (
                        // Text input for text-only filters
                        <Input
                          value={filterValues[filter.id] || ''}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                          placeholder={`Enter ${filter.name.toLowerCase()}`}
                          size="md"
                        />
                      ) : filter.type === 'color' ? (
                        // Color selection radio buttons
                        <Select
                          placeholder={`Select ${filter.name}`}
                          value={filterValues[filter.id] || ''}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        >
                          <option value="">All {filter.name}s</option>
                          {filter.options.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      ) : filter.type === 'size' || filter.type === 'material' ? (
                        // Single select dropdown
                        <Select
                          placeholder={`Select ${filter.name}`}
                          value={filterValues[filter.id] || ''}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        >
                          <option value="">All {filter.name}s</option>
                          {filter.options.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        // Multi-select checkboxes
                        <Select
                          placeholder={`Select ${filter.name}`}
                          value={filterValues[filter.id]?.[0] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              handleFilterChange(filter.id, [value]);
                            } else {
                              handleFilterChange(filter.id, []);
                            }
                          }}
                        >
                          <option value="">Any {filter.name}</option>
                          {filter.options.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            </Box>
              </Box>
            )}
        
        {/* Right Side - Content Area */}
        <Box flex="1">
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
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
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
                        <Text fontSize="sm">
                          {service.city?.name || 
                           (service.provider?.provider?.businessCity ? 
                            service.provider.provider.businessCity : 
                            (service.provider?.name ? `${service.provider.name}'s location` : 'Location unavailable'))}
                        </Text>
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
        </Box>
      </Flex>
    </Container>
  );
}