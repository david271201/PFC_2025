-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'CORRECAO';

-- AlterTable
ALTER TABLE "FormularioMedico" ADD COLUMN     "aprovacao" BOOLEAN DEFAULT false,
ADD COLUMN     "horario1" TEXT,
ADD COLUMN     "horario2" TEXT,
ADD COLUMN     "horario3" TEXT,
ADD COLUMN     "horario4" TEXT,
ADD COLUMN     "motorista1" TEXT,
ADD COLUMN     "motorista2" TEXT,
ADD COLUMN     "motorista3" TEXT,
ADD COLUMN     "motorista4" TEXT;
