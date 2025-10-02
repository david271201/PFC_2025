# CORREÇÃO: Roteamento CHEM_1 por Região da Organização Solicitada - IMPLEMENTADA

## 🎯 PROBLEMA IDENTIFICADO
**URL afetada:** `http://localhost:3002/solicitacoes`
**Status afetado:** `AGUARDANDO_CHEM_1`
**Sintoma:** Solicitações com status `AGUARDANDO_CHEM_1` estavam sendo direcionadas para o CHEM da região militar **errada**

### Exemplo do Problema
- **Solicitação:** PMPV (1RM) → HMASP (2RM)
- **Status:** `AGUARDANDO_CHEM_1`
- **Comportamento Incorreto:** Aparecia para CHEM da 1RM 
- **Comportamento Correto:** Deveria aparecer para CHEM da 2RM

## 🔍 CAUSA RAIZ
A API `/pages/api/requests/index.ts` estava usando a **região do remetente** para filtrar solicitações para todos os papéis, incluindo CHEM:

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
Para o status `AGUARDANDO_CHEM_1`, o CHEM responsável deve ser da região militar da **organização solicitada** (destino), não da organização **solicitante** (origem).

## ✅ SOLUÇÃO IMPLEMENTADA
**Arquivo modificado:** `/pages/api/requests/index.ts`

### Nova Lógica (DEPOIS):
```typescript
// ✅ LÓGICA CORRIGIDA
// Lógica especial para CHEM: deve ver solicitações baseado na região das organizações solicitadas
if (role === 'CHEM' && dbUser.regionId && dbUser.regionId !== 'dsau') {
  // Para CHEM, filtrar por solicitações onde as organizações de destino sejam da mesma região
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
  
  console.log(`CHEM Filter: Região ${dbUser.regionId}, organizações: [${organizationIds.join(', ')}]`);
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
1. **Detecção específica para CHEM:** `role === 'CHEM'`
2. **Busca organizações da região:** `organizationsInRegion`
3. **Filtro por destino:** `requestedOrganizationIds.hasSome`
4. **Logs para debugging:** Para acompanhar o funcionamento
5. **Preservação da lógica original:** Para outros papéis

## 🎯 RESULTADO
### Cenário de Teste
**Dados:** 
- PMPV (1RM), HCE (1RM), HMASP (2RM)
- Solicitação: PMPV → HMASP (status: AGUARDANDO_CHEM_1)

### Antes da Correção ❌
- **CHEM da 1RM:** Veria a solicitação (INCORRETO)
- **CHEM da 2RM:** NÃO veria a solicitação (INCORRETO)

### Depois da Correção ✅
- **CHEM da 1RM:** NÃO vê a solicitação (CORRETO)
- **CHEM da 2RM:** Vê a solicitação (CORRETO)

## 📊 IMPACTO
- **CHEMs** agora veem apenas solicitações para organizações de sua região
- **Outros papéis** continuam funcionando normalmente (região do remetente)
- **Performance** preservada (query otimizada com `hasSome`)
- **Logs detalhados** para troubleshooting

## 🧪 TESTE REALIZADO
Script de validação criado: `test-chem1-region-fix.js`

```bash
# Resultado do teste
CHEM da 1RM pode ver organizações: [ 'pmpv', 'hce' ]
✓ PMPV (1RM) → HCE (1RM): 🟢 DEVE VER
✓ PMPV (1RM) → HMASP (2RM): 🔴 NÃO DEVE VER

CHEM da 2RM pode ver organizações: [ 'hmasp' ]
✓ PMPV (1RM) → HCE (1RM): 🔴 NÃO DEVE VER
✓ PMPV (1RM) → HMASP (2RM): 🟢 DEVE VER
```

## 🔍 LOGS DE DEBUGGING
O sistema agora gera logs para acompanhar o funcionamento:
```
CHEM Filter: Região 2RM, organizações: [hmasp]
```

## 📝 OBSERVAÇÕES IMPORTANTES
1. **Compatibilidade:** Não afeta outros papéis ou funcionalidades
2. **Escalabilidade:** Funciona com qualquer número de regiões/organizações
3. **Manutenibilidade:** Código bem documentado e testado
4. **Prisma Query:** Usa `hasSome` para verificar interseção de arrays

---
**Data da correção:** 1 de outubro de 2025
**Branch:** master
**Status:** ✅ IMPLEMENTADO E TESTADO
**Impacto:** Correção crítica para o roteamento correto de solicitações CHEM
