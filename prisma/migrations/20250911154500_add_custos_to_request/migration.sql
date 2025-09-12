-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'AGUARDANDO_OPERADOR_FUSEX_CUSTOS';

-- AlterTable
ALTER TABLE "Custo" ADD COLUMN "requestId" TEXT;

-- AddForeignKey
ALTER TABLE "Custo" ADD CONSTRAINT "Custo_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Custo_requestId_idx" ON "Custo"("requestId");
