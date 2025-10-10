-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "tokenSequencial" TEXT;

-- CreateTable
CREATE TABLE "TokenSequence" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenSequence_regionId_year_key" ON "TokenSequence"("regionId", "year");
