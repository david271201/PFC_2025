/*
  Warnings:

  - You are about to drop the column `idade` on the `Pacient` table. All the data in the column will be lost.
  - Added the required column `dataNascimento` to the `Pacient` table without a default value. This is not possible if the table is not empty.
  - Made the column `sexo` on table `Pacient` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable: Primeiro adiciona as colunas como opcionais
ALTER TABLE "Pacient" ADD COLUMN "dataNascimento" TIMESTAMP(3);
UPDATE "Pacient" SET "dataNascimento" = CURRENT_DATE - INTERVAL '30 years' WHERE "dataNascimento" IS NULL;
UPDATE "Pacient" SET "sexo" = 'Masculino' WHERE "sexo" IS NULL;

-- Remove a coluna idade e torna os novos campos obrigatórios
ALTER TABLE "Pacient" DROP COLUMN "idade",
ALTER COLUMN "dataNascimento" SET NOT NULL,
ALTER COLUMN "sexo" SET NOT NULL;
