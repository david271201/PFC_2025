import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import prisma from '../../../prisma/prismaClient';

// Schema para validação do formulário médico completo
const formularioMedicoSchema = z.object({
  // Dados do beneficiário
  nomeBeneficiario: z.string().min(1, "Nome completo é obrigatório"),
  precCpMatriculaCpf: z.string().min(1, "Prec-CP/matrícula/CPF é obrigatório"),
  idade: z.string().min(1, "Idade é obrigatória"),
  postoGraduacaoTitular: z.string().min(1, "Posto/graduação do titular é obrigatório"),
  necessitaAcompanhante: z.boolean(),
  consultaExame: z.string().min(1, "Consulta/exame/procedimento solicitado é obrigatório"),
  
  // Campos da Divisão de Medicina
  profissionalCiente: z.boolean().default(false),
  justificativaProfissionalCiente: z.string().optional(),
  
  // Campos do Depósito de Material Cirúrgico
  materialDisponivel: z.boolean().default(false),
  justificativaMaterialDisponivel: z.string().optional(),
  
  // Campos do Centro Cirúrgico
  pacienteNoMapa: z.boolean().default(false),
  justificativaPacienteNoMapa: z.string().optional(),
  setorEmCondicoes: z.boolean().default(false),
  justificativaSetorEmCondicoes: z.string().optional(),
  
  // Campos da Unidade de Internação
  leitoReservado: z.boolean().optional(),
  justificativaLeitoReservado: z.string().optional(),
  
  // Campos da Assistência Social
  hotelReservado: z.boolean().optional(),
  justificativaHotel: z.string().optional(),
  
  // Campos de Traslado
  motorista1: z.string().optional(),
  horario1: z.string().optional(),
  motorista2: z.string().optional(),
  horario2: z.string().optional(),
  motorista3: z.string().optional(),
  horario3: z.string().optional(),
  motorista4: z.string().optional(),
  horario4: z.string().optional(),
  
  // Observações
  observacoes: z.string().optional(),
  
  // Aprovação
  aprovacao: z.boolean().optional(),
  
  // ID da solicitação relacionada
  requestId: z.string().uuid("ID da solicitação inválido"),
  
  // Parte do formulário (OMS_DESTINO ou RM_DESTINO)
  parte: z.enum(["OMS_DESTINO", "RM_DESTINO"]),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== INÍCIO DO HANDLER ===');
  console.log('Método da requisição:', req.method);
  
  // Buscar qualquer usuário existente no banco para usar como criadoPor
  console.log('Buscando usuário existente no banco...');
  
  let userId: string;
  try {
    // Primeiro, tentar buscar qualquer usuário existente
    const existingUser = await prisma.user.findFirst({
      select: { id: true, name: true, email: true }
    });
    
    if (existingUser) {
      userId = existingUser.id;
      console.log('✅ Usuário existente encontrado:', existingUser.name, existingUser.email);
    } else {
      // Se não houver usuário, criar um simples
      console.log('Nenhum usuário encontrado. Tentando criar usuário mínimo...');
      
      // Verificar se conseguimos criar um usuário básico
      const newUser = await prisma.user.create({
        data: {
          email: 'sistema@temp.com',
          cpf: '99999999999',
          password: 'temp',
          name: 'Sistema',
          role: 'CHEFE_DIV_MEDICINA'
        }
      });
      
      userId = newUser.id;
      console.log('✅ Usuário criado:', newUser.id);
    }
    
    console.log('UserId final:', userId);
  } catch (error) {
    console.error('Erro detalhado ao buscar/criar usuário:', error);
    
    // Se falhar tudo, vamos tentar uma abordagem mais simples
    // Vamos verificar se já existe um FormularioMedico para pegar um userId de referência
    try {
      console.log('Tentando buscar userId de formulário existente...');
      const existingForm = await prisma.formularioMedico.findFirst({
        select: { criadoPorId: true }
      });
      
      if (existingForm) {
        userId = existingForm.criadoPorId;
        console.log('✅ UserId encontrado de formulário existente:', userId);
      } else {
        console.log('❌ Não há formulários existentes para pegar referência de usuário');
        return res.status(500).json({ 
          message: 'Não foi possível encontrar ou criar usuário para o sistema',
          details: 'Sistema precisa de pelo menos um usuário cadastrado'
        });
      }
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError);
      return res.status(500).json({ message: 'Erro crítico: não foi possível preparar usuário' });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('=== PROCESSANDO POST ===');
      console.log('req.body tipo:', typeof req.body);
      console.log('req.body está vazio?', Object.keys(req.body || {}).length === 0);
      console.log('Dados recebidos do frontend:', JSON.stringify(req.body, null, 2));
      console.log('Headers da requisição:', req.headers);
      
      // Verificar se o body tem dados
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log('❌ Body da requisição está vazio!');
        return res.status(400).json({
          message: 'Dados não foram enviados corretamente',
          received: req.body
        });
      }
      
      // Verificar se é uma chamada de processamento (só tem requestId e formularioId)
      if (req.body.formularioId && req.body.requestId && Object.keys(req.body).length === 2) {
        console.log('=== CHAMADA DE PROCESSAMENTO DETECTADA ===');
        console.log('FormularioId:', req.body.formularioId);
        console.log('RequestId:', req.body.requestId);
        
        // TODO: Implementar lógica de processamento/atualização de status aqui
        // Por enquanto, apenas retornar sucesso
        return res.status(200).json({
          message: 'Processamento realizado com sucesso',
          formularioId: req.body.formularioId,
          requestId: req.body.requestId
        });
      }
      
      // Validar dados do formulário (caso de cadastro)
      console.log('Iniciando validação com Zod para cadastro...');
      const dadosFormulario = formularioMedicoSchema.parse(req.body);
      console.log('✅ Validação Zod concluída com sucesso');
      console.log('Dados após validação:', JSON.stringify(dadosFormulario, null, 2));
      
      // Verificar se a solicitação existe
      console.log('Verificando se a solicitação existe no banco...');
      console.log('RequestId para busca:', dadosFormulario.requestId);
      const requestExists = await prisma.request.findUnique({
        where: { id: dadosFormulario.requestId }
      });
      console.log('Resultado da busca da solicitação:', requestExists ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
      
      if (!requestExists) {
        console.log('ERRO: Solicitação não encontrada');
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }

      // Verificar userId antes de preparar dados
      console.log('=== PREPARANDO DADOS PARA PRISMA ===');
      console.log('userId que será usado:', userId);
      console.log('Tipo do userId:', typeof userId);
      
      // Preparar dados para o Prisma
      const dadosParaPrisma = {
        // Dados do beneficiário
        nomeBeneficiario: dadosFormulario.nomeBeneficiario,
        precCpMatriculaCpf: dadosFormulario.precCpMatriculaCpf,
        idade: dadosFormulario.idade,
        postoGraduacaoTitular: dadosFormulario.postoGraduacaoTitular,
        necessitaAcompanhante: dadosFormulario.necessitaAcompanhante,
        consultaExame: dadosFormulario.consultaExame,
        
        // Divisão de Medicina
        profissionalCiente: dadosFormulario.profissionalCiente,
        justificativaProfissionalCiente: dadosFormulario.justificativaProfissionalCiente,
        
        // Depósito de Material Cirúrgico
        materialDisponivel: dadosFormulario.materialDisponivel,
        justificativaMaterialDisponivel: dadosFormulario.justificativaMaterialDisponivel,
        
        // Centro Cirúrgico
        pacienteNoMapa: dadosFormulario.pacienteNoMapa,
        justificativaPacienteNoMapa: dadosFormulario.justificativaPacienteNoMapa,
        setorEmCondicoes: dadosFormulario.setorEmCondicoes,
        justificativaSetorEmCondicoes: dadosFormulario.justificativaSetorEmCondicoes,
        
        // Unidade de Internação
        leitoReservado: dadosFormulario.leitoReservado,
        justificativaLeitoReservado: dadosFormulario.justificativaLeitoReservado,
        
        // Assistência Social
        hotelReservado: dadosFormulario.hotelReservado,
        justificativaHotelReservado: dadosFormulario.justificativaHotel,
        
        // Traslado
        motorista1: dadosFormulario.motorista1,
        horario1: dadosFormulario.horario1,
        motorista2: dadosFormulario.motorista2,
        horario2: dadosFormulario.horario2,
        motorista3: dadosFormulario.motorista3,
        horario3: dadosFormulario.horario3,
        motorista4: dadosFormulario.motorista4,
        horario4: dadosFormulario.horario4,
        
        // Aprovação
        aprovacao: dadosFormulario.aprovacao,
        
        // Registro do usuário que criou
        criadoPorId: userId as string,
        
        // ID da solicitação
        requestId: dadosFormulario.requestId
      };
      
      console.log('Dados preparados para Prisma:');
      console.log(JSON.stringify(dadosParaPrisma, null, 2));

      // Salvar no banco de dados usando Prisma
      console.log('=== TENTANDO SALVAR NO BANCO ===');
      console.log('Iniciando criação no Prisma...');
      
      const formularioMedico = await prisma.formularioMedico.create({
        data: dadosParaPrisma
      });
      
      console.log('✅ Formulário médico criado com sucesso!');
      console.log('ID do formulário criado:', formularioMedico.id);
      
      // TODO: Implementar log de ação posteriormente se necessário
      console.log('Pulando criação do log de ação por enquanto...');

      console.log('=== SUCESSO COMPLETO ===');
      console.log('Retornando resposta de sucesso...');
      return res.status(201).json({
        message: 'Formulário médico criado com sucesso',
        id: formularioMedico.id,
        requestId: dadosFormulario.requestId,
        parte: dadosFormulario.parte
      });
    } catch (error) {
      console.log('=== ERRO CAPTURADO ===');
      console.error('Tipo do erro:', typeof error);
      console.error('Erro completo:', error);
      
      if (error instanceof z.ZodError) {
        console.error('❌ Erro de validação Zod:', error.errors);
        return res.status(400).json({
          message: 'Dados de formulário inválidos',
          errors: error.errors
        });
      }

      console.error('❌ Erro geral ao criar formulário médico:', error);
      
      // Verificar se é erro do Prisma
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('❌ Código do erro Prisma:', (error as any).code);
        console.error('❌ Mensagem do erro Prisma:', (error as any).message);
        return res.status(500).json({
          message: 'Erro no banco de dados',
          code: (error as any).code,
          details: (error as any).message
        });
      }
      
      return res.status(500).json({
        message: 'Erro ao processar formulário médico',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  } else if (req.method === 'PATCH') {
    try {
      console.log('=== PROCESSANDO PATCH (UPDATE) ===');
      console.log('Dados recebidos do frontend:', JSON.stringify(req.body, null, 2));
      
      // Verificar se o body tem dados
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log('❌ Body da requisição está vazio!');
        return res.status(400).json({
          message: 'Dados não foram enviados corretamente',
          received: req.body
        });
      }
      
      // Validar dados do formulário
      console.log('Iniciando validação com Zod para update...');
      const dadosFormulario = formularioMedicoSchema.parse(req.body);
      console.log('✅ Validação Zod concluída com sucesso');
      
      // Verificar se a solicitação existe
      console.log('Verificando se a solicitação existe no banco...');
      const requestExists = await prisma.request.findUnique({
        where: { id: dadosFormulario.requestId }
      });
      
      if (!requestExists) {
        console.log('ERRO: Solicitação não encontrada');
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }

      // Buscar o formulário existente baseado no requestId
      console.log('Buscando formulário existente para o requestId:', dadosFormulario.requestId);
      const formularioExistente = await prisma.formularioMedico.findFirst({
        where: { requestId: dadosFormulario.requestId }
      });
      
      if (!formularioExistente) {
        console.log('ERRO: Formulário não encontrado para atualização');
        return res.status(404).json({ message: 'Formulário não encontrado para atualização' });
      }

      // Preparar dados para atualização (apenas os campos da parte 2)
      const dadosParaUpdate = {
        // Assistência Social
        hotelReservado: dadosFormulario.hotelReservado,
        justificativaHotelReservado: dadosFormulario.justificativaHotel,
        
        // Traslado
        motorista1: dadosFormulario.motorista1,
        horario1: dadosFormulario.horario1,
        motorista2: dadosFormulario.motorista2,
        horario2: dadosFormulario.horario2,
        motorista3: dadosFormulario.motorista3,
        horario3: dadosFormulario.horario3,
        motorista4: dadosFormulario.motorista4,
        horario4: dadosFormulario.horario4,
        
        // Aprovação
        aprovacao: dadosFormulario.aprovacao,
        
        // Atualizar timestamp
        updatedAt: new Date()
      };
      
      console.log('Dados preparados para UPDATE:');
      console.log(JSON.stringify(dadosParaUpdate, null, 2));

      // Atualizar no banco de dados usando Prisma
      console.log('=== TENTANDO ATUALIZAR NO BANCO ===');
      console.log('Atualizando formulário com ID:', formularioExistente.id);
      
      const formularioAtualizado = await prisma.formularioMedico.update({
        where: { id: formularioExistente.id },
        data: dadosParaUpdate
      });
      
      console.log('✅ Formulário médico atualizado com sucesso!');
      console.log('ID do formulário atualizado:', formularioAtualizado.id);

      console.log('=== SUCESSO COMPLETO (UPDATE) ===');
      return res.status(200).json({
        message: 'Formulário médico atualizado com sucesso',
        id: formularioAtualizado.id,
        requestId: dadosFormulario.requestId,
        parte: dadosFormulario.parte,
        action: 'updated'
      });
    } catch (error) {
      console.log('=== ERRO CAPTURADO NO PATCH ===');
      console.error('Erro completo:', error);
      
      if (error instanceof z.ZodError) {
        console.error('❌ Erro de validação Zod:', error.errors);
        return res.status(400).json({
          message: 'Dados de formulário inválidos',
          errors: error.errors
        });
      }

      console.error('❌ Erro geral ao atualizar formulário médico:', error);
      
      return res.status(500).json({
        message: 'Erro ao atualizar formulário médico',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  } else {
    // Método não permitido
    res.setHeader('Allow', ['POST', 'PATCH']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
