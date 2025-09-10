import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCostAPI() {
  try {
    console.log('=== TESTANDO CÁLCULO DE CUSTOS ===\n');

    // Simular o que a API faz
    const requests = await prisma.request.findMany({
      include: {
        sender: {
          include: {
            region: true
          }
        },
        requestResponses: {
          where: {
            selected: true // Apenas respostas selecionadas
          },
          include: {
            receiver: {
              include: {
                region: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total de solicitações encontradas: ${requests.length}\n`);

    const custosPorRM: Record<string, any> = {};
    const custosPorOM: Record<string, any> = {};
    
    let totalGeralOPME = 0;
    let totalGeralPSA = 0;
    let totalGeralProcedure = 0;
    let totalGeralTicket = 0;
    let quantidadeTotal = 0;

    requests.forEach((request, index) => {
      console.log(`${index + 1}. Processando solicitação: ${request.id}`);
      
      const regionId = request.sender.regionId;
      const regionName = request.sender.region.name;
      const orgId = request.sender.id;
      const orgName = request.sender.name;

      // Custos da solicitação principal
      const opmeCostRequest = request.opmeCost || 0;
      const psaCostRequest = request.psaCost || 0;

      console.log(`   💰 OPME Request: R$ ${(opmeCostRequest / 100).toFixed(2)}`);
      console.log(`   💰 PSA Request: R$ ${(psaCostRequest / 100).toFixed(2)}`);

      // Custos das respostas selecionadas
      let opmeCostResponse = 0;
      let procedureCostResponse = 0;
      let ticketCostResponse = 0;

      console.log(`   📝 Respostas selecionadas: ${request.requestResponses.length}`);
      
      request.requestResponses.forEach((response, respIndex) => {
        console.log(`     ${respIndex + 1}. ${response.receiver.name}`);
        console.log(`        💰 OPME: R$ ${((response.opmeCost || 0) / 100).toFixed(2)}`);
        console.log(`        💰 Procedimento: R$ ${((response.procedureCost || 0) / 100).toFixed(2)}`);
        console.log(`        💰 Passagem: R$ ${((response.ticketCost || 0) / 100).toFixed(2)}`);
        
        opmeCostResponse += response.opmeCost || 0;
        procedureCostResponse += response.procedureCost || 0;
        ticketCostResponse += response.ticketCost || 0;
      });

      // Total por solicitação
      const totalSolicitacao = opmeCostRequest + psaCostRequest + opmeCostResponse + procedureCostResponse + ticketCostResponse;

      console.log(`   🔢 Total da solicitação: R$ ${(totalSolicitacao / 100).toFixed(2)}`);
      console.log(`   🏢 Organização: ${orgName} (${regionName})\n`);

      // Atualizar totais gerais
      totalGeralOPME += opmeCostRequest + opmeCostResponse;
      totalGeralPSA += psaCostRequest;
      totalGeralProcedure += procedureCostResponse;
      totalGeralTicket += ticketCostResponse;
      quantidadeTotal++;

      // Agrupar por RM
      if (!custosPorRM[regionId]) {
        custosPorRM[regionId] = {
          id: regionId,
          name: regionName,
          totalOPME: 0,
          totalPSA: 0,
          totalProcedure: 0,
          totalTicket: 0,
          totalGeral: 0,
          quantidadeSolicitacoes: 0,
          custoMedio: 0,
        };
      }

      custosPorRM[regionId].totalOPME += opmeCostRequest + opmeCostResponse;
      custosPorRM[regionId].totalPSA += psaCostRequest;
      custosPorRM[regionId].totalProcedure += procedureCostResponse;
      custosPorRM[regionId].totalTicket += ticketCostResponse;
      custosPorRM[regionId].totalGeral += totalSolicitacao;
      custosPorRM[regionId].quantidadeSolicitacoes++;

      // Agrupar por OM
      if (!custosPorOM[orgId]) {
        custosPorOM[orgId] = {
          id: orgId,
          name: orgName,
          regionName: regionName,
          totalOPME: 0,
          totalPSA: 0,
          totalProcedure: 0,
          totalTicket: 0,
          totalGeral: 0,
          quantidadeSolicitacoes: 0,
          custoMedio: 0,
        };
      }

      custosPorOM[orgId].totalOPME += opmeCostRequest + opmeCostResponse;
      custosPorOM[orgId].totalPSA += psaCostRequest;
      custosPorOM[orgId].totalProcedure += procedureCostResponse;
      custosPorOM[orgId].totalTicket += ticketCostResponse;
      custosPorOM[orgId].totalGeral += totalSolicitacao;
      custosPorOM[orgId].quantidadeSolicitacoes++;
    });

    // Calcular custos médios
    Object.values(custosPorRM).forEach((rm: any) => {
      rm.custoMedio = rm.quantidadeSolicitacoes > 0 ? rm.totalGeral / rm.quantidadeSolicitacoes : 0;
    });

    Object.values(custosPorOM).forEach((om: any) => {
      om.custoMedio = om.quantidadeSolicitacoes > 0 ? om.totalGeral / om.quantidadeSolicitacoes : 0;
    });

    console.log('\n=== RESUMO POR REGIÃO MILITAR ===');
    Object.values(custosPorRM).forEach((rm: any) => {
      console.log(`🗺️ ${rm.name}:`);
      console.log(`   💰 OPME Total: R$ ${(rm.totalOPME / 100).toFixed(2)}`);
      console.log(`   💰 PSA Total: R$ ${(rm.totalPSA / 100).toFixed(2)}`);
      console.log(`   💰 Procedimento Total: R$ ${(rm.totalProcedure / 100).toFixed(2)}`);
      console.log(`   💰 Passagem Total: R$ ${(rm.totalTicket / 100).toFixed(2)}`);
      console.log(`   🔢 Total Geral: R$ ${(rm.totalGeral / 100).toFixed(2)}`);
      console.log(`   📊 Quantidade: ${rm.quantidadeSolicitacoes}`);
      console.log(`   📈 Custo Médio: R$ ${(rm.custoMedio / 100).toFixed(2)}\n`);
    });

    console.log('=== RESUMO POR ORGANIZAÇÃO ===');
    Object.values(custosPorOM).forEach((om: any) => {
      console.log(`🏢 ${om.name} (${om.regionName}):`);
      console.log(`   💰 OPME Total: R$ ${(om.totalOPME / 100).toFixed(2)}`);
      console.log(`   💰 PSA Total: R$ ${(om.totalPSA / 100).toFixed(2)}`);
      console.log(`   💰 Procedimento Total: R$ ${(om.totalProcedure / 100).toFixed(2)}`);
      console.log(`   💰 Passagem Total: R$ ${(om.totalTicket / 100).toFixed(2)}`);
      console.log(`   🔢 Total Geral: R$ ${(om.totalGeral / 100).toFixed(2)}`);
      console.log(`   📊 Quantidade: ${om.quantidadeSolicitacoes}`);
      console.log(`   📈 Custo Médio: R$ ${(om.custoMedio / 100).toFixed(2)}\n`);
    });

    const totalGeralSolicitacoes = totalGeralOPME + totalGeralPSA + totalGeralProcedure + totalGeralTicket;
    const custoMedioGeral = quantidadeTotal > 0 ? totalGeralSolicitacoes / quantidadeTotal : 0;

    console.log('=== TOTAIS GERAIS ===');
    console.log(`💰 OPME Total: R$ ${(totalGeralOPME / 100).toFixed(2)}`);
    console.log(`💰 PSA Total: R$ ${(totalGeralPSA / 100).toFixed(2)}`);
    console.log(`💰 Procedimento Total: R$ ${(totalGeralProcedure / 100).toFixed(2)}`);
    console.log(`💰 Passagem Total: R$ ${(totalGeralTicket / 100).toFixed(2)}`);
    console.log(`🔢 Total Geral: R$ ${(totalGeralSolicitacoes / 100).toFixed(2)}`);
    console.log(`📊 Quantidade Total: ${quantidadeTotal}`);
    console.log(`📈 Custo Médio Geral: R$ ${(custoMedioGeral / 100).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Erro ao testar cálculo de custos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCostAPI();
