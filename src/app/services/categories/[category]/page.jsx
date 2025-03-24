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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { StarIcon, SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [category, setCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState('price_asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch category and services data
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the category details
        const categoryResponse = await fetch(`/api/categories/${params.category}`);
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
    
    if (params.category) {
      fetchCategoryData();
    }
  }, [params.category, sortOption, toast]);
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    // Update the search query parameter
    router.push(`/services/categories/${params.category}?search=${searchQuery}`);
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
      canonicalLink.href = `${window.location.origin}/services/categories/${params.category}`;
    }
  }, [category, params.category]);
  
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