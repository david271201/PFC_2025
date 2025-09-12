#!/bin/bash

# Script para testar a API de pacientes
echo "=== Testando API de Pacientes ==="

# Fazer login e obter cookie de sessão
echo "1. Fazendo login..."
COOKIE=$(curl -s -c - -X POST "http://localhost:3001/api/auth/signin/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subdiretor@teste.com",
    "password": "123456"
  }' | grep -o 'next-auth.session-token[^;]*')

if [ -z "$COOKIE" ]; then
  echo "❌ Falha no login"
  exit 1
fi

echo "✅ Login realizado com sucesso"
echo "Cookie: $COOKIE"

# Testar busca de pacientes
echo ""
echo "2. Testando busca de pacientes..."
RESPONSE=$(curl -s -b "$COOKIE" "http://localhost:3001/api/admin/pacients")
echo "Resposta da API:"
echo "$RESPONSE" | head -10

# Testar criação de novo paciente
echo ""
echo "3. Testando criação de novo paciente..."
CREATE_RESPONSE=$(curl -s -b "$COOKIE" -X POST "http://localhost:3001/api/admin/pacients" \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678912",
    "precCp": "TEST001",
    "name": "Paciente Teste",
    "rank": "Soldado",
    "isDependent": false
  }')

echo "Resposta da criação:"
echo "$CREATE_RESPONSE"

# Testar busca do paciente criado
echo ""
echo "4. Testando busca do paciente criado..."
GET_RESPONSE=$(curl -s -b "$COOKIE" "http://localhost:3001/api/admin/pacients/12345678912")
echo "Resposta da busca:"
echo "$GET_RESPONSE"

# Testar atualização do paciente
echo ""
echo "5. Testando atualização do paciente..."
UPDATE_RESPONSE=$(curl -s -b "$COOKIE" -X PUT "http://localhost:3001/api/admin/pacients/12345678912" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paciente Teste Atualizado",
    "rank": "Cabo"
  }')

echo "Resposta da atualização:"
echo "$UPDATE_RESPONSE"

# Testar exclusão do paciente
echo ""
echo "6. Testando exclusão do paciente..."
DELETE_RESPONSE=$(curl -s -b "$COOKIE" -X DELETE "http://localhost:3001/api/admin/pacients/12345678912")
echo "Resposta da exclusão:"
echo "$DELETE_RESPONSE"

echo ""
echo "=== Teste concluído ==="
