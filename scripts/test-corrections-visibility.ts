import { PrismaClient, RequestStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function testCorrectionsVisibility() {
  try {
    console.log('🔧 Testando visibilidade de solicitações devolvidas para correção...\n');
    
    // 1. Buscar uma solicitação existente ou criar uma de teste
    let testRequest = await prisma.request.findFirst({
      where: {
        status: RequestStatus.NECESSITA_CORRECAO
      },
      include: {
        sender: { select: { name: true } },
        pacient: { select: { name: true } }
      }
    });

    if (!testRequest) {
      console.log('❌ Nenhuma solicitação com status NECESSITA_CORRECAO encontrada.');
      
      // Criar uma solicitação de teste
      const testPatient = await prisma.pacient.findFirst();
      const testOrg = await prisma.organization.findFirst();
      
      if (!testPatient || !testOrg) {
        console.log('❌ Não foi possível encontrar paciente ou organização para teste');
        return;
      }

      testRequest = await prisma.request.create({
        data: {
          pacientCpf: testPatient.cpf,
          senderId: testOrg.id,
          requestedOrganizationIds: [testOrg.id],
          status: RequestStatus.NECESSITA_CORRECAO,
          cbhpmCode: 'TEST123',
          needsCompanion: false,
          opmeCost: 1000.0,
          description: 'Solicitação de teste para correção'
        },
        include: {
          sender: { select: { name: true } },
          pacient: { select: { name: true } }
        }
      });
      
      console.log(`✅ Solicitação de teste criada: ${testRequest.id}`);
    }

    console.log(`📋 Testando com solicitação: ${testRequest.id}`);
    console.log(`   Paciente: ${testRequest.pacient.name}`);
    console.log(`   Organização: ${testRequest.sender.name}`);
    console.log(`   Status: ${testRequest.status}\n`);

    // 2. Testar visibilidade para diferentes roles
    const rolesToTest = [
      Role.OPERADOR_FUSEX,
      Role.CHEFE_FUSEX,
      Role.AUDITOR,
      Role.CHEFE_AUDITORIA,
      Role.ESPECIALISTA,
      Role.CHEFE_DIV_MEDICINA,
      Role.HOMOLOGADOR,
      Role.CHEM,
      Role.CHEFE_SECAO_REGIONAL,
      Role.SUBDIRETOR_SAUDE
    ];

    for (const testRole of rolesToTest) {
      // Buscar um usuário com essa role
      const user = await prisma.user.findFirst({
        where: { role: testRole },
        include: { organization: true }
      });

      if (!user) {
        console.log(`⚠️ Nenhum usuário encontrado com role ${testRole}`);
        continue;
      }

      // Simular a chamada da API /api/requests para solicitações pendentes (received)
      console.log(`\n🔍 Testando role: ${testRole} (user: ${user.name})`);
      
      // Simular a lógica da API
      const shouldSeeCorrection = testRole !== Role.OPERADOR_FUSEX && 
                                 [Role.CHEFE_FUSEX, Role.AUDITOR, Role.CHEFE_AUDITORIA, Role.ESPECIALISTA, 
                                  Role.CHEFE_DIV_MEDICINA, Role.COTADOR, Role.HOMOLOGADOR, Role.CHEM, 
                                  Role.CHEFE_SECAO_REGIONAL, Role.OPERADOR_SECAO_REGIONAL, Role.DRAS, 
                                  Role.SUBDIRETOR_SAUDE, Role.SUPERADMIN].includes(testRole);

      // Buscar solicitações que o usuário deveria ver nas pendentes
      const pendingRequests = await prisma.request.findMany({
        where: {
          status: RequestStatus.NECESSITA_CORRECAO
        },
        select: {
          id: true,
          status: true,
          pacient: { select: { name: true } }
        }
      });

      if (shouldSeeCorrection) {
        console.log(`   ✅ DEVE VER nas pendentes: ${pendingRequests.length > 0 ? 'SIM' : 'NÃO'}`);
        if (pendingRequests.length > 0) {
          console.log(`   📝 Solicitações encontradas: ${pendingRequests.map(r => r.id).join(', ')}`);
        }
      } else {
        console.log(`   ❌ NÃO deve ver nas pendentes (${testRole})`);
        if (testRole === Role.OPERADOR_FUSEX) {
          // Para OPERADOR_FUSEX, deve aparecer nas enviadas
          const sentRequests = await prisma.request.findMany({
            where: {
              status: RequestStatus.NECESSITA_CORRECAO,
              senderId: user.organizationId || ''
            },
            select: {
              id: true,
              status: true,
              senderId: true
            }
          });
          console.log(`   📤 DEVE VER nas enviadas: ${sentRequests.length > 0 ? 'SIM' : 'NÃO'}`);
          if (sentRequests.length > 0) {
            console.log(`   📝 Solicitações enviadas: ${sentRequests.map(r => r.id).join(', ')}`);
          }
        }
      }
    }

    console.log('\n✅ Teste de visibilidade concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCorrectionsVisibility();
