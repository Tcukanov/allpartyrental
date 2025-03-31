'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Select,
  FormControl,
  FormLabel,
  Input,
  IconButton,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FiClock, FiCalendar } from 'react-icons/fi';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ServiceAvailabilityCalendar = ({ service, onDateSelect, onTimeSelect, onDurationSelect }) => {
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(
    service?.minRentalHours ? service.minRentalHours : 1
  );
  const [availableTimes, setAvailableTimes] = useState([]);
  
  // Parse service availability days
  const availableDays = service?.availableDays || DAYS_OF_WEEK;
  const startHour = service?.availableHoursStart ? service.availableHoursStart : '09:00'; 
  const endHour = service?.availableHoursEnd ? service.availableHoursEnd : '17:00';
  const minHours = service?.minRentalHours ? service.minRentalHours : 1;
  const maxHours = service?.maxRentalHours ? service.maxRentalHours : 8;
  
  // Generate calendar days for current month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate time slots based on availability
  useEffect(() => {
    if (selectedDate) {
      generateAvailableTimeSlots();
    }
  }, [selectedDate]);
  
  const generateAvailableTimeSlots = () => {
    if (!selectedDate) return [];
    
    // Check if selected date's day is available
    const dayOfWeek = DAYS_OF_WEEK[selectedDate.getDay()];
    if (!availableDays.includes(dayOfWeek)) {
      setAvailableTimes([]);
      return;
    }
    
    // Parse start and end hours
    const startTimeParts = startHour.split(':').map(Number);
    const endTimeParts = endHour.split(':').map(Number);
    
    const startTimeMinutes = startTimeParts[0] * 60 + (startTimeParts[1] || 0);
    const endTimeMinutes = endTimeParts[0] * 60 + (endTimeParts[1] || 0);
    
    // Generate 30-minute intervals
    const slots = [];
    for (let mins = startTimeMinutes; mins < endTimeMinutes; mins += 30) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(timeStr);
    }
    
    setAvailableTimes(slots);
  };
  
  const getDurationOptions = () => {
    const options = [];
    for (let i = minHours; i <= maxHours; i++) {
      options.push(i);
    }
    return options;
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const handleDateClick = (date) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    
    // Don't allow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selected < today) {
      toast({
        title: "Invalid date",
        description: "You cannot select a past date",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Check if the selected day is available
    const dayOfWeek = DAYS_OF_WEEK[selected.getDay()];
    if (!availableDays.includes(dayOfWeek)) {
      toast({
        title: "Not available",
        description: `This service is not available on ${dayOfWeek}s`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedDate(selected);
    setSelectedTime(''); // Reset time when date changes
    
    if (onDateSelect) {
      onDateSelect(selected);
    }
  };
  
  const handleTimeSelect = (e) => {
    const time = e.target.value;
    setSelectedTime(time);
    
    if (onTimeSelect) {
      onTimeSelect(time);
    }
  };
  
  const handleDurationSelect = (e) => {
    const duration = Number(e.target.value);
    setSelectedDuration(duration);
    
    if (onDurationSelect) {
      onDurationSelect(duration);
    }
  };
  
  // Render calendar
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<GridItem key={`empty-${i}`} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
      const isAvailable = availableDays.includes(dayOfWeek);
      const isPast = date < today;
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;
      
      days.push(
        <GridItem key={day}>
          <Button
            onClick={() => handleDateClick(day)}
            w="full"
            h="40px"
            variant={isSelected ? "solid" : "outline"}
            colorScheme={isSelected ? "blue" : "gray"}
            bg={isSelected ? "blue.500" : isAvailable ? "white" : "gray.100"}
            color={isSelected ? "white" : isPast ? "gray.400" : isAvailable ? "black" : "gray.600"}
            opacity={isPast || !isAvailable ? 0.6 : 1}
            cursor={isPast || !isAvailable ? "not-allowed" : "pointer"}
            _hover={{
              bg: isPast || !isAvailable ? (isSelected ? "blue.500" : "gray.100") : (isSelected ? "blue.600" : "blue.50")
            }}
            disabled={isPast || !isAvailable}
          >
            {day}
          </Button>
        </GridItem>
      );
    }
    
    return days;
  };
  
  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} w="100%">
      <VStack spacing={4} align="stretch">
        <Heading size="md" mb={2}>Select Date & Time</Heading>
        
        <Box>
          <HStack justify="space-between" mb={2}>
            <IconButton
              icon={<ChevronLeftIcon />}
              onClick={handlePrevMonth}
              aria-label="Previous month"
            />
            <Heading size="sm">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Heading>
            <IconButton
              icon={<ChevronRightIcon />}
              onClick={handleNextMonth}
              aria-label="Next month"
            />
          </HStack>
          
          <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={4}>
            {DAYS_OF_WEEK.map((day, i) => (
              <GridItem key={i} textAlign="center" fontWeight="bold" fontSize="sm">
                {day.substring(0, 1)}
              </GridItem>
            ))}
            {renderCalendar()}
          </Grid>
        </Box>
        
        <VStack spacing={4} align="stretch">
          <Flex wrap="wrap" gap={2} mb={2}>
            <Badge colorScheme="blue">Available Days: </Badge>
            {availableDays.map((day, i) => (
              <Badge key={i} colorScheme="green">{day}</Badge>
            ))}
          </Flex>
          
          <FormControl isDisabled={!selectedDate}>
            <FormLabel>Select Time</FormLabel>
            <Select 
              placeholder="Select time" 
              value={selectedTime} 
              onChange={handleTimeSelect}
              icon={<FiClock />}
            >
              {availableTimes.map((time, i) => (
                <option key={i} value={time}>{time}</option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl isDisabled={!selectedDate}>
            <FormLabel>Rental Duration (hours)</FormLabel>
            <Select 
              value={selectedDuration} 
              onChange={handleDurationSelect}
            >
              {getDurationOptions().map((hours) => (
                <option key={hours} value={hours}>{hours} hour{hours !== 1 ? 's' : ''}</option>
              ))}
            </Select>
          </FormControl>
          
          {selectedDate && selectedTime && (
            <Box borderWidth="1px" borderRadius="md" p={3} bg="blue.50">
              <Text fontWeight="bold">Selected Booking</Text>
              <Flex align="center" mt={1}>
                <FiCalendar />
                <Text ml={2}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </Flex>
              <Flex align="center" mt={1}>
                <FiClock />
                <Text ml={2}>
                  {selectedTime} ({selectedDuration} hour{selectedDuration !== 1 ? 's' : ''})
                </Text>
              </Flex>
            </Box>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default ServiceAvailabilityCalendar; 