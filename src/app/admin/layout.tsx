'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { Box, Container, Flex, Text, Spinner, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import AdminNavbar from '@/components/admin/AdminNavbar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        // Check session
        const session = await getSession();
        if (!session || !session.user) {
          router.push('/login?callbackUrl=/admin');
          return;
        }
        
        // Check admin role
        if (session.user.role !== 'ADMIN') {
          router.push('/');
          toast({
            title: 'Access Denied',
            description: 'You need administrator privileges to access this area.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        
        // User is admin
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify your access permissions.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminAccess();
  }, [router, toast]);

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh" direction="column">
        <Spinner size="xl" mb={4} color="blue.500" />
        <Text>Verifying admin access...</Text>
      </Flex>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <AdminNavbar />
      <Box py={6} px={4}>
        {children}
      </Box>
    </Box>
  );
} 