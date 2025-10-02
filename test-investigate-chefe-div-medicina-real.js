/**
 * TESTE PRÁTICO: Verificação de Solicitação CHEFE_DIV_MEDICINA_4 no Banco
 * 
 * Este script irá testar a lógica real consultando dados do banco de dados
 * para investigar por que o CHEFE_DIV_MEDICINA está vendo solicitações como "aprovadas"
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigarChefeDivMedicina() {
  console.log('🔍 INVESTIGAÇÃO: CHEFE_DIV_MEDICINA_4 - Dados Reais do Banco');
  console.log('=' .repeat(70));

  try {
    // 1. Buscar todas as solicitações com status AGUARDANDO_CHEFE_DIV_MEDICINA_4
    const solicitacoesChefeDivMedicina = await prisma.request.findMany({
      where: {
        status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        },
        requestResponses: {
          select: {
            id: true,
            receiverId: true,
            selected: true,
            status: true,
            receiver: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 TOTAL de solicitações AGUARDANDO_CHEFE_DIV_MEDICINA_4: ${solicitacoesChefeDivMedicina.length}`);
    console.log('');

    if (solicitacoesChefeDivMedicina.length === 0) {
      console.log('ℹ️  Não há solicitações com status AGUARDANDO_CHEFE_DIV_MEDICINA_4 no momento');
      return;
    }

    // 2. Analisar cada solicitação
    for (let i = 0; i < solicitacoesChefeDivMedicina.length; i++) {
      const req = solicitacoesChefeDivMedicina[i];
      
      console.log(`📋 SOLICITAÇÃO ${i + 1}: ${req.id}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Remetente: ${req.sender?.name || 'N/A'} (${req.senderId})`);
      console.log(`   Destinos: [${req.requestedOrganizationIds?.join(', ') || 'N/A'}]`);
      console.log(`   Responses total: ${req.requestResponses.length}`);

      // Analisar responses
      req.requestResponses.forEach((response, idx) => {
        console.log(`   Response ${idx + 1}:`);
        console.log(`     - ID: ${response.id}`);
        console.log(`     - Receiver: ${response.receiver?.name || 'N/A'} (${response.receiverId})`);
        console.log(`     - Selected: ${response.selected}`);
        console.log(`     - Status: ${response.status}`);
      });

      // Verificar consistência
      const responsesSelecionadas = req.requestResponses.filter(r => r.selected === true);
      console.log(`   ✓ Responses selecionadas: ${responsesSelecionadas.length}`);

      if (responsesSelecionadas.length !== 1) {
        console.log(`   ⚠️  PROBLEMA: Deveria ter exatamente 1 response selecionada, mas tem ${responsesSelecionadas.length}`);
      }

      responsesSelecionadas.forEach(resp => {
        if (resp.status !== 'AGUARDANDO_CHEFE_DIV_MEDICINA_4') {
          console.log(`   ⚠️  PROBLEMA: Response selecionada tem status ${resp.status}, esperado AGUARDANDO_CHEFE_DIV_MEDICINA_4`);
        }
      });

      console.log('');
    }

    // 3. Buscar usuários CHEFE_DIV_MEDICINA para verificar organizações
    console.log('👥 USUÁRIOS CHEFE_DIV_MEDICINA:');
    const usuariosChefeDivMedicina = await prisma.user.findMany({
      where: {
        role: 'CHEFE_DIV_MEDICINA'
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    usuariosChefeDivMedicina.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} - Org: ${user.organization?.name} (${user.organizationId})`);
    });
    console.log('');

    // 4. Para cada usuário CHEFE_DIV_MEDICINA, simular o que ele veria
    console.log('🎯 SIMULAÇÃO: O que cada CHEFE_DIV_MEDICINA deveria ver');
    console.log('');

    for (const usuario of usuariosChefeDivMedicina) {
      console.log(`👤 USUÁRIO: ${usuario.name} (Org: ${usuario.organization?.name})`);
      
      // Filtrar solicitações que este usuário deveria ver
      const solicitacoesParaUsuario = solicitacoesChefeDivMedicina.filter(req => {
        const responsesSelecionadas = req.requestResponses.filter(r => r.selected === true);
        return responsesSelecionadas.some(r => r.receiverId === usuario.organizationId);
      });

      console.log(`   Solicitações que deveria ver: ${solicitacoesParaUsuario.length}`);

      solicitacoesParaUsuario.forEach((req, idx) => {
        const responseSelecionada = req.requestResponses.find(r => r.selected === true && r.receiverId === usuario.organizationId);
        console.log(`   ${idx + 1}. Request ${req.id} - Response status: ${responseSelecionada?.status}`);
        
        if (responseSelecionada?.status === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4') {
          console.log(`        ✅ CORRETO: Apareceria como PENDENTE`);
        } else {
          console.log(`        ❌ PROBLEMA: Apareceria como ${responseSelecionada?.status || 'DESCONHECIDO'}`);
        }
      });
      console.log('');
    }

    // 5. Verificar responses com status diferente de AGUARDANDO_CHEFE_DIV_MEDICINA_4
    console.log('🔍 VERIFICANDO RESPONSES COM STATUS INCONSISTENTE:');
    const responsesInconsistentes = await prisma.requestResponse.findMany({
      where: {
        request: {
          status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
        },
        NOT: {
          status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
        }
      },
      include: {
        request: {
          select: {
            id: true,
            status: true
          }
        },
        receiver: {
          select: {
            name: true
          }
        }
      }
    });

    if (responsesInconsistentes.length > 0) {
      console.log(`⚠️  Encontradas ${responsesInconsistentes.length} responses com status inconsistente:`);
      responsesInconsistentes.forEach((resp, idx) => {
        console.log(`${idx + 1}. Response ${resp.id}:`);
        console.log(`   - Request: ${resp.request.id} (status: ${resp.request.status})`);
        console.log(`   - Response status: ${resp.status}`);
        console.log(`   - Receiver: ${resp.receiver?.name} (${resp.receiverId})`);
        console.log(`   - Selected: ${resp.selected}`);
      });
    } else {
      console.log('✅ Não foram encontradas responses com status inconsistente');
    }

  } catch (error) {
    console.error('❌ Erro ao investigar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar investigação
investigarChefeDivMedicina();
