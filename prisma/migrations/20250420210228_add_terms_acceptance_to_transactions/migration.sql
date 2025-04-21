-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "termsAccepted" BOOLEAN DEFAULT false,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsType" TEXT;
