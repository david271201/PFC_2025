import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '../common/button';
import { useSession } from 'next-auth/react';
import { UserType } from '@/permissions/utils';

interface FormularioActionButtonProps {
  requestId: string;
  userRole: string;
  requestStatus: string;
}

const FormularioActionButton: React.FC<FormularioActionButtonProps> = ({ requestId, userRole, requestStatus }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOmsDestino, setIsOmsDestino] = useState(false);
  
  // Verificar se o usuário é da OMS de destino
  useEffect(() => {
    const checkIfUserIsFromDestinationOMS = async () => {
      try {
        // Busca informações da solicitação
        const requestResponse = await fetch(`/api/requests/${requestId}`);
        const requestData = await requestResponse.json();
        
        if (requestData && session?.user) {
          // Buscar informações detalhadas do usuário
          const userResponse = await fetch(`/api/users/${(session.user as UserType).userId}`);
          const userData = await userResponse.json();
          
          // Verifica se o usuário está associado à organização destino
          const userOrganizationId = userData?.organizationId;
          const destinationOrgId = requestData.requestResponses?.find((resp: {selected: boolean}) => resp.selected)?.receiverId;
          
          setIsOmsDestino(userOrganizationId === destinationOrgId);
        }
      } catch (error) {
        console.error("Erro ao verificar se usuário é da OMS de destino:", error);
        setIsOmsDestino(false);
      }
    };
    
    if (requestId && session?.user) {
      checkIfUserIsFromDestinationOMS();
    }
  }, [requestId, session]);

  // Verifica se deve mostrar o botão baseado no papel do usuário e status da solicitação
  const shouldShowChefeDiv = userRole === 'CHEFE_DIV_MEDICINA' && 
    (requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4') && isOmsDestino;

  // Removida a condição para CHEM_3, já que foi substituído por CHEFE_SECAO_REGIONAL_3
  const shouldShowChem = false;

  const shouldShowChefeSecReg = (userRole === 'CHEFE_SECAO_REGIONAL') && 
    (
     requestStatus === 'AGUARDANDO_CHEFE_SECAO_REGIONAL_3');

  if (!shouldShowChefeDiv && !shouldShowChefeSecReg && !shouldShowChem) {
    return null;
  }

  const handleClick = () => {
    if (shouldShowChefeDiv) {
      router.push(`/equipamentos/cadastro?requestId=${requestId}`);
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
