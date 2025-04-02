'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Avatar,
  AvatarBadge,
  IconButton,
  Textarea,
  useToast,
  Divider,
  SimpleGrid,
  InputGroup,
  InputLeftAddon,
  Card,
  CardBody,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ClientProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    avatar: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
  });
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  
  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    if (!session) return;
    
    try {
      setIsLoading(true);
      
      // Start with user data from the session
      const baseProfile = {
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        address: '',
        website: '',
        avatar: session.user.image || '',
        socialLinks: {
          facebook: '',
          instagram: '',
          twitter: '',
        },
      };
      
      // Try to fetch profile from API
      try {
        const response = await fetch('/api/client/profile');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data) {
            // Merge API data with session data
            setProfileData({
              ...baseProfile,
              phone: data.data.phone || '',
              address: data.data.address || '',
              website: data.data.website || '',
              avatar: data.data.avatar || baseProfile.avatar,
              socialLinks: data.data.socialLinks || baseProfile.socialLinks,
            });
          } else {
            setProfileData(baseProfile);
          }
        } else {
          throw new Error('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfileData(baseProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while loading the profile. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);
  
  // Fetch profile data on component mount
  useEffect(() => {
    if (session) {
      fetchProfileData();
    }
  }, [session, fetchProfileData]);
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Handle avatar change (would be expanded with actual upload functionality)
  const handleAvatarChange = (e) => {
    // This is a placeholder - in a real app, you would upload the image to a server
    // and get a URL back.
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          avatar: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Save profile changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: profileData.phone,
          address: profileData.address,
          website: profileData.website,
          avatar: profileData.avatar,
          socialLinks: profileData.socialLinks,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update profile');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setIsEditing(false);
      } else {
        throw new Error(data.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while updating your profile.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Cancel editing and revert changes
  const handleCancel = () => {
    // Refetch the profile data to revert changes
    fetchProfileData();
    setIsEditing(false);
  };
  
  if (status === 'loading' || isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Flex justify="center" align="center" h="60vh">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <Box>
            <Heading as="h1" size="xl">My Profile</Heading>
            <Text color="gray.600" mt={2}>
              Manage your personal information
            </Text>
          </Box>
          
          {!isEditing ? (
            <Button
              leftIcon={<EditIcon />}
              colorScheme="brand"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <HStack>
              <Button
                leftIcon={<CloseIcon />}
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                leftIcon={<CheckIcon />}
                colorScheme="brand"
                onClick={handleSave}
                isLoading={isSaving}
                loadingText="Saving"
              >
                Save
              </Button>
            </HStack>
          )}
        </Flex>
        
        <Card variant="outline">
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Profile Avatar */}
              <Flex justify="center" py={4}>
                <Box position="relative">
                  <Avatar
                    size="2xl"
                    src={profileData.avatar}
                    name={profileData.name}
                  >
                    {isEditing && (
                      <AvatarBadge
                        as={IconButton}
                        size="sm"
                        rounded="full"
                        top="-10px"
                        colorScheme="brand"
                        aria-label="Edit avatar"
                        icon={<EditIcon />}
                        onClick={() => document.getElementById('avatar-upload').click()}
                      />
                    )}
                  </Avatar>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    display="none"
                    onChange={handleAvatarChange}
                  />
                </Box>
              </Flex>
              
              <Divider />
              
              {/* Personal Information */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    isReadOnly={!isEditing}
                    bg={!isEditing ? 'gray.50' : 'white'}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    value={profileData.email}
                    isReadOnly={true}
                    bg="gray.50"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    isReadOnly={!isEditing}
                    bg={!isEditing ? 'gray.50' : 'white'}
                    placeholder="Your phone number"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Website</FormLabel>
                  <Input
                    name="website"
                    value={profileData.website}
                    onChange={handleChange}
                    isReadOnly={!isEditing}
                    bg={!isEditing ? 'gray.50' : 'white'}
                    placeholder="Your website"
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                  isReadOnly={!isEditing}
                  bg={!isEditing ? 'gray.50' : 'white'}
                  placeholder="Your address"
                  rows={3}
                />
              </FormControl>
              
              <Divider />
              
              {/* Social Media Links */}
              <Box>
                <Heading size="md" mb={4}>Social Media Links</Heading>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Facebook</FormLabel>
                    <InputGroup>
                      <InputLeftAddon>facebook.com/</InputLeftAddon>
                      <Input
                        name="socialLinks.facebook"
                        value={profileData.socialLinks?.facebook || ''}
                        onChange={handleChange}
                        isReadOnly={!isEditing}
                        bg={!isEditing ? 'gray.50' : 'white'}
                        placeholder="username"
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Instagram</FormLabel>
                    <InputGroup>
                      <InputLeftAddon>instagram.com/</InputLeftAddon>
                      <Input
                        name="socialLinks.instagram"
                        value={profileData.socialLinks?.instagram || ''}
                        onChange={handleChange}
                        isReadOnly={!isEditing}
                        bg={!isEditing ? 'gray.50' : 'white'}
                        placeholder="username"
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Twitter</FormLabel>
                    <InputGroup>
                      <InputLeftAddon>twitter.com/</InputLeftAddon>
                      <Input
                        name="socialLinks.twitter"
                        value={profileData.socialLinks?.twitter || ''}
                        onChange={handleChange}
                        isReadOnly={!isEditing}
                        bg={!isEditing ? 'gray.50' : 'white'}
                        placeholder="username"
                      />
                    </InputGroup>
                  </FormControl>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
} 