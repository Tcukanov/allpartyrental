'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Checkbox,
  Flex,
  Image,
  Badge,
  Divider,
  SimpleGrid,
  Skeleton
} from '@chakra-ui/react';

const AddOnSelector = ({ serviceId, onAddonsChange }) => {
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAddons = async () => {
      if (!serviceId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/services/${serviceId}/addons`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch addons: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setAddons(data.data);
        } else {
          setAddons([]);
        }
      } catch (err) {
        console.error("Error fetching service addons:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAddons();
  }, [serviceId]);

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const isSelected = prev.some(item => item.id === addon.id);
      
      let newSelected;
      if (isSelected) {
        // Remove from selection
        newSelected = prev.filter(item => item.id !== addon.id);
      } else {
        // Add to selection
        newSelected = [...prev, addon];
      }
      
      // Notify parent component about the change
      if (onAddonsChange) {
        onAddonsChange(newSelected);
      }
      
      return newSelected;
    });
  };

  // If there are no addons or we're still loading, don't render anything
  if (isLoading) {
    return (
      <Box mt={6}>
        <Heading size="md" mb={4}>Available Add-ons</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </SimpleGrid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={6}>
        <Text color="red.500">Error loading add-ons: {error}</Text>
      </Box>
    );
  }

  if (addons.length === 0) {
    return null;
  }

  return (
    <Box mt={6}>
      <Heading size="md" mb={4}>Available Add-ons</Heading>
      <Divider mb={4} />
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {addons.map(addon => {
          const isSelected = selectedAddons.some(item => item.id === addon.id);
          
          return (
            <Box
              key={addon.id}
              borderWidth="1px"
              borderRadius="md"
              borderColor={isSelected ? "blue.500" : "gray.200"}
              bg={isSelected ? "blue.50" : "white"}
              p={4}
              cursor="pointer"
              onClick={() => handleAddonToggle(addon)}
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
            >
              <Flex>
                {addon.thumbnail && (
                  <Image
                    src={addon.thumbnail}
                    alt={addon.title}
                    width="60px"
                    height="60px"
                    objectFit="cover"
                    borderRadius="md"
                    mr={4}
                  />
                )}
                
                <Box flex="1">
                  <Flex justify="space-between" align="flex-start">
                    <Box>
                      <Heading size="sm" mb={1}>{addon.title}</Heading>
                      {addon.description && (
                        <Text fontSize="sm" color="gray.600" mb={2} noOfLines={2}>
                          {addon.description}
                        </Text>
                      )}
                    </Box>
                    <Text fontWeight="bold" color="green.500">
                      ${Number(addon.price).toFixed(2)}
                    </Text>
                  </Flex>
                  
                  <Flex justify="space-between" align="center" mt={2}>
                    {addon.isRequired && (
                      <Badge colorScheme="red" mr={2}>Required</Badge>
                    )}
                    <Checkbox 
                      isChecked={isSelected || addon.isRequired}
                      isDisabled={addon.isRequired}
                      colorScheme="blue"
                      size="lg"
                      ml="auto"
                      pointerEvents="none"
                    />
                  </Flex>
                </Box>
              </Flex>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

export default AddOnSelector; 