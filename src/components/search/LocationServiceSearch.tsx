"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Input,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
} from '@chakra-ui/react';
import { SearchIcon, StarIcon } from '@chakra-ui/icons';
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
  
  // Move color mode values to the top to maintain consistent hook order
  const inputBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const focusBg = useColorModeValue('white', 'gray.800');
  const suggestionsBg = useColorModeValue('white', 'gray.800');
  const suggestionHoverBg = useColorModeValue('gray.50', 'gray.700');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ location: string; service: string }>>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cities and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesRes, categoriesRes] = await Promise.all([
          fetch('/api/cities'),
          fetch('/api/categories')
        ]);

        if (!citiesRes.ok || !categoriesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const citiesData = await citiesRes.json();
        const categoriesData = await categoriesRes.json();

        setCities(citiesData.data);
        setCategories(categoriesData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Generate suggestions based on the search query
    const newSuggestions = [];
    for (const city of cities) {
      for (const category of categories) {
        if (
          city.name.toLowerCase().includes(query) ||
          category.name.toLowerCase().includes(query)
        ) {
          newSuggestions.push({ location: city.slug, service: category.slug });
        }
      }
    }
    setSuggestions(newSuggestions.slice(0, 6));
  };

  // Handle location selection
  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    if (selectedService) {
      router.push(`/${location}/${selectedService}`);
      onClose();
    }
  };

  // Handle service selection
  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    if (selectedLocation) {
      router.push(`/${selectedLocation}/${service}`);
      onClose();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (location: string, service: string) => {
    router.push(`/${location}/${service}`);
    onClose();
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      const { location, service } = suggestions[0];
      router.push(`/${location}/${service}`);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <>
      <Box
        as="form"
        onSubmit={handleSearch}
        position="relative"
        maxW="600px"
        mx="auto"
      >
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search for services in your location (e.g., 'bounce house in New York')"
            value={searchQuery}
            onChange={handleSearchChange}
            onClick={onOpen}
            size="lg"
            borderRadius="full"
            bg={inputBg}
            _hover={{ bg: hoverBg }}
            _focus={{ bg: focusBg }}
          />
        </InputGroup>

        {suggestions.length > 0 && (
          <VStack
            position="absolute"
            top="100%"
            left={0}
            right={0}
            mt={2}
            bg={suggestionsBg}
            borderRadius="md"
            boxShadow="lg"
            zIndex={1000}
            align="stretch"
            maxH="400px"
            overflowY="auto"
          >
            {suggestions.map((suggestion, index) => {
              const city = cities.find(c => c.slug === suggestion.location);
              const category = categories.find(c => c.slug === suggestion.service);
              return (
                <Button
                  key={index}
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={() => handleSuggestionClick(suggestion.location, suggestion.service)}
                  _hover={{ bg: suggestionHoverBg }}
                >
                  <HStack spacing={2}>
                    <StarIcon color="gray.400" />
                    <Text>
                      {category?.name} in {city?.name}
                    </Text>
                  </HStack>
                </Button>
              );
            })}
          </VStack>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Find Party Services</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs>
              <TabList>
                <Tab>Select Location</Tab>
                <Tab>Select Service</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                    {cities.map((city) => (
                      <Button
                        key={city.id}
                        variant={selectedLocation === city.slug ? 'solid' : 'outline'}
                        colorScheme={selectedLocation === city.slug ? 'brand' : undefined}
                        onClick={() => handleLocationSelect(city.slug)}
                      >
                        {city.name}
                      </Button>
                    ))}
                  </SimpleGrid>
                </TabPanel>

                <TabPanel>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedService === category.slug ? 'solid' : 'outline'}
                        colorScheme={selectedService === category.slug ? 'brand' : undefined}
                        onClick={() => handleServiceSelect(category.slug)}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {(selectedLocation || selectedService) && (
              <Box mt={4} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                <Text fontWeight="bold" mb={2}>Selected:</Text>
                <HStack spacing={2}>
                  {selectedLocation && (
                    <Badge colorScheme="blue">
                      {cities.find(c => c.slug === selectedLocation)?.name}
                    </Badge>
                  )}
                  {selectedService && (
                    <Badge colorScheme="green">
                      {categories.find(c => c.slug === selectedService)?.name}
                    </Badge>
                  )}
                </HStack>
                {selectedLocation && selectedService && (
                  <Button
                    mt={4}
                    colorScheme="brand"
                    w="full"
                    onClick={() => {
                      router.push(`/${selectedLocation}/${selectedService}`);
                      onClose();
                    }}
                  >
                    View Results
                  </Button>
                )}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
} 