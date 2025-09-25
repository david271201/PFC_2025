import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarUsuarios() {
  try {
    console.log('👥 Verificando usuários no banco de dados...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log(`📊 Total de usuários: ${users.length}\n`);
    
    const subdiretor = users.filter(user => user.role === Role.SUBDIRETOR_SAUDE);
    console.log(`🎯 Usuários com role SUBDIRETOR_SAUDE: ${subdiretor.length}\n`);
    
    if (subdiretor.length === 0) {
      console.log('❌ Nenhum usuário com role SUBDIRETOR_SAUDE encontrado!');
      console.log('💡 Criando um usuário de teste com role SUBDIRETOR_SAUDE...\n');
      
      // Criar usuário subdiretor de teste
      const novoSubdiretor = await prisma.user.create({
        data: {
          name: 'Subdiretor Teste',
          email: 'subdiretor@teste.com',
          cpf: '00000000001',
          password: 'senha123', // Em produção seria hasheada
          role: Role.SUBDIRETOR_SAUDE
        }
      });
      
      console.log('✅ Usuário SUBDIRETOR_SAUDE criado:');
      console.log(`   Nome: ${novoSubdiretor.name}`);
      console.log(`   Email: ${novoSubdiretor.email}`);
      console.log(`   Role: ${novoSubdiretor.role}\n`);
    } else {
      console.log('✅ Usuários SUBDIRETOR_SAUDE encontrados:');
      subdiretor.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
      console.log('');
    }
    
    console.log('📋 Todos os usuários:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarUsuarios();
