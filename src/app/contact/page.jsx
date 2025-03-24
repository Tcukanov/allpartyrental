"use client";

import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  useToast,
  Divider
} from '@chakra-ui/react';
import { EmailIcon, PhoneIcon, InfoIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt } from 'react-icons/fa';
import MainLayout from '@/components/layout/MainLayout';

export default function ContactPage() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real application, this would send data to your API
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Message sent!",
        description: "We've received your message and will get back to you soon.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error sending your message. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <Box bg="brand.600" color="white" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={4} align="center" textAlign="center">
            <Heading as="h1" size="2xl">Contact Us</Heading>
            <Text fontSize="xl" maxW="800px">
              Have questions about our platform? Need assistance with your party planning? 
              Our team is here to help!
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10}>
          <VStack align="start" spacing={8}>
            <Heading as="h2" size="xl">Get In Touch</Heading>
            <Text>
              Please fill out the form, and our team will get back to you as soon as possible. 
              We're here to answer your questions and provide the support you need.
            </Text>

            <Divider />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
              <Card>
                <CardBody>
                  <HStack spacing={3}>
                    <Icon as={EmailIcon} boxSize={6} color="brand.500" />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Email Us</Text>
                      <Text>support@partymarketplace.com</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <HStack spacing={3}>
                    <Icon as={PhoneIcon} boxSize={6} color="brand.500" />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Call Us</Text>
                      <Text>(555) 123-4567</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <HStack spacing={3}>
                    <Icon as={FaMapMarkerAlt} boxSize={6} color="brand.500" />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Location</Text>
                      <Text>123 Party Street, New York, NY 10001</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <HStack spacing={3}>
                    <Icon as={InfoIcon} boxSize={6} color="brand.500" />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Business Hours</Text>
                      <Text>Monday-Friday: 9am-6pm EST</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>

          <Card shadow="lg">
            <CardBody>
              <VStack spacing={6} as="form" onSubmit={handleSubmit}>
                <Heading as="h3" size="md">Send Us a Message</Heading>

                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Your name"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="your@email.com"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Subject</FormLabel>
                  <Input 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleChange} 
                    placeholder="How can we help you?"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Message</FormLabel>
                  <Textarea 
                    name="message" 
                    value={formData.message} 
                    onChange={handleChange} 
                    placeholder="Your message here..."
                    rows={5}
                  />
                </FormControl>

                <Button 
                  type="submit" 
                  colorScheme="brand" 
                  size="lg" 
                  width="full"
                  isLoading={isSubmitting}
                  loadingText="Sending"
                >
                  Send Message
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Container>

      {/* FAQ Section */}
      <Box bg="gray.50" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="center" mb={10}>
            <Heading as="h2" size="xl">Frequently Asked Questions</Heading>
            <Text textAlign="center" maxW="800px">
              Find quick answers to common questions about our platform
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Heading as="h3" size="md">How does Party Marketplace work?</Heading>
                  <Text>
                    Our platform connects clients planning parties with service providers. Clients create 
                    party requests, providers send personalized offers, and clients can choose the best options 
                    for their event.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Heading as="h3" size="md">How do I become a service provider?</Heading>
                  <Text>
                    Visit our "Join as Provider" page to create a service provider account. After registration, 
                    you can set up your profile, list your services, and start receiving party requests.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Heading as="h3" size="md">Is there a fee to use the platform?</Heading>
                  <Text>
                    It's free for clients to create party requests and receive offers. Service providers pay a 
                    small commission on completed bookings.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Heading as="h3" size="md">How does the payment system work?</Heading>
                  <Text>
                    We use a secure escrow payment system. When you book a service, your payment is held securely 
                    until the service is completed and you confirm satisfaction.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>
    </MainLayout>
  );
}