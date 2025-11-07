"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Spinner,
  HStack,
  VStack,
  Text,
  Tooltip
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus, FiMoreVertical } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role !== 'ADMIN') {
        toast({
          title: 'Access Denied',
          description: 'Only administrators can access this page',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        router.push('/');
      } else {
        fetchCategories();
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/categories');
    }
  }, [status, session, router, toast]);

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error(`Error fetching categories: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load categories',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening the edit modal
  const handleEdit = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug
    });
    onOpen();
  };

  // Handle opening the create modal
  const handleCreate = () => {
    setCurrentCategory(null);
    setFormData({
      name: '',
      description: '',
      slug: ''
    });
    onOpen();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Generate slug from name
  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setFormData({ ...formData, slug });
  };

  // Submit form data
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Category name is required');
      }
      
      if (!formData.slug.trim()) {
        throw new Error('Category slug is required');
      }
      
      // Prepare request data
      const url = currentCategory 
        ? `/api/categories/${currentCategory.id}` 
        : '/api/categories';
      
      const method = currentCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to ${currentCategory ? 'update' : 'create'} category`);
      }
      
      const data = await response.json();
      
      toast({
        title: 'Success',
        description: `Category ${currentCategory ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      onClose();
      fetchCategories();
    } catch (error) {
      console.error('Error submitting category:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${currentCategory ? 'update' : 'create'} category`,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete category');
      }
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      setIsDeleteModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  // We handle authentication in the useEffect now, so we don't need a separate component

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="lg">Service Categories</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleCreate}
          >
            Add Category
          </Button>
        </Flex>

        {isLoading ? (
          <Flex justify="center" p={8}>
            <Spinner size="xl" />
          </Flex>
        ) : categories.length === 0 ? (
          <Box p={8} textAlign="center">
            <Text mb={4}>No categories found.</Text>
            <Button
              colorScheme="blue"
              leftIcon={<FiPlus />}
              onClick={handleCreate}
            >
              Create First Category
            </Button>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  <Th>Description</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {categories.map((category) => (
                  <Tr key={category.id}>
                    <Td fontWeight="medium">{category.name}</Td>
                    <Td>
                      <Badge>{category.slug}</Badge>
                    </Td>
                    <Td>{category.description ? category.description.substring(0, 50) + (category.description.length > 50 ? '...' : '') : '-'}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="Edit Category">
                          <IconButton
                            aria-label="Edit category"
                            icon={<FiEdit />}
                            size="sm"
                            onClick={() => handleEdit(category)}
                          />
                        </Tooltip>
                        <Tooltip label="Delete Category">
                          <IconButton
                            aria-label="Delete category"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => {
                              setCategoryToDelete(category);
                              setIsDeleteModalOpen(true);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {currentCategory ? 'Edit Category' : 'Create Category'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} as="form" onSubmit={handleSubmit}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={!currentCategory ? generateSlug : undefined}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Slug</FormLabel>
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="category-slug"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter category description..."
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {currentCategory ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete the category "{categoryToDelete?.name}"?
              This action cannot be undone.
            </Text>
            <Text mt={4} fontWeight="bold" color="red.500">
              Warning: This will also delete all associated filters and may affect existing services.
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteConfirm}
              isLoading={isSubmitting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 