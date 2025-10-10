import { Prisma } from '@prisma/client';

/**
 * Gera um token sequencial para uma solicitação aprovada pelo chefe da seção regional
 * O formato do token é: RM{regionId}-{year}-{sequence}
 * Exemplo: RM1-2024-001, RM2-2024-052, etc.
 */
export async function generateSequentialToken(
  tx: Prisma.TransactionClient, 
  regionId: string
): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  // Busca ou cria o registro de sequência para a região e ano atual
  let tokenSequence = await tx.tokenSequence.findUnique({
    where: {
      regionId_year: {
        regionId,
        year: currentYear
      }
    }
  });

  if (!tokenSequence) {
    // Se não existe, cria um novo registro começando com sequência 1
    tokenSequence = await tx.tokenSequence.create({
      data: {
        regionId,
        year: currentYear,
        lastSequence: 1
      }
    });
  } else {
    // Se existe, incrementa a sequência
    tokenSequence = await tx.tokenSequence.update({
      where: {
        regionId_year: {
          regionId,
          year: currentYear
        }
      },
      data: {
        lastSequence: {
          increment: 1
        }
      }
    });
  }

  // Formata o token com padding zeros (ex: 001, 002, etc.)
  const sequenceFormatted = tokenSequence.lastSequence.toString().padStart(3, '0');
  
  return `RM${regionId}-${currentYear}-${sequenceFormatted}`;
}

/**
 * Valida se um token sequencial tem o formato correto
 */
export function validateTokenFormat(token: string): boolean {
  // Formato esperado: RM{regionId}-{year}-{sequence}
  const tokenRegex = /^RM\d+-\d{4}-\d{3}$/;
  return tokenRegex.test(token);
}
