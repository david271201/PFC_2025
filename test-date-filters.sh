#!/bin/bash

# Script para testar os filtros de data na API de estatísticas
echo "=== Testando Filtros de Data na API de Estatísticas ==="

# Fazer login e obter cookie de sessão
echo "1. Fazendo login..."
RESPONSE=$(curl -s -c cookies.txt -X POST "http://localhost:3001/api/auth/signin/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subdiretor@teste.com",
    "password": "123456"
  }')

echo "✅ Login realizado"

# Testar API de estatísticas sem filtros de data
echo ""
echo "2. Testando API sem filtros de data..."
curl -s -b cookies.txt "http://localhost:3001/api/stats?regions=&organizations=" | jq '.requestsByOrganization | length'

# Testar API de estatísticas com filtro de data inicial
echo ""
echo "3. Testando API com data inicial (2024-01-01)..."
curl -s -b cookies.txt "http://localhost:3001/api/stats?regions=&organizations=&startDate=2024-01-01" | jq '.requestsByOrganization | length'

# Testar API de estatísticas com filtro de período
echo ""
echo "4. Testando API com período (2024-01-01 a 2024-12-31)..."
curl -s -b cookies.txt "http://localhost:3001/api/stats?regions=&organizations=&startDate=2024-01-01&endDate=2024-12-31" | jq '.requestsByOrganization | length'

# Testar API de custos com filtros de data
echo ""
echo "5. Testando API de custos com filtros de data..."
curl -s -b cookies.txt "http://localhost:3001/api/stats/custos?startDate=2024-01-01&endDate=2024-12-31" | jq '.resumoGeral.quantidadeSolicitacoes'

# Limpar cookies
rm -f cookies.txt

echo ""
echo "=== Teste concluído ==="
