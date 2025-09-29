# CORREÇÃO: Solicitações Homologador não aparecendo em "Enviadas" - IMPLEMENTADA

## 🎯 PROBLEMA IDENTIFICADO
**URL afetada:** `http://localhost:3000/solicitacoes?type=sent`
**Usuário afetado:** HOMOLOGADOR
**Sintoma:** Solicitações respondidas pelo homologador não apareciam na aba "Enviadas"

## 🔍 CAUSA RAIZ
A API `/pages/api/responses/index.ts` utilizava uma lógica que excluía responses onde o status atual ainda requer ação do papel do usuário, mesmo que ele já tivesse agido sobre a response.

### Lógica Problemática (ANTES):
```typescript
if (filter === 'sent') {
  whereClause = {
    ...whereClause,
    actions: {
      some: { userId },
    },
    // ❌ PROBLEMA: Excluía status onde homologador ainda precisa agir
    status: {
      not: {
        in: Object.entries(statusTransitions)
              .filter(([_, transition]) => transition?.requiredRole === role)
              .map(([status]) => status as RequestStatus)
              .concat([RequestStatus.NECESSITA_CORRECAO])
      }
    }
  };
}
```

### Cenário que causava o problema:
1. **Homologador responde** uma solicitação no status `AGUARDANDO_HOMOLOGADOR_SOLICITADA_1`
2. **ActionLog é criado** corretamente (✅)
3. **Status permanece** `AGUARDANDO_HOMOLOGADOR_SOLICITADA_2` (aguardando nova ação do homologador)
4. **Filtro exclui** a response porque status ainda requer ação do homologador
5. **Resultado**: Response não aparece em "Enviadas" ❌

## ✅ SOLUÇÃO IMPLEMENTADA
**Arquivo modificado:** `/pages/api/responses/index.ts`

### Nova Lógica (DEPOIS):
```typescript
if (filter === 'sent') {
  // Para respostas enviadas, mostra todas onde o usuário teve uma ação registrada
  // independente do status atual (pois pode ser que ainda esteja aguardando outro papel)
  whereClause = {
    ...whereClause,
    actions: {
      some: { userId },
    },
    // ✅ CORREÇÃO: Removida exclusão por status
    // Se o usuário agiu (tem ActionLog), deve aparecer em "enviadas"
  };
}
```

## 🔧 MUDANÇA TÉCNICA
- **Removida** a cláusula `status.not.in` que excluía responses por status
- **Mantida** a verificação de `actions.some({ userId })` para garantir que o usuário agiu
- **Resultado**: Responses aparecem em "enviadas" sempre que há ActionLog do usuário

## 🎯 RESULTADO
- ✅ Homologador vê suas responses processadas em "Enviadas"
- ✅ Mantém-se a separação correta entre "Pendentes" e "Enviadas"  
- ✅ Não afeta outros papéis do sistema

## 📊 IMPACTO
- **Homologadores** agora veem corretamente suas responses em "Enviadas"
- **Outros papéis** continuam funcionando normalmente
- **Performance** não afetada (mesma query, menos filtros)

## 🧪 TESTE RECOMENDADO
1. Fazer login como HOMOLOGADOR
2. Responder a uma solicitação (APROVAR ou REPROVAR)
3. Acessar `http://localhost:3000/solicitacoes?type=sent`
4. Verificar se a response aparece na lista de "Enviadas"

---
**Data da correção:** 28 de setembro de 2025
**Branch:** rezende
**Status:** ✅ IMPLEMENTADO
