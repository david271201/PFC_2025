-- CreateTable
CREATE TABLE "FormularioMedicoChefeDiv4" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "parecerTecnico" TEXT NOT NULL,
    "observacoes" TEXT,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormularioMedicoChefeDiv4_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormularioMedicoChefeDiv4_requestId_idx" ON "FormularioMedicoChefeDiv4"("requestId");

-- CreateIndex
CREATE INDEX "FormularioMedicoChefeDiv4_userId_idx" ON "FormularioMedicoChefeDiv4"("userId");

-- AddForeignKey
ALTER TABLE "FormularioMedicoChefeDiv4" ADD CONSTRAINT "FormularioMedicoChefeDiv4_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioMedicoChefeDiv4" ADD CONSTRAINT "FormularioMedicoChefeDiv4_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
