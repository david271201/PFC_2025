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

  // Verifica se deve mostrar o botão baseado no papel do usuário e status da solicitação
  const shouldShowChefeDiv = userRole === 'CHEFE_DIV_MEDICINA' && 
    (requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_1' || 
     requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_2' || 
     requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_3');

  const shouldShowChefeSecReg = (userRole === 'CHEFE_SECAO_REGIONAL' || userRole === 'OPERADOR_SECAO_REGIONAL') && 
    (requestStatus === 'AGUARDANDO_CHEFE_SECAO_REGIONAL_1' || 
     requestStatus === 'AGUARDANDO_OPERADOR_SECAO_REGIONAL');

  if (!shouldShowChefeDiv && !shouldShowChefeSecReg) {
    return null;
  }

  const handleClick = () => {
    if (shouldShowChefeDiv) {
      router.push(`/avaliacoes/chefe-div-medicina/${requestId}`);
    } else if (shouldShowChefeSecReg) {
      router.push(`/avaliacoes/chefe-secao-regional/${requestId}`);
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="mb-4"
    >
      {shouldShowChefeDiv ? 'Preencher Formulário OMS Destino' : 'Preencher Formulário RM Destino'}
    </Button>
  );
};

export default FormularioActionButton;
