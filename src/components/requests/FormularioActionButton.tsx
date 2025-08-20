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
        // Busca informações detalhadas da solicitação
        const requestResponse = await fetch(`/api/requests/${requestId}`);
        if (!requestResponse.ok) {
          throw new Error(`Erro ao buscar solicitação: ${requestResponse.status}`);
        }
        const requestData = await requestResponse.json();
        
        if (requestData && session?.user) {
          // Buscamos o ID do usuário da sessão
          const userId = (session.user as UserType).userId;
          
          // Obtemos os detalhes do usuário para pegar o organizationId
          const userResponse = await fetch(`/api/users/${userId}`);
          if (!userResponse.ok) {
            throw new Error(`Erro ao buscar usuário: ${userResponse.status}`);
          }
          const userData = await userResponse.json();
          const userOrganizationId = userData?.organizationId;
          
          // Encontra a resposta selecionada
          const selectedResponse = requestData.requestResponses?.find((resp: {selected: boolean}) => resp.selected);
          const destinationOrgId = selectedResponse?.receiverId;
          
          // Informações de depuração detalhadas
          console.log("Debug FormularioActionButton:", {
            userId,
            userOrganizationId,
            userName: userData?.name,
            requestId,
            requestStatus,
            userRole,
            destinationOrgId,
            selectedResponseId: selectedResponse?.id,
            isMatch: userOrganizationId === destinationOrgId
          });
          
          // Verificação específica para CHEFE_DIV_MEDICINA_4
          if (requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4' && userRole === 'CHEFE_DIV_MEDICINA') {
            // A visibilidade depende se o usuário é da organização selecionada como receptora
            const isFromDestinationOMS = userOrganizationId === destinationOrgId;
            setIsOmsDestino(isFromDestinationOMS);
            
            // Log detalhado para depuração
            console.log(`CHEFE_DIV_MEDICINA_4: ${isFromDestinationOMS ? 'Mostrando' : 'Ocultando'} botão para ${userData?.name}`);
            console.log("Dados da solicitação:", {
              requestId,
              requestStatus,
              selectedResponse,
              allResponses: requestData.requestResponses,
              responseStatus: selectedResponse?.status
            });
          } 
          // Verificação específica para CHEFE_SECAO_REGIONAL_3
          else if (requestStatus === 'AGUARDANDO_CHEFE_SECAO_REGIONAL_3' && userRole === 'CHEFE_SECAO_REGIONAL') {
            // A visibilidade depende se o usuário é da organização correta
            const isFromDestinationOMS = userOrganizationId === destinationOrgId;
            setIsOmsDestino(isFromDestinationOMS);
            
            // Log detalhado para depuração
            console.log(`CHEFE_SECAO_REGIONAL_3: ${isFromDestinationOMS ? 'Mostrando' : 'Ocultando'} botão para ${userData?.name}`);
            console.log("Dados da solicitação para CHEFE_SECAO_REGIONAL_3:", {
              requestId,
              requestStatus,
              selectedResponse,
              allResponses: requestData.requestResponses,
              responseStatus: selectedResponse?.status
            });
          } 
          else {
            setIsOmsDestino(userOrganizationId === destinationOrgId);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar se usuário é da OMS de destino:", error);
        setIsOmsDestino(false);
      }
    };
    
    if (requestId && session?.user) {
      checkIfUserIsFromDestinationOMS();
    }
  }, [requestId, session, requestStatus, userRole]);

  // Verifica se deve mostrar o botão baseado no papel do usuário e status da solicitação
  // Para CHEFE_DIV_MEDICINA_4, verificamos se o usuário é da organização receptora
  const shouldShowChefeDiv = userRole === 'CHEFE_DIV_MEDICINA' && 
    (requestStatus === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4') && isOmsDestino;

  // Removida a condição para CHEM_3, já que foi substituído por CHEFE_SECAO_REGIONAL_3
  const shouldShowChem = false;

  // Para CHEFE_SECAO_REGIONAL_3, verificamos se o usuário é da organização receptora
  const shouldShowChefeSecReg = (userRole === 'CHEFE_SECAO_REGIONAL') && 
    (requestStatus === 'AGUARDANDO_CHEFE_SECAO_REGIONAL_3') && isOmsDestino;
    
  // Log para depuração do FormularioActionButton
  console.log("FormularioActionButton - Decisão final:", {
    shouldShowChefeDiv,
    shouldShowChem,
    shouldShowChefeSecReg,
    userRole,
    requestStatus,
    isOmsDestino
  });

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
