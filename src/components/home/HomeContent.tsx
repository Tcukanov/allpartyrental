"use client";

import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, Image, Button, useColorModeValue, Center, Icon, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Avatar, Stack, Flex, Divider, Circle, IconButton, HStack } from '@chakra-ui/react';
import LocationServiceSearch from '@/components/search/LocationServiceSearch';
import Link from 'next/link';
import { FiSearch, FiCheckCircle, FiClock, FiPackage, FiShield, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useState, useEffect, useCallback } from 'react';
import { ChevronRightIcon, ArrowForwardIcon } from '@chakra-ui/icons';

export default function HomeContent() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue('gray.50', 'gray.900');

  // Testimonial slideshow state
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      location: "Los Angeles, CA",
      text: "AllPartyRent made my daughter's birthday party a breeze! Found an amazing bounce house and catering all in one place. The vendors were professional and everything was set up perfectly.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      id: 2,
      name: "Michael Thomas",
      location: "New York, NY",
      text: "I was skeptical about booking party services online, but AllPartyRent exceeded my expectations. The decorations were stunning and matched exactly what we asked for. Will definitely use again!",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      location: "Miami, FL",
      text: "We found the perfect entertainers for our son's birthday through AllPartyRent. The booking process was simple and the kids had an absolute blast! Saved us so much time compared to calling vendors individually.",
      avatar: "https://randomuser.me/api/portraits/women/63.jpg"
    }
  ];

  const photos = [
    "https://images.unsplash.com/photo-1562967005-a3c85514d3e9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?q=80&w=2848&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  ];
  
  // Background slideshow state
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  
  // Background slideshow images (update paths to the correct filenames)
  const backgroundImages = [
    '/images/main/1.jpeg',
    '/images/main/2.jpeg',
    '/images/main/3.jpeg'
  ];
  
  // Auto transition for testimonials and background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(0);
  const slides = [
    {
      image: '/images/main/1.jpeg',
      title: 'Find Everything for Your Perfect Party',
      subtitle: 'From venues and decorations to catering and entertainment',
    },
    {
      image: '/images/main/2.jpeg',
      title: 'Book Your Amazing Party With Confidence',
      subtitle: 'Verified vendors, secure payments, and reliable service',
    },
    {
      image: '/images/main/3.jpeg',
      title: 'Create Unforgettable Memories',
      subtitle: 'Everything you need for special celebrations in one place',
    },
  ];

  const nextSlide = useCallback(() => {
    setPrevSlide(currentSlide);
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [currentSlide, slides.length]);

  const prevSlideAction = () => {
    setPrevSlide(currentSlide);
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <Box>
      {/* Hero Section with Slideshow */}
      <Box 
        position="relative" 
        height={{ base: "600px", md: "700px" }}
        overflow="hidden"
      >
        {/* Slideshow */}
        {slides.map((slide, index) => (
          <Box
            key={index}
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            opacity={index === currentSlide ? 1 : 0}
            visibility={index === currentSlide || index === prevSlide ? "visible" : "hidden"}
            transition="opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)"
            zIndex={index === currentSlide ? 1 : 0}
          >
            {/* Background image with overlay */}
            <Box
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              bgImage={`url(${slide.image})`}
              bgPosition="center"
              bgSize="cover"
              _after={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                bgGradient: "linear(to-b, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
              }}
            />
            
            {/* Content */}
            <Container 
              maxW="container.xl" 
              height="100%" 
              position="relative" 
              zIndex="1"
            >
              <VStack 
                height="100%" 
                justifyContent="center" 
                alignItems={{ base: "center", md: "flex-start" }}
                textAlign={{ base: "center", md: "left" }}
                spacing={6}
                px={{ base: 4, md: 0 }}
              >
                <Heading
                  as="h1"
                  fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                  fontWeight="bold"
                  color="white"
                  maxW={{ base: "100%", md: "70%", lg: "60%" }}
                  lineHeight="1.2"
                  textShadow="0px 2px 4px rgba(0,0,0,0.3)"
                  textTransform="uppercase"
                >
                  {slide.title}
                </Heading>
                
                <Text
                  fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
                  color="white"
                  maxW={{ base: "100%", md: "60%", lg: "50%" }}
                  textShadow="0px 1px 3px rgba(0,0,0,0.3)"
                >
                  {slide.subtitle}
                </Text>
                
                <VStack spacing={4} pt={4} maxW={{ base: "100%", md: "80%", lg: "60%" }}>
                  <Heading
                    as="h3"
                    fontSize={{ base: "xl", md: "2xl" }}
                    color="white"
                    textShadow="0px 1px 3px rgba(0,0,0,0.4)"
                  >
                    Find the Perfect Service for Your Event
                  </Heading>
                  
                  <Box 
                    bg="white" 
                    p={{ base: 0, md: 0 }}
                    borderRadius="xl" 
                    boxShadow="2xl"
                    w="full"
                    _dark={{ bg: 'gray.800' }}
                    overflow="hidden"
                    maxW={{ base: "100%", md: "900px" }}
                    mx="auto"
                    transform="translateY(0)"
                    transition="transform 0.3s ease-in-out"
                    _hover={{ transform: "translateY(-2px)" }}
                  >
                    <LocationServiceSearch />
                  </Box>
                </VStack>
              </VStack>
            </Container>
          </Box>
        ))}
      </Box>

      {/* How It Works Section - Modern Design */}
      <Box 
        py={{ base: 16, md: 24 }} 
        bg="white"
        _dark={{ bg: 'gray.900' }}
        position="relative"
        overflow="hidden"
      >
        {/* Subtle background pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.03"
          bgGradient="linear(to-br, gray.200, transparent)"
          _dark={{ bgGradient: "linear(to-br, gray.700, transparent)" }}
        />
        
        <Container maxW="container.xl" position="relative">
          <VStack spacing={{ base: 14, md: 20 }}>
            {/* Section header */}
            <VStack spacing={4} textAlign="center" maxW="700px" mx="auto">
              <Text 
                color="brand.500" 
                fontWeight="bold" 
                fontSize="md" 
                textTransform="uppercase" 
                letterSpacing="wider"
              >
                Simple Process
              </Text>
              <Heading 
                as="h2" 
                fontSize={{ base: "3xl", md: "4xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                How It Works
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="600px" pt={2}>
                Booking party services has never been easier. Follow these simple steps to create your perfect celebration.
              </Text>
            </VStack>
            
            {/* Process steps */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 10, md: 8 }} w="full" px={{ base: 4, md: 0 }}>
              {[
                {
                  step: 1,
                  title: "Search & Compare",
                  description: "Browse services in your area and compare options based on ratings, prices, and availability.",
                  icon: FiSearch
                },
                {
                  step: 2,
                  title: "Book Instantly",
                  description: "Choose your date and book instantly with our secure payment system. No waiting for quotes.",
                  icon: FiCheckCircle
                },
                {
                  step: 3,
                  title: "Enjoy Your Event",
                  description: "Relax and enjoy your celebration while our trusted providers handle everything for you.",
                  icon: FiClock
                }
              ].map((step) => (
                <VStack 
                  key={step.step}
                  align={{ base: "center", md: "start" }}
                  textAlign={{ base: "center", md: "left" }}
                  spacing={5}
                  p={6}
                  borderRadius="lg"
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                  boxShadow="lg"
                  position="relative"
                  transition="all 0.3s"
                  _hover={{ transform: "translateY(-8px)", boxShadow: "xl" }}
                >
                  {/* Step number */}
                  <Circle 
                    size="40px" 
                    bg="brand.500" 
                    color="white" 
                    fontWeight="bold"
                    fontSize="lg"
                    position="absolute"
                    top="-20px"
                    left={{ base: "calc(50% - 20px)", md: "20px" }}
                  >
                    {step.step}
                  </Circle>
                  
                  {/* Icon */}
                  <Circle size="70px" bg="brand.50" color="brand.500" _dark={{ bg: "gray.700" }}>
                    <Icon as={step.icon} boxSize={8} />
                  </Circle>
                  
                  {/* Content */}
                  <Heading as="h3" size="md" fontWeight="bold">
                    {step.title}
                  </Heading>
                  
                  <Text color="gray.600" _dark={{ color: "gray.300" }}>
                    {step.description}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
            
            {/* Call to action */}
            <Box 
              mt={{ base: 8, md: 14 }}
              p={{ base: 6, md: 8 }}
              borderRadius="xl"
              bgGradient="linear(to-r, brand.500, brand.600)"
              color="white"
              textAlign="center"
              boxShadow="xl"
              maxW="900px"
              w="full"
              mx="auto"
            >
              <Heading size="lg" mb={4}>Ready to start planning your perfect event?</Heading>
              <Text fontSize="lg" mb={6} maxW="600px" mx="auto">
                Join thousands of happy customers who have used our platform to find the best party services.
              </Text>
              <Button 
                as={Link}
                href="/services"
                colorScheme="whiteAlpha"
                size="lg"
                fontWeight="bold"
                px={8}
                _hover={{ bg: "white", color: "brand.500" }}
              >
                Explore All Services
              </Button>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Testimonials - Modern Design */}
      <Box 
        py={{ base: 16, md: 24 }} 
        bg="gray.50"
        _dark={{ bg: "gray.800" }}
        position="relative"
        overflow="hidden"
      >
        {/* Background gradient */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bgGradient="linear(to-br, brand.50, transparent 70%)"
          _dark={{ bgGradient: "linear(to-br, brand.900, transparent 70%)" }}
          opacity="0.6"
        />
        
        <Container maxW="container.xl" position="relative" zIndex="1">
          {/* Section header */}
          <VStack spacing={{ base: 12, md: 16 }}>
            <VStack spacing={4} textAlign="center" maxW="700px">
              <Text 
                color="brand.500" 
                fontWeight="bold" 
                fontSize="md"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Testimonials
              </Text>
              <Heading 
                fontSize={{ base: "3xl", md: "4xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                What Our Customers Say
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="600px" pt={2}>
                Don't just take our word for it. Here's what people love about our platform.
              </Text>
            </VStack>
            
            {/* Testimonial carousel */}
            <Box 
              position="relative" 
              w="full" 
              maxW="1100px" 
              mx="auto"
              px={{ base: 4, md: 0 }}
            >
              <SimpleGrid 
                columns={{ base: 1, md: 2 }} 
                spacing={{ base: 8, md: 10 }}
                alignItems="center"
              >
                {/* Left side: Image gallery */}
                <Box 
                  position="relative" 
                  height={{ base: "300px", md: "450px" }}
                  overflow="hidden"
                  borderRadius="xl"
                  boxShadow="2xl"
                >
                  {photos.map((photo, index) => (
                    <Box
                      key={index}
                      position="absolute"
                      top="0"
                      left="0"
                      width="100%"
                      height="100%"
                      opacity={index === currentTestimonial ? 1 : 0}
                      transition="opacity 1s ease-in-out"
                      bgImage={`url(${photo})`}
                      bgSize="cover"
                      bgPosition="center"
                      transform={index === currentTestimonial ? "scale(1)" : "scale(1.1)"}
                      transformOrigin="center"
                      style={{ transitionProperty: "opacity, transform", transitionDuration: "1.2s" }}
                    />
                  ))}
                  
                  {/* Photo navigation */}
                  <Flex
                    position="absolute"
                    bottom="4"
                    left="0"
                    right="0"
                    justify="center"
                    zIndex="1"
                  >
                    {photos.map((_, index) => (
                      <Box
                        key={index}
                        w="2.5"
                        h="2.5"
                        borderRadius="full"
                        bg={index === currentTestimonial ? "white" : "whiteAlpha.600"}
                        mx="1"
                        cursor="pointer"
                        onClick={() => setCurrentTestimonial(index)}
                        transition="all 0.3s"
                        _hover={{ transform: "scale(1.2)" }}
                      />
                    ))}
                  </Flex>
                </Box>
                
                {/* Right side: Testimonial cards */}
                <Box 
                  position="relative" 
                  height={{ base: "auto", md: "450px" }}
                  display="flex"
                  alignItems="center"
                >
                  {testimonials.map((testimonial, index) => (
                    <Box
                      key={testimonial.id}
                      position={index === currentTestimonial ? "relative" : "absolute"}
                      visibility={index === currentTestimonial ? "visible" : "hidden"}
                      opacity={index === currentTestimonial ? 1 : 0}
                      transform={`translateX(${index === currentTestimonial ? 0 : 50}px)`}
                      transition="all 0.5s ease"
                      bg="white"
                      _dark={{ bg: "gray.700" }}
                      p={{ base: 6, md: 8 }}
                      borderRadius="lg"
                      boxShadow="xl"
                      w="full"
                    >
                      {/* Quote icon */}
                      <Icon 
                        viewBox="0 0 24 24" 
                        boxSize={10} 
                        color="brand.100"
                        mb={6}
                        opacity="0.6"
                      >
                        <path
                          fill="currentColor"
                          d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"
                        />
                      </Icon>
                      
                      {/* Testimonial content */}
                      <Text 
                        fontSize={{ base: "lg", md: "xl" }} 
                        fontWeight="medium" 
                        lineHeight="1.6"
                        color="gray.700"
                        _dark={{ color: "gray.100" }}
                        mb={8}
                      >
                        "{testimonial.text}"
                      </Text>
                      
                      {/* Customer info */}
                      <Flex align="center">
                        <Avatar 
                          src={testimonial.avatar} 
                          name={testimonial.name} 
                          size="md" 
                          mr={4}
                          border="2px solid"
                          borderColor="brand.500"
                        />
                        <Box>
                          <Text 
                            fontWeight="bold"
                            fontSize="md"
                          >
                            {testimonial.name}
                          </Text>
                          <Text 
                            fontSize="sm" 
                            color="gray.500"
                            _dark={{ color: "gray.400" }}
                          >
                            {testimonial.location}
                          </Text>
                        </Box>
                      </Flex>
                      
                      {/* Navigation buttons */}
                      <Flex 
                        position="absolute" 
                        bottom="8" 
                        right="8" 
                        gap={2}
                      >
                        <IconButton
                          aria-label="Previous testimonial"
                          icon={<Icon as={FiChevronLeft} boxSize={5} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="brand"
                          onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                        />
                        <IconButton
                          aria-label="Next testimonial"
                          icon={<Icon as={FiChevronRight} boxSize={5} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="brand"
                          onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                        />
                      </Flex>
                    </Box>
                  ))}
                </Box>
              </SimpleGrid>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* FAQ Section - Modern Design */}
      <Box 
        py={{ base: 16, md: 24 }} 
        bg="white"
        _dark={{ bg: "gray.900" }}
        position="relative"
        overflow="hidden"
      >
        {/* Background pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bgGradient="radial(circle at 20% 100%, brand.50, transparent 60%)"
          _dark={{ bgGradient: "radial(circle at 20% 100%, gray.800, transparent 60%)" }}
          opacity="0.7"
        />
        
        <Container maxW="container.xl" position="relative">
          <VStack spacing={{ base: 10, md: 16 }}>
            {/* Section header */}
            <VStack spacing={4} textAlign="center" maxW="700px">
              <Text 
                color="brand.500" 
                fontWeight="bold"
                fontSize="md"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Questions Answered
              </Text>
              <Heading 
                fontSize={{ base: "3xl", md: "4xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Frequently Asked Questions
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="600px" pt={2}>
                Get answers to the most common questions about our services.
              </Text>
            </VStack>
            
            {/* FAQ accordion */}
            <Box 
              w="full" 
              maxW="900px" 
              mx="auto"
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 6, md: 10 }}>
                <Box>
                  <Accordion 
                    allowToggle 
                    borderColor={borderColor}
                    bg="white"
                    _dark={{ bg: "gray.800" }}
                    borderRadius="xl"
                    boxShadow="lg"
                    overflow="hidden"
                  >
                    <AccordionItem border="none" borderBottom="1px solid" borderColor="gray.100" _dark={{ borderColor: "gray.700" }}>
                      <h2>
                        <AccordionButton py={5} _hover={{ bg: "gray.50" }} _dark={{ _hover: { bg: "gray.700" } }}>
                          <Box flex="1" textAlign="left" fontWeight="semibold">
                            How does AllPartyRent work?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={6} pt={2} px={6} bg="gray.50" _dark={{ bg: "gray.700" }}>
                        AllPartyRent is a marketplace that connects party planners with local service providers. 
                        Browse services by location, book directly through our platform, and pay securely online. 
                        We verify all vendors to ensure quality service for your event.
                      </AccordionPanel>
                    </AccordionItem>
                    
                    <AccordionItem border="none" borderBottom="1px solid" borderColor="gray.100" _dark={{ borderColor: "gray.700" }}>
                      <h2>
                        <AccordionButton py={5} _hover={{ bg: "gray.50" }} _dark={{ _hover: { bg: "gray.700" } }}>
                          <Box flex="1" textAlign="left" fontWeight="semibold">
                            Can I cancel or modify my booking?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={6} pt={2} px={6} bg="gray.50" _dark={{ bg: "gray.700" }}>
                        Yes, you can modify or cancel your booking through your account dashboard. 
                        Cancellation policies vary by vendor, but most allow free cancellation up to 48 hours 
                        before your event. Check the specific terms when booking.
                      </AccordionPanel>
                    </AccordionItem>
                    
                    <AccordionItem border="none">
                      <h2>
                        <AccordionButton py={5} _hover={{ bg: "gray.50" }} _dark={{ _hover: { bg: "gray.700" } }}>
                          <Box flex="1" textAlign="left" fontWeight="semibold">
                            Are the vendors insured?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={6} pt={2} px={6} bg="gray.50" _dark={{ bg: "gray.700" }}>
                        All vendors on our platform are required to have appropriate insurance coverage. 
                        For bounce houses and other equipment rentals, vendors must meet safety standards 
                        and have liability insurance. You can request insurance verification directly from vendors.
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
                
                <Box>
                  <Accordion 
                    allowToggle 
                    borderColor={borderColor}
                    bg="white"
                    _dark={{ bg: "gray.800" }}
                    borderRadius="xl"
                    boxShadow="lg"
                    overflow="hidden"
                  >
                    <AccordionItem border="none" borderBottom="1px solid" borderColor="gray.100" _dark={{ borderColor: "gray.700" }}>
                      <h2>
                        <AccordionButton py={5} _hover={{ bg: "gray.50" }} _dark={{ _hover: { bg: "gray.700" } }}>
                          <Box flex="1" textAlign="left" fontWeight="semibold">
                            How far in advance should I book?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={6} pt={2} px={6} bg="gray.50" _dark={{ bg: "gray.700" }}>
                        We recommend booking at least 2-3 weeks in advance, especially for weekend events 
                        or during peak season (summer months and holidays). Some popular vendors may require 
                        even earlier booking. Last-minute bookings are possible but selection may be limited.
                      </AccordionPanel>
                    </AccordionItem>
                    
                    <AccordionItem border="none" borderBottom="1px solid" borderColor="gray.100" _dark={{ borderColor: "gray.700" }}>
                      <h2>
                        <AccordionButton py={5} _hover={{ bg: "gray.50" }} _dark={{ _hover: { bg: "gray.700" } }}>
                          <Box flex="1" textAlign="left" fontWeight="semibold">
                            What if something goes wrong with my booking?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={6} pt={2} px={6} bg="gray.50" _dark={{ bg: "gray.700" }}>
                        Our customer support team is available to help resolve any issues. We offer a satisfaction 
                        guarantee and can assist with vendor communication, rescheduling, or refunds if services 
                        don't meet expectations. Contact us immediately if you encounter any problems.
                      </AccordionPanel>
                    </AccordionItem>
                    
                    <AccordionItem border="none">
                      <h2>
                        <AccordionButton py={5} _hover={{ bg: "gray.50" }} _dark={{ _hover: { bg: "gray.700" } }}>
                          <Box flex="1" textAlign="left" fontWeight="semibold">
                            How do I become a service provider?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={6} pt={2} px={6} bg="gray.50" _dark={{ bg: "gray.700" }}>
                        Visit our "Become a Provider" page to apply. You'll need to create an account, 
                        provide details about your services, pricing, and availability. Our team will 
                        review your application and contact you to complete the onboarding process.
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              </SimpleGrid>
            
              {/* CTA button */}
              <Box mt={{ base: 12, md: 16 }} textAlign="center">
                <Button 
                  as={Link} 
                  href="/contact" 
                  colorScheme="brand" 
                  size="lg"
                  fontWeight="bold"
                  px={8}
                  py={6}
                  boxShadow="lg"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "xl"
                  }}
                >
                  Still have questions? Contact Us
                </Button>
              </Box>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
} 