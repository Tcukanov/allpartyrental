"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  HStack,
  Spinner,
  Select,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  InputLeftElement,
  useColorModeValue,
  VStack,
  Text,
  Heading,
  SimpleGrid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';

interface City {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function LocationServiceSearch() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // States
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [formValid, setFormValid] = useState(false);

  // Colors for different themes
  const formBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.300', 'gray.600');

  // Check if form is valid
  useEffect(() => {
    setFormValid(selectedCity !== "" && selectedCategory !== "");
  }, [selectedCity, selectedCategory]);

  // Fetch cities and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [citiesRes, categoriesRes] = await Promise.all([
          fetch('/api/cities'),
          fetch('/api/categories')
        ]);

        if (!citiesRes.ok || !categoriesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const citiesData = await citiesRes.json();
        const categoriesData = await categoriesRes.json();

        const citiesList = citiesData.data || [];
        const categoriesList = categoriesData.data || [];
        
        setCities(citiesList);
        setCategories(categoriesList);
        
        // Set default selections to first items in each list
        if (citiesList.length > 0) {
          setSelectedCity(citiesList[0].id);
        }
        
        if (categoriesList.length > 0) {
          setSelectedCategory(categoriesList[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load search data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formValid) {
      const citySlug = cities.find(c => c.id === selectedCity)?.slug || selectedCity;
      const categorySlug = categories.find(c => c.id === selectedCategory)?.slug || selectedCategory;
      
      router.push(`/${citySlug}/${categorySlug}`);
    } else {
      onOpen(); // Open modal to select values
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100px">
        <Spinner size="lg" color="brand.500" thickness="3px" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Box 
        as="form" 
        onSubmit={handleSearch}
        bg={formBg}
        p={4}
        borderRadius="lg"
        boxShadow="md"
        w="100%"
      >
        <VStack spacing={4} align="stretch">
          <Heading size="sm" textAlign="center" mb={2}>Find the Perfect Service for Your Event</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {/* Location/City Field */}
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                Location
              </FormLabel>
              <Select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Service Category Field */}
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                Service Category
              </FormLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Search Button */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                &nbsp;
              </FormLabel>
              <Button
                type="submit"
                colorScheme="brand"
                w="100%"
                h="40px"
                leftIcon={<SearchIcon />}
                isDisabled={!formValid}
              >
                Search
              </Button>
            </FormControl>
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Modal for when user hasn't selected both fields */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Complete Your Search</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>Please select both a location and a service category to search.</Text>
            
            <VStack spacing={4} align="stretch">
              {!selectedCity && (
                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {!selectedCategory && (
                <FormControl>
                  <FormLabel>Service Category</FormLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              <Button
                colorScheme="brand"
                w="full"
                onClick={() => {
                  if (selectedCity && selectedCategory) {
                    const citySlug = cities.find(c => c.id === selectedCity)?.slug || selectedCity;
                    const categorySlug = categories.find(c => c.id === selectedCategory)?.slug || selectedCategory;
                    router.push(`/${citySlug}/${categorySlug}`);
                    onClose();
                  }
                }}
                isDisabled={!selectedCity || !selectedCategory}
              >
                Search
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
} 