import React from 'react';
import { useRouter } from 'next/router';
import Button from '../common/button';

interface FormularioActionButtonProps {
  requestId: string;
  userRole: string;
  requestStatus: string;
}

const FormularioActionButton: React.FC<FormularioActionButtonProps> = ({ requestId, userRole, requestStatus }) => {
  const router = useRouter();
  
  // Logs detalhados para depuração
  console.log('=== FormularioActionButton - Início ===');
  console.log(`Atual URL: ${typeof window !== 'undefined' ? window.location.href : 'não disponível'}`);
  console.log(`Params: userRole=${userRole}, requestStatus=${requestStatus}`);
  console.log(`requestId recebido: ${requestId}`);
  console.log(`Tipo do requestId: ${typeof requestId}`);
  console.log('Query params da URL atual:', router.query);
  
  // Simplificado: não precisamos mais verificar se o usuário é da OMS de destino
  console.log(`Verificando botão para ${userRole} na solicitação ${requestId} com status ${requestStatus}`); // Verifica se deve mostrar o botão baseado apenas no papel do usuário e status da solicitação
  // Não verificamos mais se o usuário é da organização receptora
  const shouldShowChefeDiv = userRole === 'CHEFE_DIV_MEDICINA' &&
    requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4';

  // Removida a condição para CHEM_3, já que foi substituído por CHEFE_SECAO_REGIONAL_3
  const shouldShowChem = false;

  // Para CHEFE_SECAO_REGIONAL_3, também não verificamos mais a organização
  const shouldShowChefeSecReg = userRole === 'CHEFE_SECAO_REGIONAL' &&
    requestStatus === 'AGUARDANDO_CHEFE_SECAO_REGIONAL_3';

  // Log para depuração do FormularioActionButton
  console.log("FormularioActionButton - Decisão final:", {
    shouldShowChefeDiv,
    shouldShowChem,
    shouldShowChefeSecReg,
    userRole,
    requestStatus
  });

  if (!shouldShowChefeDiv && !shouldShowChefeSecReg && !shouldShowChem) {
    return null;
  }

  const handleClick = () => {
    // Verificar se estamos na página de resposta a solicitação
    const isRequestResponsePage = typeof window !== 'undefined' && 
      window.location.pathname.includes('/solicitacoes/recebidas/');
    
    // Logs para depuração
    console.log('=== handleClick ===');
    console.log('isRequestResponsePage:', isRequestResponsePage);
    console.log('pathname:', typeof window !== 'undefined' ? window.location.pathname : 'N/A');
    
    // Use window.location.href para um redirecionamento mais confiável
    if (shouldShowChefeDiv) {
      // Log para debug com verificação extra
      console.log("Redirecionando para formulário de Chefe Div Med com requestId:", requestId);
      
      // Verificando se o ID é válido antes de redirecionar
      if (requestId && typeof requestId === 'string' && requestId.trim() !== '') {
        // Importante: Vamos garantir que o ID é o da solicitação original (requestId) e não o da resposta
        window.location.href = `/cadastro-med/cadastro?requestId=${requestId}`;
        console.log(`Redirecionando para: /cadastro-med/cadastro?requestId=${requestId}`);
      } else {
        console.error("ID de solicitação inválido:", requestId);
        alert("Erro: ID da solicitação não encontrado ou inválido.");
      }
    } else if (shouldShowChefeSecReg) {
      console.log("Redirecionando para formulário de Chefe Sec Reg com requestId:", requestId);
      
      // Verificando se o ID é válido antes de redirecionar
      if (requestId && typeof requestId === 'string' && requestId.trim() !== '') {
        window.location.href = `/cadastro-med/cadastro-parte2?requestId=${requestId}`;
        console.log(`Redirecionando para: /cadastro-med/cadastro-parte2?requestId=${requestId}`);
      } else {
        console.error("ID de solicitação inválido:", requestId);
        alert("Erro: ID da solicitação não encontrado ou inválido.");
      }
    }
  };

  let buttonText = 'Preencher Formulário';
  if (shouldShowChefeDiv) {
    buttonText = 'Preencher Formulário OMS Destino';
  } else if (shouldShowChem) {
    buttonText = 'Preencher Formulário DSAU';
  } else if (shouldShowChefeSecReg) {
    buttonText = 'Preencher Formulário RM Destino';
  }

  return (
    <Button
      onClick={handleClick}
      className="mb-4"
    >
      {buttonText}
    </Button>
  );
};

export default FormularioActionButton;
