import { OfferStatus, TransactionStatus } from '@prisma/client';

// Transaction status configuration
export const transactionStatusConfig = {
  // Pending states
  PENDING: { 
    color: 'gray', 
    label: 'Pending',
    requiresAction: false
  },
  PROVIDER_REVIEW: { 
    color: 'blue', 
    label: 'Payment Pending',
    requiresAction: true
  },
  APPROVED: { 
    color: 'yellow', 
    label: 'Action Required',
    requiresAction: true
  },
  
  // Completed states
  COMPLETED: { 
    color: 'green', 
    label: 'Completed',
    requiresAction: false
  },
  
  // Cancelled states
  DECLINED: { 
    color: 'red', 
    label: 'Declined',
    requiresAction: false
  },
  REFUNDED: { 
    color: 'purple', 
    label: 'Refunded',
    requiresAction: false
  },
  CANCELLED: { 
    color: 'orange', 
    label: 'Cancelled',
    requiresAction: false
  },
  
  // Legacy states (kept for backward compatibility)
  ESCROW: { 
    color: 'blue', 
    label: 'Payment Processing',
    requiresAction: false
  },
  DISPUTED: { 
    color: 'orange', 
    label: 'Disputed',
    requiresAction: true
  }
};

// Offer status configuration
export const offerStatusConfig = {
  PENDING: { 
    color: 'yellow', 
    label: 'Pending',
    requiresAction: true
  },
  APPROVED: { 
    color: 'green', 
    label: 'Approved',
    requiresAction: false
  },
  REJECTED: { 
    color: 'red', 
    label: 'Rejected',
    requiresAction: false
  },
  CANCELLED: { 
    color: 'gray', 
    label: 'Cancelled',
    requiresAction: false
  }
};

// Helper function to get transaction status config
export const getTransactionStatusConfig = (status: TransactionStatus | string) => {
  return transactionStatusConfig[status as TransactionStatus] || { 
    color: 'gray', 
    label: status.toString().replace(/_/g, ' '),
    requiresAction: false
  };
};

// Helper function to get offer status config
export const getOfferStatusConfig = (status: OfferStatus | string) => {
  return offerStatusConfig[status as OfferStatus] || { 
    color: 'gray', 
    label: status.toString().replace(/_/g, ' '),
    requiresAction: false
  };
};

// Helper function to determine if a transaction requires action
export const transactionRequiresAction = (status: TransactionStatus | string): boolean => {
  return getTransactionStatusConfig(status).requiresAction;
};

// Helper function to determine if an offer requires action
export const offerRequiresAction = (status: OfferStatus | string): boolean => {
  return getOfferStatusConfig(status).requiresAction;
}; 