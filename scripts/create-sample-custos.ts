import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleCustos() {
  try {
    console.log('Buscando usuários para criar custos de exemplo...');
    
    // Buscar alguns usuários para associar aos custos
    const users = await prisma.user.findMany({
      take: 5,
      include: {
        organization: {
          include: {
            region: true
          }
        },
        region: true
      }
    });

    if (users.length === 0) {
      console.log('Nenhum usuário encontrado. Crie usuários primeiro.');
      return;
    }

    console.log(`Encontrados ${users.length} usuários.`);

    // Dados de exemplo de custos
    const custosExemplo = [
      { descricao: 'Material médico-hospitalar', valor: 1500.00 },
      { descricao: 'Equipamentos de proteção individual', valor: 850.00 },
      { descricao: 'Medicamentos controlados', valor: 2300.00 },
      { descricao: 'Material de laboratório', valor: 680.00 },
      { descricao: 'Instrumentos cirúrgicos', valor: 3200.00 },
      { descricao: 'Material odontológico', valor: 420.00 },
      { descricao: 'Reagentes para exames', valor: 900.00 },
      { descricao: 'Material de curativo', valor: 350.00 },
      { descricao: 'Equipamentos de diagnóstico', valor: 4500.00 },
      { descricao: 'Material de escritório médico', valor: 180.00 },
      { descricao: 'Insumos para farmácia', valor: 1200.00 },
      { descricao: 'Material de fisioterapia', valor: 750.00 },
      { descricao: 'Equipamentos de emergência', valor: 2800.00 },
      { descricao: 'Material de enfermagem', valor: 450.00 },
      { descricao: 'Insumos radiológicos', valor: 1600.00 }
    ];

    console.log('Criando custos de exemplo...');

    for (let i = 0; i < custosExemplo.length; i++) {
      const custo = custosExemplo[i];
      const user = users[i % users.length]; // Distribuir entre os usuários disponíveis
      
      // Criar datas variadas nos últimos 6 meses
      const randomDate = new Date();
      randomDate.setMonth(randomDate.getMonth() - Math.floor(Math.random() * 6));
      randomDate.setDate(Math.floor(Math.random() * 28) + 1);

      await prisma.custo.create({
        data: {
          descricao: custo.descricao,
          valor: custo.valor,
          usuarioId: user.id,
          createdAt: randomDate
        }
      });

      console.log(`✓ Criado custo: ${custo.descricao} - ${custo.valor} (usuário: ${user.name})`);
    }

    console.log('✅ Custos de exemplo criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar custos de exemplo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleCustos();
