-- Verificar custos OPME no banco de dados

-- Custos OPME nas solicitações
SELECT 
  id as request_id,
  opmeCost as opme_request,
  psaCost as psa_request,
  'REQUEST' as source
FROM Request 
WHERE opmeCost IS NOT NULL AND opmeCost > 0;

-- Custos OPME nas respostas
SELECT 
  id as response_id,
  requestId,
  opmeCost as opme_response,
  procedureCost,
  ticketCost,
  selected,
  'RESPONSE' as source
FROM RequestResponse 
WHERE opmeCost IS NOT NULL AND opmeCost > 0;
