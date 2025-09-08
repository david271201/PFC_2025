import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarDadosOPME() {
  try {
    console.log('=== VERIFICAÇÃO DE DADOS OPME ===\n');
    
    // Buscar todas as solicitações
    const requests = await prisma.request.findMany({
      include: {
        user: {
          include: {
            organization: {
              include: {
                region: true
              }
            }
          }
        }
      }
    });

    console.log('TODAS AS SOLICITAÇÕES:');
    requests.forEach(req => {
      console.log(`Request ${req.id}: OPME=${req.opmeCost}, PSA=${req.psaCost}, Região=${req.user.organization.region.name}`);
    });
    
    // Buscar todas as respostas
    const responses = await prisma.requestResponse.findMany({
      include: {
        request: {
          include: {
            user: {
              include: {
                organization: {
                  include: {
                    region: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('\nTODAS AS RESPOSTAS:');
    responses.forEach(resp => {
      console.log(`Response ${resp.id}: OPME=${resp.opmeCost}, Proc=${resp.procedureCost}, Ticket=${resp.ticketCost}`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDadosOPME();
