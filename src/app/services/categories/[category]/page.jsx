"use client";

import React, { useEffect, useState } from 'react';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { StarIcon, SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function CategoryServicesPage({ params }) {
  const router = useRouter();
  const toast = useToast();
  
  const [category, setCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState('price_asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // For client components, use React.use() to unwrap the params Promise
  const unwrappedParams = React.use(params);
  const { category: categorySlug } = unwrappedParams;
  
  // Update all params.category references to just category
  const categoryName = categorySlug;
  
  // Fetch category and services data
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the category details
        const categoryResponse = await fetch(`/api/categories/${categoryName}`);
        if (!categoryResponse.ok) {
          throw new Error('Category not found');
        }
        
        const categoryData = await categoryResponse.json();
        
        if (!categoryData.success) {
          throw new Error(categoryData.error?.message || 'Failed to load category');
        }
        
        setCategory(categoryData.data);
        
        // Fetch services in this category
        const servicesResponse = await fetch(`/api/services?categoryId=${categoryData.data.id}&sort=${sortOption}`);
        if (!servicesResponse.ok) {
          throw new Error('Failed to load services');
        }
        
        const servicesData = await servicesResponse.json();
        
        if (!servicesData.success) {
          throw new Error(servicesData.error?.message || 'Failed to load services');
        }
        
        setServices(servicesData.data);
        
        // Extract unique cities from services
        const uniqueCities = [...new Set(servicesData.data.map(service => service.city?.id))];
        const cityDetails = servicesData.data
          .map(service => service.city)
          .filter((city, index, self) => 
            city && self.findIndex(c => c?.id === city.id) === index
          );
        
        setCities(cityDetails);
        
      } catch (error) {
        console.error('Error fetching category data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load category details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (categoryName) {
      fetchCategoryData();
    }
  }, [categoryName, sortOption, toast]);
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    // Update the search query parameter
    router.push(`/services/categories/${categoryName}?search=${searchQuery}`);
  };
  
  // Handle sort change
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };
  
  // Set page metadata for SEO
  useEffect(() => {
    if (category) {
      // Set page title
      document.title = `${category.name} Services | Party Marketplace`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = `Find and book ${category.name} services for your next party or event. Compare prices, read reviews, and hire the best ${category.name.toLowerCase()} providers.`;
      
      // Add canonical link for SEO
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = `${window.location.origin}/services/categories/${categoryName}`;
    }
  }, [category, categoryName]);
  
  if (isLoading) {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" h="60vh">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        </Container>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        {/* Breadcrumb navigation */}
        <Breadcrumb separator={<ChevronRightIcon color="gray.500" />} mb={6}>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/services">Services</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{category?.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        {/* Category header */}
        <Box mb={8}>
          <Heading as="h1" size="2xl" mb={4}>{category?.name}</Heading>
          <Text fontSize="lg" color="gray.600">{category?.description}</Text>
        </Box>
        
        {/* Search and filter */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          gap={4} 
          mb={8} 
          p={4} 
          bg="white" 
          borderRadius="md" 
          boxShadow="sm"
        >
          <Box as="form" onSubmit={handleSearch} flex="1">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input 
                placeholder="Search services" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Box>
          
          <Select 
            value={sortOption} 
            onChange={handleSortChange} 
            width={{ base: 'full', md: '200px' }}
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="newest">Newest First</option>
          </Select>
        </Flex>
        
        {/* Services grid */}
        {services.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {services.map(service => (
              <Card key={service.id} overflow="hidden" variant="outline">
                <Image 
                  src={service.photos?.[0] || '/images/placeholder-service.jpg'} 
                  alt={service.name}
                  h="200px"
                  objectFit="cover"
                />
                <CardBody>
                  <Heading as="h3" size="md" mb={2}>{service.name}</Heading>
                  <Text noOfLines={2} mb={3} color="gray.600">{service.description}</Text>
                  
                  <Flex justify="space-between" align="center" mb={3}>
                    <Badge colorScheme="brand" px={2} py={1}>
                      {service.city?.name}
                    </Badge>
                    <Text fontWeight="bold" fontSize="lg">
                      ${service.price.toFixed(2)}
                    </Text>
                  </Flex>
                  
                  <Button 
                    as={Link} 
                    href={`/services/${service.id}`}
                    colorScheme="brand" 
                    variant="outline" 
                    width="full"
                  >
                    View Details
                  </Button>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" py={10}>
            <Heading as="h3" size="md" mb={3}>No services found</Heading>
            <Text color="gray.600">
              We couldn't find any {category?.name} services matching your criteria.
            </Text>
          </Box>
        )}
      </Container>
    </MainLayout>
  );
}