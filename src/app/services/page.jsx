"use client";

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, Image, Button, useToast, HStack, Badge, Icon, Spinner, Select, InputGroup, InputLeftElement, Input } from '@chakra-ui/react';
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
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [servicesRes, categoriesRes, citiesRes] = await Promise.all([
          fetch('/api/services/public'),
          fetch('/api/categories'),
          fetch('/api/cities')
        ]);

        if (!servicesRes.ok || !categoriesRes.ok || !citiesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const servicesData = await servicesRes.json();
        const categoriesData = await categoriesRes.json();
        const citiesData = await citiesRes.json();

        if (!servicesData.success) {
          throw new Error(servicesData.error?.message || 'Failed to load services');
        }

        setServices(servicesData.data);
        setCategories(categoriesData.data);
        setCities(citiesData.data);
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

  // Filter services based on selections and search
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory ? service.categoryId === selectedCategory : true;
    const matchesCity = selectedCity ? service.cityId === selectedCity : true;
    const matchesSearch = searchTerm.trim() === '' ? true : 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesCity && matchesSearch;
  });
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  
  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Browse Our Services</Heading>
          <Text color="gray.600" mt={2}>
            Discover our range of party and event services for all your needs
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
              <Select placeholder="All Categories" value={selectedCategory} onChange={handleCategoryChange}>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <Select placeholder="All Locations" value={selectedCity} onChange={handleCityChange}>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
            </HStack>
          </VStack>
        </Box>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <Spinner size="xl" color="brand.500" />
          </Box>
        ) : filteredServices.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text fontSize="lg">No services found matching your criteria.</Text>
            <Text mt={2} color="gray.600">
              Try changing your filters or search term.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {filteredServices.map((service) => (
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