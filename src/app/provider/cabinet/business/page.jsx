'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
  VStack,
  FormHelperText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Switch,
  Badge,
  HStack,
  Icon
} from '@chakra-ui/react';
import { 
  FaBuilding, 
  FaCheck, 
  FaClock, 
  FaTimes,
  FaIdCard,
  FaMoneyBillWave,
  FaShieldAlt
} from 'react-icons/fa';

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Limited Liability Company (LLC)',
  'Corporation',
  'S Corporation',
  'Partnership',
  'Non-profit',
  'Other'
];

export default function ProviderBusinessPage() {
  const { data: session, status } = useSession();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',
    businessPhone: '',
    businessEmail: '',
    businessWebsite: '',
    ein: '',
    businessType: '',
    foundedYear: '',
    employeeCount: '',
    insuranceProvider: '',
    insurancePolicyNum: '',
    taxIdVerified: false,
    bankAccountVerified: false,
    isApproved: false
  });

  // Load provider business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (status === 'loading') return;
      if (!session) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/provider/business');
        if (!response.ok) {
          throw new Error('Failed to fetch business data');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setBusinessData(prev => ({
            ...prev,
            ...data.data
          }));
        }
      } catch (error) {
        console.error('Error fetching business data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load business information',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessData();
  }, [session, status, toast]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBusinessData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/provider/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData),
      });

      if (!response.ok) {
        throw new Error('Failed to update business information');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Business information updated successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error || 'Failed to update business information');
      }
    } catch (error) {
      console.error('Error updating business information:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update business information',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Loading business information...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Business Information</Heading>
          <Text color="gray.600">
            Complete your business profile to provide better services to clients
          </Text>
        </Box>

        {businessData.isApproved ? (
          <Alert status="success" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="md" p={4}>
            <AlertIcon boxSize={10} mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Business Verified
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              Your business has been verified and approved. You can now receive payments and access all provider features.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert status="info" variant="subtle" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Complete Your Business Profile</AlertTitle>
              <AlertDescription>
                Completing your business profile with accurate information helps us verify your business 
                and enables you to receive payments through our platform.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Basic Information</Heading>
              
              <Grid templateColumns="repeat(12, 1fr)" gap={6}>
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl isRequired>
                    <FormLabel>Business Name</FormLabel>
                    <Input
                      name="businessName"
                      value={businessData.businessName}
                      onChange={handleInputChange}
                      placeholder="Your Business Name"
                    />
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>Business Type</FormLabel>
                    <Select
                      name="businessType"
                      value={businessData.businessType}
                      onChange={handleInputChange}
                      placeholder="Select Business Type"
                    >
                      {BUSINESS_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>Business Phone</FormLabel>
                    <Input
                      name="businessPhone"
                      value={businessData.businessPhone}
                      onChange={handleInputChange}
                      placeholder="(123) 456-7890"
                    />
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>Business Email</FormLabel>
                    <Input
                      name="businessEmail"
                      value={businessData.businessEmail}
                      onChange={handleInputChange}
                      placeholder="business@example.com"
                      type="email"
                    />
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 12 }}>
                  <FormControl>
                    <FormLabel>Business Description</FormLabel>
                    <Textarea
                      name="businessDescription"
                      value={businessData.businessDescription}
                      onChange={handleInputChange}
                      placeholder="Describe your business and services"
                      rows={4}
                    />
                  </FormControl>
                </GridItem>
              </Grid>
            </VStack>
            
            <Divider my={8} />
            
            <VStack spacing={6} align="stretch">
              <Heading size="md">Address Information</Heading>
              
              <Grid templateColumns="repeat(12, 1fr)" gap={6}>
                <GridItem colSpan={{ base: 12, md: 12 }}>
                  <FormControl>
                    <FormLabel>Street Address</FormLabel>
                    <Input
                      name="businessAddress"
                      value={businessData.businessAddress}
                      onChange={handleInputChange}
                      placeholder="123 Main St, Suite 101"
                    />
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 4 }}>
                  <FormControl>
                    <FormLabel>City</FormLabel>
                    <Input
                      name="businessCity"
                      value={businessData.businessCity}
                      onChange={handleInputChange}
                      placeholder="City"
                    />
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 6, md: 4 }}>
                  <FormControl>
                    <FormLabel>State</FormLabel>
                    <Input
                      name="businessState"
                      value={businessData.businessState}
                      onChange={handleInputChange}
                      placeholder="State"
                    />
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 6, md: 4 }}>
                  <FormControl>
                    <FormLabel>ZIP Code</FormLabel>
                    <Input
                      name="businessZip"
                      value={businessData.businessZip}
                      onChange={handleInputChange}
                      placeholder="ZIP"
                    />
                  </FormControl>
                </GridItem>
              </Grid>
            </VStack>
            
            <Divider my={8} />
            
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Tax Information</Heading>
                {businessData.taxIdVerified && (
                  <Badge colorScheme="green" display="flex" alignItems="center">
                    <Icon as={FaCheck} mr={1} />
                    Verified
                  </Badge>
                )}
              </Flex>
              
              <Grid templateColumns="repeat(12, 1fr)" gap={6}>
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>
                      <HStack>
                        <Icon as={FaIdCard} />
                        <Text>EIN (Tax ID)</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      name="ein"
                      value={businessData.ein}
                      onChange={handleInputChange}
                      placeholder="XX-XXXXXXX"
                      isDisabled={businessData.taxIdVerified}
                    />
                    <FormHelperText>
                      Enter your Employer Identification Number (EIN). This is required for tax purposes.
                    </FormHelperText>
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>Year Founded</FormLabel>
                    <Input
                      name="foundedYear"
                      value={businessData.foundedYear}
                      onChange={handleInputChange}
                      placeholder="2020"
                      type="number"
                    />
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>Number of Employees</FormLabel>
                    <Select
                      name="employeeCount"
                      value={businessData.employeeCount}
                      onChange={handleInputChange}
                      placeholder="Select Employee Count"
                    >
                      <option value="1">Just me</option>
                      <option value="2-5">2-5 employees</option>
                      <option value="6-10">6-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="50+">50+ employees</option>
                    </Select>
                  </FormControl>
                </GridItem>
              </Grid>
            </VStack>
            
            <Divider my={8} />
            
            <VStack spacing={6} align="stretch">
              <Heading size="md">Insurance Information</Heading>
              
              <Grid templateColumns="repeat(12, 1fr)" gap={6}>
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>Insurance Provider</FormLabel>
                    <Input
                      name="insuranceProvider"
                      value={businessData.insuranceProvider}
                      onChange={handleInputChange}
                      placeholder="Insurance Provider Name"
                    />
                  </FormControl>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 6 }}>
                  <FormControl>
                    <FormLabel>Policy Number</FormLabel>
                    <Input
                      name="insurancePolicyNum"
                      value={businessData.insurancePolicyNum}
                      onChange={handleInputChange}
                      placeholder="Policy Number"
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              
              <Text fontSize="sm" color="gray.500">
                Having business insurance is recommended but not required. However, it may help customers feel more secure when booking your services.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Flex justify="flex-end">
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving"
            leftIcon={<FaCheck />}
          >
            Save Business Information
          </Button>
        </Flex>
      </VStack>
    </Container>
  );
}