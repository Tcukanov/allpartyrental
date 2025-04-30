import { Badge } from '@chakra-ui/react';
import React from 'react';

/**
 * Returns a Badge component with the appropriate color for the given status
 * Used to maintain consistent status badge colors across the application
 * 
 * @param status The status string from the database
 * @returns A Badge component with appropriate color
 */
export const getStatusBadge = (status: string) => {
  // Normalize status to uppercase for consistent comparison
  const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : 'UNKNOWN';
  
  // Map statuses to appropriate colors
  const getColorScheme = (status: string) => {
    switch (status) {
      // Party statuses
      case 'DRAFT': return 'gray';
      case 'PUBLISHED': return 'blue';
      case 'IN_PROGRESS': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      
      // Offer statuses
      case 'PENDING': return 'yellow';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      
      // Transaction statuses
      case 'ESCROW': return 'cyan';
      case 'REFUNDED': return 'gray';
      case 'DISPUTED': return 'orange';
      case 'PROVIDER_REVIEW': return 'purple';
      case 'DECLINED': return 'red';
      
      // Service statuses
      case 'ACTIVE': return 'green';
      case 'INACTIVE': return 'gray';
      case 'PENDING_APPROVAL': return 'yellow';
      
      // Default fallback
      default: return 'gray';
    }
  };

  return (
    <Badge colorScheme={getColorScheme(normalizedStatus)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}; 