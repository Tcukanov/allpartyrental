/*
  Warnings:

  - You are about to drop the column `type` on the `Advertisement` table. All the data in the column will be lost.
  - You are about to drop the column `stripeAccountId` on the `Provider` table. All the data in the column will be lost.
  - The `verificationLevel` column on the `Provider` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `paymentIntentId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethodId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - Added the required column `duration` to the `Advertisement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packageId` to the `Advertisement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packageName` to the `Advertisement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Advertisement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AdvertisementStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('NONE', 'BASIC', 'VERIFIED', 'PREMIUM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "TransactionStatus" ADD VALUE 'PAID_PENDING_PROVIDER_ACCEPTANCE';
ALTER TYPE "TransactionStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "TransactionStatus" ADD VALUE 'FAILED';
ALTER TYPE "TransactionStatus" ADD VALUE 'RELEASED';

-- DropForeignKey
ALTER TABLE "Offer" DROP CONSTRAINT "Offer_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_userId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_offerId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_partyId_fkey";

-- AlterTable
ALTER TABLE "Advertisement" DROP COLUMN "type",
ADD COLUMN     "duration" TEXT NOT NULL,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "packageId" TEXT NOT NULL,
ADD COLUMN     "packageName" TEXT NOT NULL,
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "status" "AdvertisementStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "stripeAccountId",
ADD COLUMN     "accountType" TEXT,
ADD COLUMN     "paypalCanReceivePayments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paypalEnvironment" TEXT DEFAULT 'sandbox',
ADD COLUMN     "paypalOnboardingId" TEXT,
ADD COLUMN     "paypalOnboardingStatus" TEXT DEFAULT 'NOT_STARTED',
ADD COLUMN     "paypalStatus" TEXT,
ADD COLUMN     "paypalStatusIssues" TEXT,
ADD COLUMN     "paypalTrackingId" TEXT,
DROP COLUMN "verificationLevel",
ADD COLUMN     "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "paymentIntentId",
DROP COLUMN "paymentMethodId",
ADD COLUMN     "paypalCaptureId" TEXT,
ADD COLUMN     "paypalOrderId" TEXT,
ADD COLUMN     "paypalPayerId" TEXT,
ADD COLUMN     "paypalStatus" TEXT,
ADD COLUMN     "paypalTransactionId" TEXT,
ALTER COLUMN "partyId" DROP NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "clientFeePercent" DROP NOT NULL,
ALTER COLUMN "clientFeePercent" DROP DEFAULT,
ALTER COLUMN "providerFeePercent" DROP NOT NULL,
ALTER COLUMN "providerFeePercent" DROP DEFAULT,
ALTER COLUMN "termsAccepted" DROP DEFAULT;

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminSetting_key_key" ON "AdminSetting"("key");

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
