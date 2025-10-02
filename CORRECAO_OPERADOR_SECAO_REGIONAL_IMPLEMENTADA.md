# CORREÇÃO: Roteamento OPERADOR_SECAO_REGIONAL por Região da Organização Solicitada - IMPLEMENTADA

## 🎯 PROBLEMA IDENTIFICADO
**URL afetada:** `http://localhost:3002/solicitacoes`  
**Status afetado:** `AGUARDANDO_OPERADOR_SECAO_REGIONAL`  
**Sintoma:** Solicitações com status `AGUARDANDO_OPERADOR_SECAO_REGIONAL` estavam sendo direcionadas para o operador da região militar **errada**

### Exemplo do Problema
- **Solicitação:** PMPV (1RM) → HMASP (2RM)
- **Status:** `AGUARDANDO_OPERADOR_SECAO_REGIONAL`
- **Comportamento Incorreto:** Aparecia para OPERADOR da 1RM (região do remetente)
- **Comportamento Correto:** Deveria aparecer para OPERADOR da 2RM (região do destino)

## 🔍 CAUSA RAIZ
A API `/pages/api/requests/index.ts` estava usando a **região do remetente** para filtrar solicitações para todos os papéis, incluindo `OPERADOR_SECAO_REGIONAL`:

```typescript
// ❌ LÓGICA PROBLEMÁTICA (ANTES)
if (dbUser.regionId && dbUser.regionId !== 'dsau') {
  whereClause = {
    sender: {
      regionId: dbUser.regionId, // ← Filtrava pela região do REMETENTE
    },
  };
}
```

### Por que estava errado?
Para o status `AGUARDANDO_OPERADOR_SECAO_REGIONAL`, o operador responsável deve ser da região militar da **organização solicitada** (destino), não da organização **solicitante** (origem).

**Lógica correta:** O `OPERADOR_SECAO_REGIONAL` da 2RM deve processar solicitações que vão **para** organizações da 2RM, independentemente de **onde** venham.

## ✅ SOLUÇÃO IMPLEMENTADA
**Arquivo modificado:** `/pages/api/requests/index.ts`

### Nova Lógica (DEPOIS):
```typescript
// ✅ LÓGICA CORRIGIDA
// Lógica especial para papéis que devem ver solicitações baseado na região das organizações solicitadas:
// - CHEM: sempre usa região de destino
// - CHEFE_SECAO_REGIONAL: APENAS para status 1 e 2 (não para status 3 que tem lógica própria)  
// - OPERADOR_SECAO_REGIONAL: sempre usa região de destino
if ((role === 'CHEM' || role === 'OPERADOR_SECAO_REGIONAL' || (role === 'CHEFE_SECAO_REGIONAL' && !dbUser.organizationId)) && dbUser.regionId && dbUser.regionId !== 'dsau') {
  // Para CHEM, OPERADOR_SECAO_REGIONAL e CHEFE_SECAO_REGIONAL (status 1 e 2), filtrar por solicitações onde as organizações de destino sejam da mesma região
  const organizationsInRegion = await prisma.organization.findMany({
    where: { regionId: dbUser.regionId },
    select: { id: true }
  });
  
  const organizationIds = organizationsInRegion.map(org => org.id);
  
  whereClause = {
    requestedOrganizationIds: {
      hasSome: organizationIds, // ← Filtra pela região do DESTINO
    },
  };
  
  console.log(`${role} Filter: Região ${dbUser.regionId}, organizações: [${organizationIds.join(', ')}]`);
} else if (dbUser.regionId && dbUser.regionId !== 'dsau') {
  // Para outros papéis, usar a lógica original (região do remetente)
  whereClause = {
    sender: {
      regionId: dbUser.regionId,
    },
  };
}
```

## 🔧 MUDANÇA TÉCNICA
1. **Inclusão na condição especial:** `role === 'OPERADOR_SECAO_REGIONAL'`
2. **Filtro por destino:** `requestedOrganizationIds.hasSome`  
3. **Logs para debugging:** Para acompanhar o funcionamento
4. **Preservação da lógica original:** Para outros papéis

## 🎯 RESULTADO
### Cenário de Teste
**Dados:** 
- PMPV (1RM), HCE (1RM), HMRJ (1RM), HMASP (2RM)

