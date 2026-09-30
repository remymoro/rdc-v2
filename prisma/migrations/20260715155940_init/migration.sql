/*
  Warnings:

  - Made the column `centreId` on table `Benevole` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Benevole" ALTER COLUMN "centreId" SET NOT NULL;
