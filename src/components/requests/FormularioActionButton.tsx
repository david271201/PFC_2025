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
  // Removida a necessidade de session e isOmsDestino
  
  // Simplificado: não precisamos mais verificar se o usuário é da OMS de destino
  console.log(`Verificando botão para ${userRole} na solicitação ${requestId} com status ${requestStatus}`);  // Verifica se deve mostrar o botão baseado apenas no papel do usuário e status da solicitação
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
    if (shouldShowChefeDiv) {
      router.push(`/cadastro-med/cadastro?requestId=${requestId}`);
    } else if (shouldShowChefeSecReg) {
      router.push(`/equipamentos/cadastro-parte2?requestId=${requestId}`);
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
