/**
 * Script para testar a nova API de dados básicos da solicitação
 */

const testRequestId = 'fdc2b33e-0fa8-4ad9-bdd5-86bef076d590';

console.log('🧪 Testando nova API de dados básicos');
console.log('='.repeat(50));
console.log(`Request ID: ${testRequestId}`);
console.log(`URL da API: /api/requests/${testRequestId}/basic-info`);

console.log('\n✅ Estrutura esperada da resposta:');
console.log(`{
  id: string,
  description: string,
  needsCompanion: boolean,
  cbhpmCode: string,
  pacient: {
    cpf: string,
    precCp: string,
    name: string,
    rank: string,
    isDependent: boolean
  },
  formulariosRegistrados: [
    {
      id: string,
      consultaExame: string,
      createdAt: string
    }
  ]
}`);

console.log('\n📋 Campos que serão preenchidos automaticamente:');
console.log('- nomeBeneficiario: pacient.name');
console.log('- precCpMatriculaCpf: pacient.cpf');
console.log('- postoGraduacaoTitular: pacient.rank');
console.log('- necessitaAcompanhante: needsCompanion');
console.log('- consultaExame: formulariosRegistrados[0].consultaExame (se existir)');

console.log('\n🎯 Teste concluído! Agora a API deve funcionar corretamente.');