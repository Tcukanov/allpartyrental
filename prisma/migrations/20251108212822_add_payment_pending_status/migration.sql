-- AlterEnum
-- Add PAYMENT_PENDING to OfferStatus enum
ALTER TYPE "OfferStatus" ADD VALUE 'PAYMENT_PENDING';

-- Note: PAYMENT_PENDING will be the first status when an offer is created
-- It indicates payment has not been captured yet
-- After payment is captured, status changes to PENDING (awaiting provider acceptance)

