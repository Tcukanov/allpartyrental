-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionStatus" ADD VALUE 'PROVIDER_REVIEW';
ALTER TYPE "TransactionStatus" ADD VALUE 'APPROVED';
ALTER TYPE "TransactionStatus" ADD VALUE 'DECLINED';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "googleBusinessRating" DOUBLE PRECISION,
ADD COLUMN     "googleBusinessReviews" INTEGER,
ADD COLUMN     "googleBusinessUrl" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "clientFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "escrowEndTime" TIMESTAMP(3),
ADD COLUMN     "escrowStartTime" TIMESTAMP(3),
ADD COLUMN     "providerFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
ADD COLUMN     "reviewDeadline" TIMESTAMP(3);
