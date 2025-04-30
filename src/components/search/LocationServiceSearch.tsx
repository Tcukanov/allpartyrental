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
  AlertIcon,
  Icon,
  Divider,
  Flex,
  Stack
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiGrid } from 'react-icons/fi';

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
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const iconColor = useColorModeValue('brand.500', 'brand.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

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
        borderRadius="lg"
        overflow="hidden"
        w="100%"
        boxShadow="xl"
      >
        <Flex 
          direction={{ base: "column", md: "row" }} 
          align="center"
          borderRadius="lg"
        >
          {/* Location/City Field */}
          <InputGroup 
            size="lg" 
            borderRight={{ base: "none", md: "1px solid" }} 
            borderColor={borderColor}
            flex={{ base: "1", md: "2" }}
          >
            <InputLeftElement 
              pointerEvents="none" 
              h="full" 
              pl={4}
              children={<Icon as={FiMapPin} color={iconColor} boxSize={5} />} 
            />
            <Select
              border="none"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              color={labelColor}
              fontSize="md"
              fontWeight="medium"
              h="60px"
              pl={14}
              _hover={{ bg: hoverBg }}
              _focus={{ boxShadow: "none", bg: hoverBg }}
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
          </InputGroup>

          {/* Service Category Field */}
          <InputGroup 
            size="lg" 
            borderRight={{ base: "none", md: "1px solid" }} 
            borderColor={borderColor}
            flex={{ base: "1", md: "2" }}
            borderTop={{ base: "1px solid", md: "none" }}
            borderTopColor={{ base: borderColor, md: "none" }}
          >
            <InputLeftElement 
              pointerEvents="none" 
              h="full" 
              pl={4}
              children={<Icon as={FiGrid} color={iconColor} boxSize={5} />} 
            />
            <Select
              border="none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              color={labelColor}
              fontSize="md"
              fontWeight="medium"
              h="60px"
              pl={14}
              _hover={{ bg: hoverBg }}
              _focus={{ boxShadow: "none", bg: hoverBg }}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </InputGroup>

          {/* Search Button */}
          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            h={{ base: "70px", md: "60px" }}
            minH="60px"
            px={{ base: 10, md: 8 }}
            flex={{ base: 1.5, md: 1 }}
            fontSize={{ base: "lg", md: "md" }}
            fontWeight="bold"
            borderRadius={{ base: "0 0 lg lg", md: "0 lg lg 0" }}
            leftIcon={<SearchIcon boxSize={{ base: 5, md: 4 }} />}
            isDisabled={!formValid}
            width="100%"
            _hover={{
              transform: "translateY(-1px)",
              boxShadow: "lg"
            }}
          >
            Search
          </Button>
        </Flex>
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
                onClick={() => {
                  if (selectedCity && selectedCategory) {
                    onClose();
                    handleSearch(new Event('submit') as any);
                  }
                }}
                mt={2}
              >
                Search Now
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
} 