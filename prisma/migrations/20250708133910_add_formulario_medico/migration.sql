-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestStatus" ADD VALUE 'NECESSITA_CORRECAO';
ALTER TYPE "RequestStatus" ADD VALUE 'APROVADO_DSAU';

-- CreateTable
CREATE TABLE "FormularioMedico" (
    "id" TEXT NOT NULL,
    "nomeBeneficiario" TEXT NOT NULL,
    "precCpMatriculaCpf" TEXT NOT NULL,
    "idade" TEXT NOT NULL,
    "postoGraduacaoTitular" TEXT NOT NULL,
    "necessitaAcompanhante" BOOLEAN NOT NULL,
    "consultaExame" TEXT NOT NULL,
    "profissionalCiente" BOOLEAN NOT NULL,
    "justificativaProfissionalCiente" TEXT,
    "materialDisponivel" BOOLEAN NOT NULL,
    "justificativaMaterialDisponivel" TEXT,
    "pacienteNoMapa" BOOLEAN NOT NULL,
    "justificativaPacienteNoMapa" TEXT,
    "setorEmCondicoes" BOOLEAN NOT NULL,
    "justificativaSetorEmCondicoes" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormularioMedico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FormularioMedico" ADD CONSTRAINT "FormularioMedico_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
