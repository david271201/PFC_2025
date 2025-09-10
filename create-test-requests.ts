import { PrismaClient, RequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestRequests() {
  try {
    // Buscar organizações e pacientes existentes
    const organizations = await prisma.organization.findMany();
    const pacients = await prisma.pacient.findMany();
    
    if (organizations.length === 0 || pacients.length === 0) {
      console.log('Dados de organizações ou pacientes não encontrados');
      return;
    }

    // Criar algumas solicitações de teste com custos variados
    const testRequests = [
      {
        pacientCpf: pacients[0].cpf,
        senderId: organizations[0].id,
        cbhpmCode: '10101012',
        needsCompanion: false,
        opmeCost: 150000, // R$ 1.500,00
        psaCost: 50000,   // R$ 500,00
        status: RequestStatus.APROVADO,
        requestedOrganizationIds: [organizations[1]?.id || organizations[0].id],
      },
      {
        pacientCpf: pacients[1]?.cpf || pacients[0].cpf,
        senderId: organizations[1]?.id || organizations[0].id,
        cbhpmCode: '10101013',
        needsCompanion: true,
        opmeCost: 300000, // R$ 3.000,00
        psaCost: 100000,  // R$ 1.000,00
        status: RequestStatus.APROVADO,
        requestedOrganizationIds: [organizations[0].id],
      },
      {
        pacientCpf: pacients[2]?.cpf || pacients[0].cpf,
        senderId: organizations[2]?.id || organizations[0].id,
        cbhpmCode: '10101014',
        needsCompanion: false,
        opmeCost: 80000,  // R$ 800,00
        psaCost: 30000,   // R$ 300,00
        status: RequestStatus.APROVADO,
        requestedOrganizationIds: [organizations[1]?.id || organizations[0].id],
      }
    ];

    for (const requestData of testRequests) {
      const request = await prisma.request.create({
        data: requestData
      });

      // Criar respostas correspondentes com custos
      await prisma.requestResponse.create({
        data: {
          requestId: request.id,
          receiverId: requestData.requestedOrganizationIds[0],
          status: RequestStatus.APROVADO,
          opmeCost: Math.floor(Math.random() * 100000) + 50000, // R$ 500 a R$ 1.500
          procedureCost: Math.floor(Math.random() * 200000) + 100000, // R$ 1.000 a R$ 3.000
          ticketCost: Math.floor(Math.random() * 50000) + 10000, // R$ 100 a R$ 600
          selected: true
        }
      });

      console.log(`Solicitação criada: ${request.id}`);
    }

    console.log('Solicitações de teste criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar solicitações de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRequests();
