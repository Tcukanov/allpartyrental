'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Stack,
  Heading,
  Text,
  Divider,
  useToast,
  Select,
  VStack,
  HStack,
  Flex,
  Avatar,
  IconButton,
  Badge
} from '@chakra-ui/react';
import { FiEdit, FiSave, FiX } from 'react-icons/fi';
import SettingsLayout from '@/components/provider/SettingsLayout';

export default function ProviderProfileSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    description: '',
    website: '',
    address: '',
    city: '',
    businessType: '',
    avatar: ''
  });

  useEffect(() => {
    const fetchProviderProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/provider/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setProfileData({
            companyName: data.data.companyName || session?.user?.name || '',
            contactPerson: data.data.contactPerson || '',
            email: data.data.email || session?.user?.email || '',
            phone: data.data.phone || '',
            description: data.data.description || '',
            website: data.data.website || '',
            address: data.data.address || '',
            city: data.data.city || '',
            businessType: data.data.businessType || '',
            avatar: data.data.avatar || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Could not load your profile information',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchProviderProfile();
    }
  }, [session, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout>
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <Heading size="lg" mb={4}>Profile Settings</Heading>
        <Text mb={6}>Manage your provider profile information that clients will see</Text>
        <Divider mb={6} />

        <Stack spacing={6}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={6} align="start">
            <Box w={{ base: '100%', md: '30%' }}>
              <VStack spacing={4} align="center">
                <Avatar 
                  size="2xl" 
                  name={profileData.companyName} 
                  src={profileData.avatar || undefined}
                />
                <Badge colorScheme="green">Provider</Badge>
                <Text fontWeight="bold">{session?.user?.email}</Text>
                <Button 
                  size="sm" 
                  leftIcon={<FiEdit />}
                  isDisabled
                >
                  Change Picture
                </Button>
              </VStack>
            </Box>

            <Box w={{ base: '100%', md: '70%' }}>
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel>Company Name</FormLabel>
                  <Input
                    name="companyName"
                    value={profileData.companyName}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Contact Person</FormLabel>
                  <Input
                    name="contactPerson"
                    value={profileData.contactPerson}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    isReadOnly
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Business Description</FormLabel>
                  <Textarea
                    name="description"
                    value={profileData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Website</FormLabel>
                  <Input
                    name="website"
                    value={profileData.website}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Business Address</FormLabel>
                  <Input
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>City</FormLabel>
                  <Input
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Business Type</FormLabel>
                  <Select
                    name="businessType"
                    value={profileData.businessType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a business type</option>
                    <option value="sole_proprietorship">Sole Proprietorship</option>
                    <option value="llc">Limited Liability Company (LLC)</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                <Flex justify="flex-end" mt={4}>
                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="blue"
                    isLoading={isSaving}
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </Button>
                </Flex>
              </VStack>
            </Box>
          </Flex>
        </Stack>
      </Box>
    </SettingsLayout>
  );
} 