import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarPatentesExistentes() {
  try {
    console.log('🎖️ Verificando patentes existentes no banco...\n');
    
    const pacients = await prisma.pacient.findMany({
      select: {
        rank: true,
        name: true,
        cpf: true
      }
    });
    
    // Coletar todas as patentes únicas
    const patentesUnicas = [...new Set(pacients.map(p => p.rank))];
    
    console.log('📋 Patentes encontradas no banco:');
    patentesUnicas.forEach((patente, index) => {
      const count = pacients.filter(p => p.rank === patente).length;
      console.log(`${index + 1}. "${patente}" (${count} paciente${count > 1 ? 's' : ''})`);
    });
    
    console.log('\n🎯 Patentes no código atual:');
    const MILITARY_RANKS = [
      '2º Tenente',
      '1º Tenente', 
      'Capitão',
      'Major',
      'Tenente-Coronel',
      'Coronel',
      'General de Brigada',
      'General de Divisão',
      'General de Exército',
      'Marechal',
      'Dependente'
    ];
    
    MILITARY_RANKS.forEach((patente, index) => {
      console.log(`${index + 1}. "${patente}"`);
    });
    
    console.log('\n🔍 Comparação:');
    patentesUnicas.forEach(patenteDB => {
      const existe = MILITARY_RANKS.includes(patenteDB);
      console.log(`"${patenteDB}" → ${existe ? '✅ Presente' : '❌ Ausente'} no array`);
    });
    
    console.log('\n💡 Sugestões de correção:');
    patentesUnicas.forEach(patenteDB => {
      if (!MILITARY_RANKS.includes(patenteDB)) {
        // Tentar encontrar correspondência
        if (patenteDB === 'Segundo Tenente') {
          console.log(`   "${patenteDB}" → deve ser "2º Tenente"`);
        } else if (patenteDB === 'Primeiro Tenente') {
          console.log(`   "${patenteDB}" → deve ser "1º Tenente"`);
        } else {
          console.log(`   "${patenteDB}" → adicionar ao array ou mapear`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPatentesExistentes();
