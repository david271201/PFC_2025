const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRequest() {
  try {
    // Buscando a solicitação específica com o ID mencionado
    const request = await prisma.request.findUnique({
      where: {
        id: '6191d1a1-fe1f-4889-bbdf-a79fd7217c66'
      },
      include: {
        pacient: true,  // Incluindo os dados do paciente
        sender: true,   // Incluindo os dados da organização solicitante
        requestResponses: true, // Incluindo as respostas à solicitação
        formulariosRegistrados: true, // Incluindo formulários médicos associados
        actions: true   // Incluindo log de ações
      }
    });
    
    console.log('Resultado da consulta:');
    console.log(JSON.stringify(request, null, 2));
    
    if (!request) {
      console.log('Solicitação não encontrada! Verificando se existem outras solicitações no sistema...');
      
      // Se não encontrar, vamos verificar quantas solicitações existem no sistema
      const allRequests = await prisma.request.findMany({
        take: 5, // Limitando a 5 resultados para não sobrecarregar o console
        select: {
          id: true,
          description: true,
          pacientCpf: true,
          status: true
        }
      });
      
      console.log('Primeiras 5 solicitações encontradas:');
      console.log(JSON.stringify(allRequests, null, 2));
    }
  } catch (error) {
    console.error('Erro ao consultar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRequest();