### Antes da Correção ❌
**OPERADOR_SECAO_REGIONAL da 1RM veria:**
- PMPV → HCE ✓ (remetente 1RM)
- PMPV → HMASP ✓ (remetente 1RM) ← **INCORRETO**
- HCE → HMRJ ✓ (remetente 1RM)  
- HMASP → PMPV ✗ (remetente 2RM) ← **INCORRETO**

**OPERADOR_SECAO_REGIONAL da 2RM veria:**
- HMASP → qualquer ✓ (remetente 2RM)
- Mas não veria solicitações **para** HMASP vindas de outras regiões ← **INCORRETO**

### Depois da Correção ✅
**OPERADOR_SECAO_REGIONAL da 1RM vê:**
- PMPV → HCE ✓ (destino 1RM) ← **CORRETO**
- PMPV → HMASP ✗ (destino 2RM) ← **CORRETO**
- HCE → HMRJ ✓ (destino 1RM) ← **CORRETO**
- HMASP → PMPV ✓ (destino 1RM) ← **CORRETO**

**OPERADOR_SECAO_REGIONAL da 2RM vê:**
- PMPV → HMASP ✓ (destino 2RM) ← **CORRETO**
- Qualquer → HMASP ✓ (destino 2RM) ← **CORRETO**

## 📊 IMPACTO
- **OPERADOR_SECAO_REGIONAL**: Agora vê apenas solicitações para organizações de sua região
- **CHEM**: Funcionamento inalterado (já corrigido anteriormente)
- **CHEFE_SECAO_REGIONAL**: Funcionamento inalterado (já corrigido anteriormente)
- **Outros papéis**: Continuam funcionando normalmente (região do remetente)
- **Performance**: Preservada (query otimizada com `hasSome`)

## 🧪 TESTE REALIZADO
Script de validação criado: `test-operador-secao-regional-fix.js`

```bash
# Resultado do teste
✅ OPERADOR_SECAO_REGIONAL da 1RM:
   ✓ PMPV → HCE: 🟢 DEVE VER (destino na sua região)
   ✓ PMPV → HMASP: 🔴 NÃO DEVE VER (destino em outra região)  
   ✓ HCE → HMRJ: 🟢 DEVE VER (destino na sua região)
   ✓ HMASP → PMPV: 🟢 DEVE VER (destino na sua região)

✅ OPERADOR_SECAO_REGIONAL da 2RM:
   ✓ PMPV → HCE: 🔴 NÃO DEVE VER (destino em outra região)
   ✓ PMPV → HMASP: 🟢 DEVE VER (destino na sua região)
   ✓ HCE → HMRJ: 🔴 NÃO DEVE VER (destino em outra região)
   ✓ HMASP → PMPV: 🔴 NÃO DEVE VER (destino em outra região)
```

## 🔍 LOGS DE DEBUGGING
O sistema agora gera logs para acompanhar o funcionamento:
```
OPERADOR_SECAO_REGIONAL Filter: Região 1RM, organizações: [pmpv, hce, hmrj]
OPERADOR_SECAO_REGIONAL Filter: Região 2RM, organizações: [hmasp]
```

## 📝 OBSERVAÇÕES IMPORTANTES
1. **Compatibilidade:** Não afeta outros papéis ou funcionalidades
2. **Consistência:** Agora segue o mesmo padrão do CHEM e CHEFE_SECAO_REGIONAL
3. **Escalabilidade:** Funciona com qualquer número de regiões/organizações
4. **Manutenibilidade:** Código bem documentado e testado
5. **Prisma Query:** Usa `hasSome` para verificar interseção de arrays

## 🔄 PAPÉIS COM LÓGICA DE REGIÃO DE DESTINO
Após esta correção, os seguintes papéis usam lógica de **região de destino**:

1. **`CHEM`** (todos os status)
2. **`CHEFE_SECAO_REGIONAL`** (apenas status 1 e 2)
3. **`OPERADOR_SECAO_REGIONAL`** (todos os status) ← **NOVO**

**Outros papéis** continuam usando lógica de **região de remetente**.

---
**Data da correção:** 1 de outubro de 2025  
**Branch:** master  
**Status:** ✅ IMPLEMENTADO E TESTADO  
**Impacto:** Correção crítica para o roteamento correto de solicitações OPERADOR_SECAO_REGIONAL
