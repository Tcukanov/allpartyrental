"use client";

import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useToast,
  HStack,
  IconButton,
  Grid,
  GridItem,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, AddIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

export default function CalendarPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleAddEvent = () => {
    router.push('/client/create-party');
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Calendar</Heading>
          <Text color="gray.600" mt={2}>
            Manage your party schedule and important dates
          </Text>
        </Box>

        <Box>
          <HStack justify="space-between" mb={6}>
            <HStack>
              <IconButton
                icon={<ChevronLeftIcon />}
                onClick={handlePreviousMonth}
                aria-label="Previous month"
              />
              <Heading size="md">{format(currentDate, 'MMMM yyyy')}</Heading>
              <IconButton
                icon={<ChevronRightIcon />}
                onClick={handleNextMonth}
                aria-label="Next month"
              />
            </HStack>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="brand"
              onClick={handleAddEvent}
            >
              Add Event
            </Button>
          </HStack>

          <Grid templateColumns="repeat(7, 1fr)" gap={1}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <GridItem key={day} textAlign="center" fontWeight="bold" py={2}>
                {day}
              </GridItem>
            ))}
            {daysInMonth.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isSameMonthDay = isSameDay(day, currentDate);

              return (
                <GridItem
                  key={index}
                  p={2}
                  minH="100px"
                  borderWidth="1px"
                  borderColor="gray.200"
                  bg={!isCurrentMonth ? 'gray.50' : 'white'}
                  position="relative"
                >
                  <Text
                    fontSize="sm"
                    color={!isCurrentMonth ? 'gray.400' : 'gray.700'}
                    fontWeight={isCurrentDay ? 'bold' : 'normal'}
                  >
                    {format(day, 'd')}
                  </Text>
                  {isSameMonthDay && (
                    <Badge
                      colorScheme="brand"
                      position="absolute"
                      top={1}
                      right={1}
                    >
                      Today
                    </Badge>
                  )}
                </GridItem>
              );
            })}
          </Grid>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Upcoming Events</Heading>
          <VStack spacing={4} align="stretch">
            <Box
              p={4}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              _hover={{ borderColor: 'brand.500' }}
              cursor="pointer"
            >
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold">Birthday Party</Text>
                  <Text fontSize="sm" color="gray.600">March 25, 2024</Text>
                </Box>
                <Badge colorScheme="brand">Upcoming</Badge>
              </HStack>
            </Box>

            <Box
              p={4}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              _hover={{ borderColor: 'brand.500' }}
              cursor="pointer"
            >
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold">Wedding Reception</Text>
                  <Text fontSize="sm" color="gray.600">April 15, 2024</Text>
                </Box>
                <Badge colorScheme="brand">Upcoming</Badge>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 