"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  SimpleGrid, 
  Card, 
  CardBody, 
  Image, 
  Button, 
  useToast, 
  HStack, 
  Badge, 
  Icon, 
  Spinner, 
  Select, 
  InputGroup, 
  InputLeftElement, 
  Input, 
  Flex 
} from '@chakra-ui/react';
import { StarIcon, ViewIcon, SearchIcon } from '@chakra-ui/icons';
import Link from 'next/link';

type City = {
  id: string;
  name: string;
  slug: string;
  state: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  photos: string[];
  colors?: string[];
  provider: {
    name: string;
    profile?: {
      address?: string;
      isProStatus?: boolean;
    };
  };
  city?: City;
};

type Filter = {
  id: string;
  name: string;
  type: string;
  options: string[];
  iconUrl?: string;
};

type ClientProps = {
  citySlug: string;
  categorySlug: string;
};

export default function LocationServiceClientPage({ citySlug, categorySlug }: ClientProps) {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [city, setCity] = useState<City | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sortByPrice, setSortByPrice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Category filters
  const [categoryFilters, setCategoryFilters] = useState<Filter[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({});
  
  const availableColors = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'White'];
  const sortOptions = [
    { value: '', label: 'Default Sort' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' }
  ];
  
  // Fetch city and category data
  useEffect(() => {
    const fetchLocationAndCategory = async () => {
      try {
        setIsLoading(true);
        
        const [cityRes, categoryRes] = await Promise.all([
          fetch(`/api/cities/${citySlug}`),
          fetch(`/api/categories/${categorySlug}`)
        ]);
        
        if (!cityRes.ok || !categoryRes.ok) {
          throw new Error('Failed to load page data');
        }
        
        const cityData = await cityRes.json();
        const categoryData = await categoryRes.json();
        
        if (!cityData.success || !categoryData.success) {
          throw new Error('Failed to load page data');
        }
        
        setCity(cityData.data);
        setCategory(categoryData.data);
        
        // Fetch filters for this category
        await fetchCategoryFilters(categoryData.data.id);
        
      } catch (error) {
        console.error('Error fetching location and category:', error);
        toast({
          title: 'Error',
          description: 'Failed to load page data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    
    fetchLocationAndCategory();
  }, [citySlug, categorySlug, toast]);
  
  // Fetch category filters
  const fetchCategoryFilters = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/filters?categoryId=${categoryId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category filters: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCategoryFilters(data.data || []);
      } else {
        console.error('Failed to fetch category filters:', data.error);
      }
    } catch (error) {
      console.error('Error fetching category filters:', error);
    }
  };
  
  // Fetch services with filters
  const fetchServices = async () => {
    if (!city?.id || !category?.id) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      queryParams.append('categoryId', category.id);
      queryParams.append('cityId', city.id);
      
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
            queryParams.append(`filter_${filterId}`, value.join(','));
          }
        }
      });
      
      // Use public API endpoint
      const response = await fetch(`/api/services/public?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
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
  
  // Fetch services when filters change or data is loaded
  useEffect(() => {
    if (city && category) {
      fetchServices();
    }
  }, [city, category, searchTerm, selectedColor, sortByPrice, filterValues]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedColor(e.target.value);
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortByPrice(e.target.value);
  };
  
  const handleFilterChange = (filterId: string, value: string | string[]) => {
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }));
  };
  
  if (!city || !category) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="center" py={12}>
          <Spinner size="xl" color="brand.500" />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Heading as="h1" size="2xl" mb={4}>
          {category.name} Rental in {city.name}
        </Heading>
        <Text fontSize="xl" color="gray.600">
          Find and compare the best {category.name.toLowerCase()} rental services in {city.name}. 
          Read reviews, compare prices, and book your party equipment today!
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
              <Heading as="h3" size="md" mb={4}>Additional Filters</Heading>
              
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
                    
                    {filter.options.length === 0 ? (
                      <Input
                        value={filterValues[filter.id] as string || ''}
                        onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        placeholder={`Enter ${filter.name.toLowerCase()}`}
                        size="md"
                      />
                    ) : filter.type === 'color' ? (
                      <Select
                        placeholder={`Select ${filter.name}`}
                        value={filterValues[filter.id] as string || ''}
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
                      <Select
                        placeholder={`Select ${filter.name}`}
                        value={filterValues[filter.id] as string || ''}
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
                      <Select
                        placeholder={`Select ${filter.name}`}
                        value={(filterValues[filter.id] as string[])?.length ? (filterValues[filter.id] as string[])[0] : ''}
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
                          <Text fontSize="sm">4.5</Text>
                        </HStack>
                        <HStack spacing={1}>
                          <Icon as={ViewIcon} color="gray.500" />
                          <Text fontSize="sm">
                            {service.city?.name || 
                            (service.provider?.profile?.address || city.name)}
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