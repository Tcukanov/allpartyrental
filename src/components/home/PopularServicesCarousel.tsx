"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Image,
  Button,
  IconButton,
  Badge,
  VStack,
  HStack,
  useColorModeValue,
  Skeleton,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@chakra-ui/icons';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  photos: string[];
  category: {
    name: string;
  };
  provider: {
    businessName?: string;
    user: {
      name: string;
    };
  };
}

export default function PopularServicesCarousel() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Number of items to show per view
  const itemsPerView = { base: 1, md: 2, lg: 3 };
  const [itemsToShow, setItemsToShow] = useState(3);

  useEffect(() => {
    fetchPopularServices();
  }, []);

  // Handle responsive items per view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsToShow(1);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(2);
      } else {
        setItemsToShow(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPopularServices = async () => {
    try {
      setLoading(true);
      // Fetch services ordered by view count (most popular first)
      const response = await fetch('/api/services/popular?limit=12');
      const data = await response.json();
      
      if (data.success && data.data) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Error fetching popular services:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (isAnimating || services.length <= itemsToShow) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => 
      prev >= services.length - itemsToShow ? 0 : prev + 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating || services.length <= itemsToShow) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => 
      prev === 0 ? services.length - itemsToShow : prev - 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (services.length <= itemsToShow) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, services.length, itemsToShow, isAnimating]);

  if (loading) {
    return (
      <Flex gap={6} w="full" overflow="hidden">
        {[1, 2, 3].map((i) => (
          <Box key={i} flex="1" minW={{ base: '100%', md: '45%', lg: '30%' }}>
            <Skeleton height="400px" borderRadius="lg" />
          </Box>
        ))}
      </Flex>
    );
  }

  if (!services.length) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">No services available at the moment.</Text>
      </Box>
    );
  }

  return (
    <Box position="relative" w="full">
      {/* Navigation buttons */}
      {services.length > itemsToShow && (
        <>
          <IconButton
            aria-label="Previous"
            icon={<ChevronLeftIcon boxSize={8} />}
            position="absolute"
            left={{ base: -2, md: -12 }}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            onClick={prevSlide}
            colorScheme="brand"
            rounded="full"
            size="lg"
            boxShadow="lg"
            _hover={{ transform: 'translateY(-50%) scale(1.1)' }}
          />
          <IconButton
            aria-label="Next"
            icon={<ChevronRightIcon boxSize={8} />}
            position="absolute"
            right={{ base: -2, md: -12 }}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            onClick={nextSlide}
            colorScheme="brand"
            rounded="full"
            size="lg"
            boxShadow="lg"
            _hover={{ transform: 'translateY(-50%) scale(1.1)' }}
          />
        </>
      )}

      {/* Carousel container */}
      <Box overflow="hidden" w="full" px={{ base: 4, md: 0 }}>
        <Flex
          gap={6}
          transition="transform 0.5s ease-in-out"
          transform={`translateX(-${currentIndex * (100 / itemsToShow)}%)`}
        >
          {services.map((service) => (
            <Box
              key={service.id}
              minW={{
                base: '100%',
                md: `calc(${100 / itemsToShow}% - ${(6 * (itemsToShow - 1)) / itemsToShow}px)`,
              }}
              flex="0 0 auto"
            >
              <Card
                bg={cardBg}
                borderRadius="xl"
                overflow="hidden"
                boxShadow="lg"
                transition="all 0.3s"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: '2xl',
                }}
                height="100%"
              >
                <Box position="relative" height="240px" overflow="hidden">
                  <Image
                    src={service.photos[0] || '/service-placeholder.jpg'}
                    alt={service.name}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                    transition="transform 0.3s"
                    _hover={{ transform: 'scale(1.05)' }}
                  />
                  <Badge
                    position="absolute"
                    top={4}
                    right={4}
                    colorScheme="brand"
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {service.category.name}
                  </Badge>
                </Box>

                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Heading size="md" noOfLines={2} minH="3em">
                      {service.name}
                    </Heading>

                    <Text
                      color="gray.600"
                      fontSize="sm"
                      noOfLines={2}
                      minH="2.5em"
                      _dark={{ color: 'gray.300' }}
                    >
                      {service.description}
                    </Text>

                    <Flex align="center" justify="space-between" pt={2}>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.500">
                          Starting at
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                          ${Number(service.price).toFixed(2)}
                        </Text>
                      </VStack>

                      <Button
                        as={Link}
                        href={`/services/${service.id}`}
                        colorScheme="brand"
                        size="sm"
                        rightIcon={<ChevronRightIcon />}
                        _hover={{ transform: 'scale(1.05)' }}
                      >
                        View Details
                      </Button>
                    </Flex>

                    <Divider />

                    <HStack fontSize="xs" color="gray.500">
                      <Text noOfLines={1}>
                        By {service.provider.businessName || service.provider.user.name}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Carousel indicators */}
      {services.length > itemsToShow && (
        <Flex justify="center" mt={8} gap={2}>
          {Array.from({ length: Math.ceil(services.length - itemsToShow + 1) }).map((_, index) => (
            <Box
              key={index}
              w={currentIndex === index ? '8' : '2'}
              h='2'
              borderRadius="full"
              bg={currentIndex === index ? 'brand.500' : 'gray.300'}
              cursor="pointer"
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }
              }}
              transition="all 0.3s"
              _hover={{ bg: currentIndex === index ? 'brand.600' : 'gray.400' }}
            />
          ))}
        </Flex>
      )}

      {/* View All Button */}
      <Flex justify="center" mt={10}>
        <Button
          as={Link}
          href="/services"
          size="lg"
          colorScheme="brand"
          variant="outline"
          rightIcon={<ChevronRightIcon />}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          }}
        >
          View All Services
        </Button>
      </Flex>
    </Box>
  );
}

