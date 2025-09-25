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
  
  // Log simples para depuração
  console.log("FormularioActionButton - Dados recebidos:", {
    requestId,
    userRole,
    requestStatus
  });

  // Verifica se deve mostrar o botão baseado no papel do usuário e status da solicitação
  // Lógica simplificada: se o papel e status estão corretos, mostra o botão
  const shouldShowChefeDiv = userRole === 'CHEFE_DIV_MEDICINA' && 
    requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4';

  const shouldShowChem = false; // Removido

  const shouldShowChefeSecReg = userRole === 'CHEFE_SECAO_REGIONAL' && 
    requestStatus === 'AGUARDANDO_CHEFE_SECAO_REGIONAL_3';
    
  // Log DETALHADO para depuração do FormularioActionButton
  console.log("🔍 FormularioActionButton - Análise detalhada:", {
    // Dados recebidos
    requestId,
    userRole,
    requestStatus,
    
    // Verificações específicas
    isChefeDivMedicina: userRole === 'CHEFE_DIV_MEDICINA',
    isStatusCorreto: requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4',
    
    // Resultados das condições
    shouldShowChefeDiv: shouldShowChefeDiv,
    shouldShowChem: shouldShowChem,
    shouldShowChefeSecReg: shouldShowChefeSecReg,
    
    // Decisão final
    willRenderButton: shouldShowChefeDiv || shouldShowChefeSecReg || shouldShowChem,
    
    // Timestamp para tracking
    timestamp: new Date().toISOString()
  });

  if (!shouldShowChefeDiv && !shouldShowChefeSecReg && !shouldShowChem) {
    console.log("❌ FormularioActionButton - Retornando NULL (botão não será exibido)");
    return null;
  }
  
  console.log("✅ FormularioActionButton - Renderizando botão!");

  const handleClick = () => {
    console.log("🚀 FormularioActionButton - Redirecionando:", {
      shouldShowChefeDiv,
      shouldShowChefeSecReg,
      requestId,
      targetUrl: shouldShowChefeDiv ? `/cadastro-med/cadastro?requestId=${requestId}` : 
                 shouldShowChefeSecReg ? `/cadastro-med/cadastro-parte2?requestId=${requestId}` : 'none'
    });
    
    if (shouldShowChefeDiv) {
      router.push(`/cadastro-med/cadastro?requestId=${requestId}`);
    } else if (shouldShowChefeSecReg) {
      router.push(`/cadastro-med/cadastro-parte2?requestId=${requestId}`);
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
