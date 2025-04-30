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
  Textarea,
  Divider
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FiClock, FiCalendar } from 'react-icons/fi';
import AddOnSelector from './AddOnSelector';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ServiceAvailabilityCalendar = ({ service, onDateSelect, onTimeSelect, onDurationSelect, onCommentChange, onAddressChange, onAddonsChange }) => {
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
  
  // Parse blocked dates
  const blockedDates = service?.blockedDates 
    ? service.blockedDates.map(dateStr => {
        const date = new Date(dateStr);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }) 
    : [];
  
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
    
    // Check if date is blocked
    const isBlocked = blockedDates.some(
      blockedDate => blockedDate.getTime() === selected.setHours(0, 0, 0, 0)
    );
    
    if (isBlocked) {
      toast({
        title: "Not available",
        description: "This date has been blocked by the provider",
        status: "warning",
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
  
  const handleAddonsChange = (selectedAddons) => {
    if (onAddonsChange) {
      onAddonsChange(selectedAddons);
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
      
      // Check if date is blocked
      const isBlocked = blockedDates.some(
        blockedDate => blockedDate.getTime() === date.setHours(0, 0, 0, 0)
      );
      
      days.push(
        <GridItem key={day}>
          <Button
            onClick={() => handleDateClick(day)}
            w="full"
            h="40px"
            variant={isSelected ? "solid" : "outline"}
            colorScheme={isSelected ? "blue" : "gray"}
            bg={isSelected ? "blue.500" : isBlocked ? "red.100" : isAvailable ? "white" : "gray.100"}
            color={isSelected ? "white" : isPast ? "gray.400" : isBlocked ? "red.500" : isAvailable ? "black" : "gray.600"}
            opacity={isPast || !isAvailable || isBlocked ? 0.6 : 1}
            cursor={(isPast || !isAvailable || isBlocked) ? "not-allowed" : "pointer"}
            _hover={{
              bg: (isPast || !isAvailable || isBlocked) ? (isSelected ? "blue.500" : isBlocked ? "red.100" : "gray.100") : (isSelected ? "blue.600" : "blue.50")
            }}
            disabled={isPast || !isAvailable || isBlocked}
          >
            {day}
          </Button>
        </GridItem>
      );
    }
    
    return days;
  };
  
  return (
    <VStack spacing={6} align="stretch">
      {/* Month selector */}
      <Flex justify="space-between" align="center">
        <IconButton
          icon={<ChevronLeftIcon />}
          onClick={handlePrevMonth}
          aria-label="Previous month"
        />
        <Heading size="md">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Heading>
        <IconButton
          icon={<ChevronRightIcon />}
          onClick={handleNextMonth}
          aria-label="Next month"
        />
      </Flex>
      
      {/* Days of the week header */}
      <Grid templateColumns="repeat(7, 1fr)" gap={2} textAlign="center">
        {DAYS_OF_WEEK.map((day, index) => (
          <GridItem key={index}>
            <Text fontWeight="bold">{day.substring(0, 3)}</Text>
          </GridItem>
        ))}
      </Grid>
      
      {/* Calendar grid */}
      <Grid templateColumns="repeat(7, 1fr)" gap={2} mb={4}>
        {renderCalendar()}
      </Grid>
      
      {/* Time and duration selection */}
      {selectedDate && (
        <Box>
          {/* Selected date display */}
          <Flex align="center" mb={4} bg="blue.50" p={3} borderRadius="md">
            <Box as={FiCalendar} size="20px" color="blue.500" mr={2} />
            <Text fontWeight="medium">
              Selected: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </Flex>
          
          <Box borderWidth="1px" borderRadius="md" p={4}>
            <VStack spacing={4} align="stretch">
              {/* Time selection */}
              <FormControl isRequired>
                <FormLabel htmlFor="timeSelect" display="flex" alignItems="center">
                  <Box as={FiClock} mr={2} color="blue.500" />
                  Available Time Slots
                </FormLabel>
                
                {availableTimes.length > 0 ? (
                  <Select 
                    id="timeSelect"
                    placeholder="Select a time" 
                    value={selectedTime} 
                    onChange={handleTimeSelect}
                  >
                    {availableTimes.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Text color="red.500">No available times for this date</Text>
                )}
              </FormControl>
              
              {/* Duration selection */}
              <FormControl isRequired>
                <FormLabel htmlFor="durationSelect">Duration (hours)</FormLabel>
                <Select 
                  id="durationSelect"
                  value={selectedDuration} 
                  onChange={handleDurationSelect}
                >
                  {getDurationOptions().map(hours => (
                    <option key={hours} value={hours}>
                      {hours} hour{hours !== 1 ? 's' : ''}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Event Address */}
              <FormControl isRequired>
                <FormLabel htmlFor="addressInput">Event address</FormLabel>
                <Input
                  id="addressInput"
                  placeholder="Enter the full address of your event"
                  onChange={(e) => {
                    if (onAddressChange) {
                      onAddressChange(e.target.value);
                    }
                  }}
                />
              </FormControl>
              
              {/* Description/Additional Comments */}
              <FormControl>
                <FormLabel htmlFor="commentInput">Description or additional comments</FormLabel>
                <Textarea
                  id="commentInput"
                  placeholder="Add any special requirements or information for the provider"
                  resize="vertical"
                  rows={3}
                  onChange={(e) => {
                    if (onCommentChange) {
                      onCommentChange(e.target.value);
                    }
                  }}
                />
              </FormControl>
            </VStack>
          </Box>
          
          {/* Service Add-ons */}
          {service && service.id && (
            <AddOnSelector 
              serviceId={service.id}
              onAddonsChange={handleAddonsChange}
            />
          )}
        </Box>
      )}
      
      {/* Available days info */}
      <Box mt={4}>
        <Text fontWeight="bold" mb={2}>Available Days:</Text>
        <Flex flexWrap="wrap" gap={2}>
          {DAYS_OF_WEEK.map(day => (
            <Badge 
              key={day} 
              colorScheme={availableDays.includes(day) ? "green" : "gray"}
              opacity={availableDays.includes(day) ? 1 : 0.6}
            >
              {day}
            </Badge>
          ))}
        </Flex>
      </Box>
    </VStack>
  );
};

export default ServiceAvailabilityCalendar; 