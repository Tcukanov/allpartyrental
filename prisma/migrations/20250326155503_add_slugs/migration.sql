/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `ServiceCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `ServiceCategory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceCategory" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");
