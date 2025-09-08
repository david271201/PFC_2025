const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarDadosOPME() {
  console.log('=== VERIFICAÇÃO DE DADOS OPME ===\n');
  
  // Buscar todas as solicitações com custos OPME
  const requests = await prisma.request.findMany({
    where: {
      OR: [
        { opmeCost: { not: null } },
        { opmeCost: { gt: 0 } }
      ]
    },
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

  console.log('SOLICITAÇÕES COM CUSTO OPME:');
  let totalOPMERequests = 0;
  requests.forEach(req => {
    console.log(`Request ID: ${req.id}`);
    console.log(`  OPME Cost: ${req.opmeCost} (valor bruto no banco)`);
    console.log(`  OPME Cost formatado: R$ ${(req.opmeCost / 1000).toFixed(2)}`);
    console.log(`  Região: ${req.user.organization.region.name}`);
    console.log(`  Organização: ${req.user.organization.name}`);
    console.log('');
    totalOPMERequests += req.opmeCost || 0;
  });
  
  // Buscar todas as respostas com custos OPME
  const responses = await prisma.requestResponse.findMany({
    where: {
      OR: [
        { opmeCost: { not: null } },
        { opmeCost: { gt: 0 } }
      ]
    },
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

  console.log('RESPOSTAS COM CUSTO OPME:');
  let totalOPMEResponses = 0;
  responses.forEach(resp => {
    console.log(`Response ID: ${resp.id}`);
    console.log(`  OPME Cost: ${resp.opmeCost} (valor bruto no banco)`);
    console.log(`  OPME Cost formatado: R$ ${(resp.opmeCost / 1000).toFixed(2)}`);
    console.log(`  Request ID: ${resp.requestId}`);
    console.log(`  Região: ${resp.request.user.organization.region.name}`);
    console.log(`  Organização: ${resp.request.user.organization.name}`);
    console.log('');
    totalOPMEResponses += resp.opmeCost || 0;
  });

  console.log('=== TOTAIS ===');
  console.log(`Total OPME de Requests: ${totalOPMERequests} (${(totalOPMERequests / 1000).toFixed(2)})`);
  console.log(`Total OPME de Responses: ${totalOPMEResponses} (${(totalOPMEResponses / 1000).toFixed(2)})`);
  console.log(`Total OPME Geral: ${totalOPMERequests + totalOPMEResponses} (${((totalOPMERequests + totalOPMEResponses) / 1000).toFixed(2)})`);
}

verificarDadosOPME()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
