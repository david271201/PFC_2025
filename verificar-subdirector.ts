import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarUsuariosSubdiretor() {
  try {
    console.log('👥 Verificando usuários SUBDIRETOR_SAUDE...\n');
    
    const subdirectores = await prisma.user.findMany({
      where: {
        role: Role.SUBDIRETOR_SAUDE
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true
      }
    });
    
    console.log(`📊 Total de subdirectores: ${subdirectores.length}\n`);
    
    if (subdirectores.length === 0) {
      console.log('❌ Nenhum usuário SUBDIRETOR_SAUDE encontrado!');
      console.log('💡 Criando usuário de teste...\n');
      
      const novoSubdiretor = await prisma.user.create({
        data: {
          name: 'Subdiretor Teste',
          email: 'subdiretor@teste.com',
          cpf: '00000000001',
          password: '$2a$10$dummyhashedpasswordfortest', // Hash dummy
          role: Role.SUBDIRETOR_SAUDE
        }
      });
      
      console.log('✅ Usuário criado:');
      console.log(`   Nome: ${novoSubdiretor.name}`);
      console.log(`   Email: ${novoSubdiretor.email}`);
      console.log(`   CPF: ${novoSubdiretor.cpf}`);
      console.log('   Password: senha123 (usar para login)\n');
      
    } else {
      console.log('✅ Usuários SUBDIRETOR_SAUDE encontrados:');
      subdirectores.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   CPF: ${user.cpf}`);
        console.log(`   Role: ${user.role}`);
        console.log('');
      });
    }
    
    console.log('🔑 Para testar a página de pacientes:');
    console.log('1. Acesse http://localhost:3000');
    console.log('2. Faça login com um dos usuários SUBDIRETOR_SAUDE');
    console.log('3. Clique no botão "Pacientes" no menu superior');
    console.log('4. Você deve ver a lista de pacientes');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarUsuariosSubdiretor();
