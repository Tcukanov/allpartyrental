'use client';
import { useState } from 'react';
import { Button, Box, Text, Heading, Input, VStack, HStack, useToast } from '@chakra-ui/react';

export default function BlockedDatesTest() {
  const [serviceId, setServiceId] = useState('cma4d1nbc0005mlcqvf2qsn77');
  const [date, setDate] = useState('');
  const [blockedDates, setBlockedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();

  const addDate = () => {
    if (!date) return;
    
    // Check if date already exists
    if (blockedDates.includes(date)) {
      toast({
        title: 'Date already added',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setBlockedDates([...blockedDates, date]);
    setDate('');
  };

  const removeDate = (dateToRemove) => {
    setBlockedDates(blockedDates.filter(d => d !== dateToRemove));
  };

  const saveBlockedDates = async () => {
    setIsLoading(true);
    try {
      const formattedDates = blockedDates.map(d => {
        const jsDate = new Date(d);
        return jsDate.toISOString();
      });
      
      console.log('Sending blocked dates:', formattedDates);
      
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockedDates: formattedDates
        }),
      });
      
      const data = await response.json();
      console.log('API response:', data);
      
      setResult(data);
      
      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Blocked dates saved successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to save blocked dates',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: error.message });
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" maxW="600px" mx="auto" my={8}>
      <Heading size="lg" mb={6}>Test Blocked Dates</Heading>
      
      <VStack spacing={4} align="stretch">
        <Box>
          <Text mb={2}>Service ID:</Text>
          <Input 
            value={serviceId} 
            onChange={(e) => setServiceId(e.target.value)}
            placeholder="Enter service ID"
          />
        </Box>
        
        <Box>
          <Text mb={2}>Add Date:</Text>
          <HStack>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
            />
            <Button onClick={addDate}>Add</Button>
          </HStack>
        </Box>
        
        <Box>
          <Text mb={2}>Blocked Dates:</Text>
          {blockedDates.length > 0 ? (
            blockedDates.map((d, i) => (
              <HStack key={i} p={2} bg="gray.50" borderRadius="md" mb={2}>
                <Text flex="1">{new Date(d).toLocaleDateString()}</Text>
                <Button size="sm" colorScheme="red" onClick={() => removeDate(d)}>
                  Remove
                </Button>
              </HStack>
            ))
          ) : (
            <Text color="gray.500">No dates added yet</Text>
          )}
        </Box>
        
        <Button 
          colorScheme="blue" 
          onClick={saveBlockedDates} 
          isLoading={isLoading}
          isDisabled={blockedDates.length === 0}
        >
          Save Blocked Dates
        </Button>
        
        {result && (
          <Box mt={4} p={4} bg="gray.50" borderRadius="md">
            <Text fontWeight="bold" mb={2}>API Response:</Text>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85em' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Box>
        )}
      </VStack>
    </Box>
  );
} 