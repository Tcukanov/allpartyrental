'use client';

import { useState } from 'react';
import { Box, Button, Container, Heading, Input, Text, VStack, useToast } from '@chakra-ui/react';
import { DatePicker } from '@/components/ui/datepicker';

export default function BlockedDatesTest() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const toast = useToast();

  const handleAddBlockedPeriod = () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Missing dates',
        description: 'Please select both start and end dates',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: 'Invalid date range',
        description: 'Start date must be before end date',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newBlockedDates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      newBlockedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setBlockedDates([...blockedDates, ...newBlockedDates]);
    setStartDate(null);
    setEndDate(null);
    
    toast({
      title: 'Dates blocked',
      description: `Successfully blocked dates from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleClearBlockedDates = () => {
    setBlockedDates([]);
    toast({
      title: 'Cleared',
      description: 'All blocked dates have been cleared',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Blocked Dates Test
        </Heading>
        
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold">Select Date Range to Block:</Text>
            
            <Box>
              <Text mb={2}>Start Date:</Text>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                excludeDates={blockedDates}
                placeholderText="Select start date"
                dateFormat="MMMM d, yyyy"
              />
            </Box>
            
            <Box>
              <Text mb={2}>End Date:</Text>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                excludeDates={blockedDates}
                placeholderText="Select end date"
                minDate={startDate || undefined}
                dateFormat="MMMM d, yyyy"
              />
            </Box>
            
            <Button colorScheme="blue" onClick={handleAddBlockedPeriod}>
              Block Date Range
            </Button>
          </VStack>
        </Box>
        
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold">
              Blocked Dates ({blockedDates.length}):
            </Text>
            
            {blockedDates.length > 0 ? (
              <Box maxH="200px" overflowY="auto" p={2} borderWidth={1} borderRadius="md">
                {blockedDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((date, index) => (
                    <Text key={index}>{date.toLocaleDateString()}</Text>
                  ))}
              </Box>
            ) : (
              <Text color="gray.500">No dates blocked yet</Text>
            )}
            
            <Button 
              colorScheme="red" 
              variant="outline" 
              onClick={handleClearBlockedDates}
              isDisabled={blockedDates.length === 0}
            >
              Clear All Blocked Dates
            </Button>
          </VStack>
        </Box>
        
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold">Test Calendar:</Text>
            <Text fontSize="sm" color="gray.600">
              The calendar below will show the blocked dates (unavailable for selection)
            </Text>
            
            <DatePicker
              inline
              excludeDates={blockedDates}
              onChange={() => {}}
            />
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 