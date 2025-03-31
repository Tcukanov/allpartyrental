-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "availableDays" TEXT[],
ADD COLUMN     "availableHoursEnd" TEXT,
ADD COLUMN     "availableHoursStart" TEXT,
ADD COLUMN     "maxRentalHours" INTEGER,
ADD COLUMN     "minRentalHours" INTEGER;
